import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './index.css';
import App from './App';
import Login from './login'; // Importa el componente Login
import Home from './home'; // Import the Home component
import Encol from './encol'; // Import the Encol component
import reportWebVitals from './reportWebVitals';
import Troquel from './troquel';
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user'); // Ensure this checks for 'user'
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/encol"
          element={
            <ProtectedRoute>
              <Encol />
            </ProtectedRoute>
          }
        />
        <Route
          path="/troquel"
          element={
            <ProtectedRoute>
              <Troquel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  </React.StrictMode>
);

reportWebVitals();
