import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { config } from '../set/config'; // Import config
import redTrashIcon from '../assets/red-trash-can-icon.svg'; // Updated path to src/assets/
import settingsIcon from '../assets/settings-icon.svg'; // Import settings icon
import editarIcon from '../assets/editar.svg'; // Import edit icon

interface User {
    id: number;
    nombre: string;
    apellido: string;
    username: string;
    procesos?: string[];
    rol?: string; // Añadir rol
}

export default function UserTable() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const procesos = ['Multiple1', 'Multiple2', 'Encolado1', 'Encolado2', 'Troqueladora Grande', 'Troqueladora Chica', 'Emplacado', 'Pegado','Plizado', 'Inventario','Trozado', 'Impresion', 'Calado'];
    const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registerNombre, setRegisterNombre] = useState('');
    const [registerApellido, setRegisterApellido] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerRol, setRegisterRol] = useState('Operador'); // Nuevo estado para el rol

    // Cambia la definición de fetchUsers para que TypeScript no infiera mal el tipo de user
    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${config.apiUrl}/users/data`);
            // Forzamos el tipo a any para evitar problemas de tipado con campos dinámicos
            const usersWithProcesses = (response.data as any[]).map(user => ({
                ...user,
                procesos: typeof user.procesos === 'string' ? JSON.parse(user.procesos || '[]') : [],
                rol: typeof user.rol === 'string' ? user.rol : 'Operador', // Solo string o default
            }));
            setUsers(usersWithProcesses);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch user data.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId: number) => {
        try {
            await axios.post(`${config.apiUrl}/users/delete`, { user_id: userId }); // Send POST request with user ID
            setUsers(users.filter(user => user.id !== userId)); // Update state after deletion
        } catch (err) {
            setError('Failed to delete user.');
        }
    };

    const handleOpenModal = (user: User) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setNewPassword('');
    };

    const handleChangePassword = async () => {
        if (selectedUser) {
            try {
                await axios.post(`${config.apiUrl}/users/change-password`, {
                    username: selectedUser.username,
                    newPassword: newPassword, // Updated key to match API requirement
                });
                alert('Password changed successfully!');
                handleCloseModal();
            } catch (err) {
                setError('Failed to change password.');
            }
        }
    };

    const handleOpenProcessModal = (user: User) => {
        setSelectedUser(user);
        setSelectedProcesses(user.procesos || []); // Pre-select processes from API
        setShowProcessModal(true);
    };

    const handleCloseProcessModal = () => {
        setShowProcessModal(false);
        setSelectedProcesses([]);
    };

    const handleProcessSelection = (process: string) => {
        setSelectedProcesses((prev) =>
            prev.includes(process)
                ? prev.filter((p) => p !== process)
                : [...prev, process]
        );
    };

    const handleSaveProcesses = async () => {
        if (selectedUser) {
            try {
                await axios.post(`${config.apiUrl}/users/procesos`, {
                    user_id: selectedUser.id,
                    procesos: selectedProcesses,
                });
                alert('Processes added successfully!');
                handleCloseProcessModal();
            } catch (err) {
                setError('Failed to add processes.');
            }
        }
    };

    const handleRegisterUser = async () => {
        try {
            await axios.post(`${config.apiUrl}/users/register`, {
                nombre: registerNombre,
                apellido: registerApellido,
                username: registerUsername,
                password: registerPassword,
                rol: registerRol,
            });
            alert('User registered successfully!');
            setShowRegisterModal(false);
            fetchUsers(); // Refresca la tabla para mostrar el rol correcto
        } catch (err) {
            setError('Failed to register user.');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Lista de Usuarios</h2>
            <button
                style={{
                    marginBottom: '20px',
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px',
                }}
                onClick={() => setShowRegisterModal(true)}
            >
                Registrar Usuario
            </button>
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p style={{ color: 'red' }}>{error}</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#c8a165', color: '#fff' }}>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nombre Completo</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Username</th> {/* Added column */}
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Rol</th> {/* Nueva columna */}
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user: User) => (
                                <tr key={user.id}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{user.id}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        {`${user.nombre} ${user.apellido}`}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{user.username}</td> {/* Added data */}
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        {user.rol || 'Operador'}
                                    </td> {/* Mostrar rol */}
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <img
                                                src={redTrashIcon}
                                                alt="Delete"
                                                style={{ width: '16px', height: '16px' }}
                                            /> {/* Use the SVG as an image */}
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal(user)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                marginLeft: '10px',
                                            }}
                                        >
                                            <img
                                                src={settingsIcon}
                                                alt="Settings"
                                                style={{ width: '16px', height: '16px' }}
                                            />
                                        </button>
                                        <button
                                            onClick={() => handleOpenProcessModal(user)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                marginLeft: '10px',
                                            }}
                                        >
                                            <img
                                                src={editarIcon}
                                                alt="Edit"
                                                style={{ width: '16px', height: '16px' }}
                                            />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '400px',
                            maxHeight: '80%',
                            overflowY: 'auto',
                            textAlign: 'center',
                        }}
                    >
                        <h3>Change Password for {selectedUser?.nombre} {selectedUser?.apellido}</h3>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password"
                            style={{
                                width: '100%',
                                padding: '10px',
                                margin: '10px 0',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                            }}
                        />
                        <div style={{ marginTop: '20px' }}>
                            <button
                                onClick={handleChangePassword}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#4CAF50',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginRight: '10px',
                                }}
                            >
                                Save
                            </button>
                            <button
                                onClick={handleCloseModal}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#f44336',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showProcessModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '400px',
                            maxHeight: '80%',
                            overflowY: 'auto',
                            textAlign: 'center',
                        }}
                    >
                        <h3>Select Processes for {selectedUser?.nombre} {selectedUser?.apellido}</h3>
                        <div style={{ textAlign: 'left', margin: '10px 0', maxHeight: '300px', overflowY: 'auto' }}> {/* Added scrollable container */}
                            {procesos.map((process) => (
                                <div key={process} style={{ marginBottom: '10px' }}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={selectedProcesses.includes(process)}
                                            onChange={() => handleProcessSelection(process)}
                                        />
                                        {process}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}> {/* Adjusted button layout */}
                            <button
                                onClick={handleSaveProcesses}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#4CAF50',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                Save
                            </button>
                            <button
                                onClick={handleCloseProcessModal}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#f44336',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de registro de usuario */}
            {showRegisterModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '400px',
                            maxHeight: '80%',
                            overflowY: 'auto',
                            textAlign: 'center',
                        }}
                    >
                        <h3>Registrar Nuevo Usuario</h3>
                        <input
                            type="text"
                            placeholder="Nombre"
                            value={registerNombre}
                            onChange={e => setRegisterNombre(e.target.value)}
                            style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <input
                            type="text"
                            placeholder="Apellido"
                            value={registerApellido}
                            onChange={e => setRegisterApellido(e.target.value)}
                            style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <input
                            type="text"
                            placeholder="Username"
                            value={registerUsername}
                            onChange={e => setRegisterUsername(e.target.value)}
                            style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={registerPassword}
                            onChange={e => setRegisterPassword(e.target.value)}
                            style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <select
                            value={registerRol}
                            onChange={e => setRegisterRol(e.target.value)}
                            style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="Superadmin">Superadmin</option>
                            <option value="Admin">Admin</option>
                            <option value="Operador">Operador</option>
                        </select>
                        <div style={{ marginTop: '20px' }}>
                            <button
                                onClick={handleRegisterUser}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#4CAF50',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginRight: '10px',
                                }}
                            >
                                Registrar
                            </button>
                            <button
                                onClick={() => setShowRegisterModal(false)}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#f44336',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}