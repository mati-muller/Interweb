import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('user'); // Check for 'user' in localStorage
        if (!user) {
            navigate('/login'); // Redirect to login if user is not found
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div style={styles.container}>
            <img
                src="/interlogo.png"
                alt="Watermark"
                style={styles.watermark}
            />
            <h1 style={styles.title}>Menú Principal</h1>
            <div style={styles.grid}>
                <button style={styles.button} onClick={() => navigate('/encolado')}>
                    Encolado
                </button>
                <button style={styles.button} onClick={() => navigate('/trozado')}>
                    Trozado
                </button>
                <button style={styles.button} onClick={() => navigate('/troquelado')}>
                    Troquelado
                </button>
                <button style={styles.button} onClick={() => navigate('/pegado')}>
                    Pegado
                </button>
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
        width: '350px', // Increased from 250px to 350px
        height: '350px', // Increased from 250px to 350px
        opacity: 0.1,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0, // Ensure watermark is behind other elements
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
        textAlign: 'center' as React.CSSProperties['textAlign'], // Explicitly cast textAlign
        zIndex: 1, // Ensure buttons are above the watermark
        position: 'relative', // Required for zIndex to take effect
    },
    logoutButton: {
        backgroundColor: '#c8a165',
    },
};
