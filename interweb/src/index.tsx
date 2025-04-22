import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './index.css';
import Login from './home/login'; // Importa el componente Login
import Homeprocesos from './home/homeprocesos'; // Import the Home component
import Encol from './procesos/encol'; // Import the Encol component
import reportWebVitals from './reportWebVitals';
import Troquel from './procesos/troquel';
import Troza from './procesos/troz'; // Import the Troza component
import Home from './home/home';
import EditEncolado from './procesos/edit/editencol';
import Edicion from './home/edicion';
import Emplacado from './procesos/emplac';
import ProcesosTable from './procesos/procesos';

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
          path="/programa-produccion"
          element={
            <ProtectedRoute>
              <Homeprocesos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edicion"
          element={
            <ProtectedRoute>
              <Edicion />
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
        <Route
          path="/troquelado"
          element={
            <ProtectedRoute>
              <Troquel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emplacado"
          element={
            <ProtectedRoute>
              <Emplacado />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-encolado"
          element={
            <ProtectedRoute>
              <EditEncolado />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procesos"
          element={
            <ProtectedRoute>
              <ProcesosTable />
            </ProtectedRoute>
          }
        />
      </Routes>
      

    </Router>
  </React.StrictMode>
);

reportWebVitals();
