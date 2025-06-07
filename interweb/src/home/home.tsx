import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import Axios
import { config } from '../set/config'; // Import config

export default function Home() {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/login');
            return;
        }
        try {
            const user = JSON.parse(userStr);
            setUserRole(user.rol || 'Operador');
        } catch {
            setUserRole('Operador');
        }
        // Fetch inventory data and store it in localStorage
        axios.get(`${config.apiUrl}/inventario/data`)
            .then(response => {
                localStorage.setItem('inventoryData', JSON.stringify(response.data));
            })
            .catch(error => {
                console.error('Error fetching inventory data:', error);
            });
    }, [navigate]); // Solo una vez

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Mostrar botones según el rol
    const renderButtons = () => {
        if (userRole === 'Superadmin') {
            return (
                <>
                    <a href="/inventario" style={{ ...styles.button, textDecoration: 'none' }}>
                        Ir a módulo de inventario
                    </a>
                    <a href="/programa-produccion" style={{ ...styles.button, textDecoration: 'none' }}>
                        Ir a módulo de programa de producción
                    </a>
                    <a href="/edicion" style={{ ...styles.button, textDecoration: 'none' }}>
                        Ir a módulo de edición de programa de producción
                    </a>
                    <a href="/users" style={{ ...styles.button, textDecoration: 'none' }}>
                        Ir a módulo de gestión de usuarios
                    </a>
                    <a href="/historial" style={{ ...styles.button, textDecoration: 'none' }}>
                        Ir a módulo de historial de procesos
                    </a>
                </>
            );
        }
        if (userRole === 'Admin') {
            return (
                <a href="/inventario" style={{ ...styles.button, textDecoration: 'none' }}>
                    Ir a módulo de inventario
                </a>
            );
        }
        // Operador u otro: solo inventario (puedes ajustar)
        return (
            <a href="/inventario" style={{ ...styles.button, textDecoration: 'none' }}>
                Ir a módulo de inventario
            </a>
        );
    };

    // Updated styles to remove underline from links
    return (
        <div style={styles.container}>
            <img
                src="/interchico.webp"
                alt="Watermark"
                style={styles.watermark}
            />
            <h1 style={styles.title}>Menú Principal</h1>
            <div style={styles.grid}>
                {renderButtons()}
            </div>
            <button style={{ ...styles.button, ...styles.logoutButton }} onClick={handleLogout}>
                Cerrar Sesión
            </button>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        height: '100vh',
        padding: '20px',
        position: 'relative',
    },
    watermark: {
        position: 'absolute',
        width: '350px',
        height: '350px',
        opacity: 0.2,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0,
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#c8a165',
        marginBottom: '30px',
    },
    grid: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '20px',
    },
    button: {
        backgroundColor: '#c8a165',
        padding: '15px 30px',
        borderRadius: '8px',
        margin: '5px',
        width: '40%',
        color: '#fff',
        fontSize: '18px',
        fontWeight: 'bold',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'center' as React.CSSProperties['textAlign'],
        zIndex: 1,
        position: 'relative',
    },
    logoutButton: {
        backgroundColor: '#c8a165',
    },
};
