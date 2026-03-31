import React, { useEffect, useState } from 'react';
import { config } from '../set/config';
import BackButton from '../components/BackButton';

interface OrdenCompraItem {
  placa: string;
  fecha_compra: string;
  precio_pp: number;
  precio_total: number;
  cantidad: number;
  oc: string;
}

const API_URL = `${config.apiUrl}/inventario/all`;

// Función para parsear fechas correctamente sin desfase de zonas horarias
const parseDate = (dateString: string): string => {
  if (!dateString) return '';
  
  // Si ya está en formato dd/mm/yyyy, devolverlo como está
  if (dateString.includes('/')) {
    return dateString;
  }
  
  // Si viene en formato yyyy-mm-dd o yyyy-mm-ddT...
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-');
  
  if (!year || !month || !day) return dateString;
  
  return `${day}-${month}-${year}`;
};

const OrdenesCompraTable: React.FC = () => {
  const [data, setData] = useState<OrdenCompraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [modalItem, setModalItem] = useState<OrdenCompraItem | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener datos');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  // Filtrado por OC
  const filteredData = data.filter(item =>
    item.oc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <BackButton to="/inventario" />
      <h2>Órdenes de Compra</h2>
      
      {/* Buscador de OC */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="text"
          placeholder="Buscar por OC..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 8, width: 300, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <span style={{ color: '#666', fontSize: 14 }}>
          Total: {filteredData.length} registros
        </span>
      </div>

      {/* Modal para detalles de OC */}
      {modalItem && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeInBg 0.2s'
          }}
          onClick={() => setModalItem(null)}
        >
          <div
            style={{
              background: '#fff',
              padding: 32,
              borderRadius: 16,
              minWidth: 400,
              maxWidth: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              position: 'relative',
              animation: 'modalPopIn 0.25s',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Botón de cerrar */}
            <button
              onClick={() => setModalItem(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'transparent',
                border: 'none',
                fontSize: 22,
                color: '#c8a165',
                cursor: 'pointer',
                fontWeight: 'bold',
                lineHeight: 1
              }}
              aria-label="Cerrar"
              title="Cerrar"
            >
              ×
            </button>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 20, color: '#c8a165' }}>
                Orden de Compra
              </h3>
              <div style={{
                fontSize: 24,
                color: '#333',
                fontWeight: 'bold',
                letterSpacing: 2,
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: 6
              }}>
                {modalItem.oc}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong>Placa:</strong>
              <div style={{ marginTop: 4, color: '#666', fontSize: 16 }}>
                {modalItem.placa}
              </div>
            </div>            <div style={{ marginBottom: 16 }}>
              <strong>Fecha de Compra:</strong>
              <div style={{ marginTop: 4, color: '#666', fontSize: 16 }}>
                {parseDate(modalItem.fecha_compra)}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong>Cantidad:</strong>
              <div style={{ marginTop: 4, color: '#666', fontSize: 16 }}>
                {modalItem.cantidad}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong>Precio PP:</strong>
              <div style={{ marginTop: 4, color: '#666', fontSize: 16 }}>
                ${modalItem.precio_pp.toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong>Precio Total:</strong>
              <div style={{ marginTop: 4, color: '#666', fontSize: 16, fontWeight: 'bold' }}>
                ${modalItem.precio_total.toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: 18, display: 'flex', gap: 8 }}>
              <button
                style={{
                  padding: '8px 24px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#c8a165',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 16,
                  transition: 'background 0.2s'
                }}
                onClick={() => setModalItem(null)}
              >
                Cerrar
              </button>
              <button
                style={{
                  padding: '8px 24px',
                  borderRadius: 6,
                  border: '1px solid #c8a165',
                  background: '#fff',
                  color: '#c8a165',
                  cursor: 'pointer',
                  fontSize: 16,
                  transition: 'background 0.2s'
                }}
                onClick={() => {
                  navigator.clipboard.writeText(modalItem.oc);
                }}
                title="Copiar OC"
              >
                Copiar OC
              </button>
            </div>

            <div style={{ fontSize: 13, color: '#888' }}>
              Haz clic fuera del modal o en "Cerrar" para salir.
            </div>
          </div>

          <style>
            {`
              @keyframes fadeInBg {
                from { background: rgba(0,0,0,0); }
                to { background: rgba(0,0,0,0.35); }
              }
              @keyframes modalPopIn {
                from { transform: scale(0.85); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            `}
          </style>
        </div>
      )}

      {/* Tabla de Órdenes de Compra */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#c8a165', color: '#fff' }}>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>OC</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Placa</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Fecha</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Cantidad</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Precio Total</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, idx) => (
            <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => setModalItem(item)}>
              <td style={{ border: '1px solid #ccc', padding: 8, fontWeight: 'bold', color: '#c8a165' }}>
                {item.oc}
              </td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>
                {item.placa}
              </td>              <td style={{ border: '1px solid #ccc', padding: 8 }}>
                {parseDate(item.fecha_compra)}
              </td>
              <td style={{ border: '1px solid #ccc', padding: 8, textAlign: 'center' }}>
                {item.cantidad}
              </td>
              <td style={{ border: '1px solid #ccc', padding: 8, textAlign: 'right' }}>
                ${item.precio_total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredData.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
          No se encontraron órdenes de compra
        </div>
      )}
    </div>
  );
};

export default OrdenesCompraTable;
