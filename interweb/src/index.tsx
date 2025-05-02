import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

const Login = lazy(() => import('./home/login'));
const Homeprocesos = lazy(() => import('./home/homeprocesos'));
const Encol = lazy(() => import('./procesos/encol'));
const Troquel = lazy(() => import('./procesos/troquel'));
const Troza = lazy(() => import('./procesos/troz'));
const Home = lazy(() => import('./home/home'));
const EditEncolado = lazy(() => import('./procesos/edit/editencol'));
const Edicion = lazy(() => import('./home/edicion'));
const Emplacado = lazy(() => import('./procesos/emplac'));
const ProcesosTable = lazy(() => import('./procesos/procesos'));
const Mult = lazy(() => import('./procesos/mult'));
const UserTable = lazy(() => import('./users/users'));

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
      <Suspense fallback={<div>Loading...</div>}>
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
          <Route
            path="/multiple"
            element={
              <ProtectedRoute>
                <Mult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserTable />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  </React.StrictMode>
);

reportWebVitals();
