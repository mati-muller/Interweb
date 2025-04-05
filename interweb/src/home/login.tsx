import React, { useState } from 'react';
import axios from 'axios';
import { config } from '../set/config'; // Import the config file
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Initialize navigate

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${config.apiUrl}/users/login`, { username, password });
      console.log('Login successful:', response.data);
      localStorage.setItem('user', JSON.stringify(response.data.user)); // Ensure user is stored correctly
      setError(null);
      navigate('/home'); // Redirect to Home
    } catch (err) {
      console.error('Login error:', err);
      setError('Nombre de usuario o contraseña incorrecta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <img src="/interpanellogo.webp" alt="Logo" style={styles.logo} />
        <h1 style={styles.title}>Iniciar Sesión</h1>
        <label style={styles.label}>Usuario:</label>
        <input
          style={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ingresa tu usuario"
        />
        <label style={styles.label}>Contraseña:</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingresa tu contraseña"
        />
        {error && <p style={styles.error}>{error}</p>}
        {loading ? (
          <div style={styles.loading}>Cargando...</div>
        ) : (
          <button style={styles.button} onClick={handleSubmit}>
            Ingresar
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: '150px',
    height: '150px',
    marginBottom: '20px',
    objectFit: 'contain' as const,
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  form: {
    width: '90%',
    maxWidth: '400px',
    padding: '20px',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#c8a165',
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  label: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333333',
    marginBottom: '5px',
    display: 'block',
  },
  input: {
    width: '100%',
    height: '45px',
    borderColor: '#ccc',
    borderWidth: '1px',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '15px',
    boxSizing: 'border-box' as const,
    fontSize: '14px',
  },
  error: {
    color: '#d32f2f',
    marginBottom: '10px',
  },
  button: {
    width: '100%',
    backgroundColor: '#c8a165',
    color: '#fff',
    padding: '12px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'background-color 0.3s ease',
  },
  loading: {
    textAlign: 'center' as const,
    color: '#c8a165',
  },
  route: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#666',
  },
};

export default Login;
