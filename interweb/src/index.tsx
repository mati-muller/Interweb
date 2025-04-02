import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './index.css';
import Login from './login'; // Importa el componente Login
import Home from './home'; // Import the Home component
import Encol from './encol'; // Import the Encol component
import reportWebVitals from './reportWebVitals';
import Troquel from './troquel';
import Troza from './troz'; // Import the Troza component

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
        <Route path="/" element={<Login />} />
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
          path="/encolado"
          element={
            <ProtectedRoute>
              <Encol />
            </ProtectedRoute>
          }
        />
        <Route
          path="/troquelado"
          element={
            <ProtectedRoute>
              <Troquel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trozado"
          element={
            <ProtectedRoute>
              <Troza />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  </React.StrictMode>
);

reportWebVitals();
