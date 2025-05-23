import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

import Login from './home/login';
import Homeprocesos from './home/homeprocesos';
import Encol from './procesos/encol';
import Troquel from './procesos/troquel';
import Troza from './procesos/troz';
import Home from './home/home';
import EditEncolado from './procesos/edit/editencol';
import Edicion from './home/edicion';
import Emplacado from './procesos/emplac';
import ProcesosTable from './procesos/procesos';
import Mult from './procesos/mult';
import UserTable from './users/users';
import Pegado from './procesos/pegado';
import EditTrozado from './procesos/edit/editTroz';
import EditTroq from './procesos/edit/editTroq';
import EditEncolado2 from './procesos/edit/editencol2';
import EditMult from './procesos/edit/editMult';
import EditMult2 from './procesos/edit/editMult2';
import EditTroq2 from './procesos/edit/editTroq2';
import EditPegado from './procesos/edit/edirPegado';
import InventarioTable from './inventario/inventario';
import Calado from './procesos/calado';
import Plizado from './procesos/plizado';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user'); // Ensure this checks for 'user'
  return user ? <>{children}</> : <Navigate to="/login" />;
};

// Update the synchronization logic to include 'inventoryData'
window.addEventListener('storage', (event) => {
  if (event.key === 'user' || event.key === 'inventoryData') {
    const value = event.newValue;
    if (value) {
      localStorage.setItem(event.key, value);
    }
  }
});

function syncLocalStorage() {
  const user = localStorage.getItem('user');
  const inventoryData = localStorage.getItem('inventoryData');
  if (user) {
    localStorage.setItem('user', user);
  }
  if (inventoryData) {
    localStorage.setItem('inventoryData', inventoryData);
  }
}

// Call this function when opening a new tab or window
function openInNewTab(url: string): void {
  syncLocalStorage();
  window.open(url, '_blank');
}

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
          path="/pegado"
          element={
            <ProtectedRoute>
              <Pegado />
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
          path="/multiple"
          element={
            <ProtectedRoute>
              <Mult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/impresion"
          element={
            <ProtectedRoute>
              <Troquel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calado"
          element={
            <ProtectedRoute>
              <Calado />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plizado"
          element={
            <ProtectedRoute>
              <Plizado />
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
          path="/edit-encolado2"
          element={
            <ProtectedRoute>
              <EditEncolado2 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-trozado"
          element={
            <ProtectedRoute>
              <EditTrozado />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-troquelado"
          element={
            <ProtectedRoute>
              <EditTroq />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-troquelado2"
          element={
            <ProtectedRoute>
              <EditTroq2 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-multiple"
          element={
            <ProtectedRoute>
              <EditMult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-multiple2"
          element={
            <ProtectedRoute>
              <EditMult2 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-pegado"
          element={
            <ProtectedRoute>
              <EditPegado />
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
          path="/users"
          element={
            <ProtectedRoute>
              <UserTable />
            </ProtectedRoute>
          }
        />
        <Route
        path="/inventario"
        element={
          <ProtectedRoute>
            <InventarioTable />
          </ProtectedRoute>
        }
      />
      </Routes>
      
    </Router>
  </React.StrictMode>
);

reportWebVitals();
