import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { config } from '../set/config'; // Import config
import redTrashIcon from '../assets/red-trash-can-icon.svg'; // Updated path to src/assets/

interface User {
    id: number;
    nombre: string;
    apellido: string;
    username: string; // Added username field
}

export default function UserTable() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get<User[]>(`${config.apiUrl}/users/data`);
                setUsers(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch user data.');
                setLoading(false);
            }
        };

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

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Lista de Usuarios</h2>
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
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Acciones</th> {/* Added column */}
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
                                    </td> 
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}