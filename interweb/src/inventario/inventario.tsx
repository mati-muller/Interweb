import React, { useEffect, useState } from 'react';
import { config } from '../set/config'; // Import the config file
import BackButton from '../components/BackButton';

interface InventarioItem {
  cantidad: number;
  placa: string;
}

const API_URL = `${config.apiUrl}/inventario/total`

const InventarioTable: React.FC = () => {
  const [data, setData] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>(''); // Estado para el buscador
  const [modalItem, setModalItem] = useState<InventarioItem | null>(null); // Estado para el modal
  const [filterMenuOpen, setFilterMenuOpen] = useState(false); // Estado para el menú desplegable
  const [filterType, setFilterType] = useState<'PLACA' | 'OTROS' | 'ALL'>('ALL'); // Filtro de tipo
  const [subFilterMenuOpen, setSubFilterMenuOpen] = useState(false); // Nuevo estado para submenú
  const [subFilter, setSubFilter] = useState<string>('ALL'); // Subfiltro por grupo de caracteres

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

  // Obtener opciones de subfiltro (grupo de caracteres después de la medida)
  let subFilterOptions: string[] = [];
  if (filterType === 'PLACA') {
    const matches = data
      .filter(item => item.placa.trim().toUpperCase().startsWith('PLACA'))
      .map(item => {
        // Extraer grupo de caracteres después de la medida (ejemplo: "PLACA 100*200 ABC")
        const match = item.placa.match(/PLACA\s*\d+\*\d+\s*([^\s]+)/i);
        return match ? match[1].toUpperCase() : null;
      })
      .filter(Boolean) as string[];
    subFilterOptions = Array.from(new Set(matches));
  }

  // Filtrado según el tipo seleccionado y subfiltro
  const filteredData = data
    .filter(item => {
      if (filterType === 'PLACA') return item.placa.trim().toUpperCase().startsWith('PLACA');
      if (filterType === 'OTROS') return !item.placa.trim().toUpperCase().startsWith('PLACA');
      return true;
    })
    .filter(item => item.placa.toLowerCase().includes(search.toLowerCase()))
    .filter(item => {
      if (filterType === 'PLACA' && subFilter !== 'ALL') {
        const match = item.placa.match(/PLACA\s*\d+\*\d+\s*([^\s]+)/i);
        return match && match[1].toUpperCase() === subFilter;
      }
      return true;
    });

  return (
    <div style={{ padding: 20 }}>
      <BackButton to="/home" />
      <h2>Inventario</h2>
      {/* Buscador de productos */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 8, width: 250, borderRadius: 4, border: '1px solid #ccc' }}
        />
        {/* Botón de menú de filtro */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setFilterMenuOpen(open => !open)}
            style={{
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: 4,
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: 32,
              height: 32
            }}
            title="Filtrar productos"
          >
            <span style={{ width: 16, height: 2, background: '#333', margin: 1, display: 'block' }} />
            <span style={{ width: 16, height: 2, background: '#333', margin: 1, display: 'block' }} />
            <span style={{ width: 16, height: 2, background: '#333', margin: 1, display: 'block' }} />
          </button>
          {filterMenuOpen && (
            <div style={{
              position: 'absolute',
              top: 36,
              left: 0,
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              zIndex: 10,
              minWidth: 120
            }}>
              <div
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: filterType === 'PLACA' ? '#eee' : '#fff'
                }}
                onClick={() => {
                  setFilterType('PLACA');
                  setFilterMenuOpen(false);
                  setSubFilter('ALL');
                  setTimeout(() => setSubFilterMenuOpen(true), 100); // Abre submenú después
                }}
              >
                Solo PLACA
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: filterType === 'OTROS' ? '#eee' : '#fff'
                }}
                onClick={() => {
                  setFilterType('OTROS');
                  setFilterMenuOpen(false);
                  setSubFilter('ALL');
                  setSubFilterMenuOpen(false);
                }}
              >
                Otros
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: filterType === 'ALL' ? '#eee' : '#fff'
                }}
                onClick={() => {
                  setFilterType('ALL');
                  setFilterMenuOpen(false);
                  setSubFilter('ALL');
                  setSubFilterMenuOpen(false);
                }}
              >
                Todos
              </div>
            </div>
          )}
          {/* Submenú para seleccionar grupo de caracteres después de la medida */}
          {filterType === 'PLACA' && subFilterMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 36,
                left: 130,
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                zIndex: 11,
                minWidth: 80
              }}
              // Cierra el submenú si el mouse sale del área
              onMouseLeave={() => setSubFilterMenuOpen(false)}
            >
              <div
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: subFilter === 'ALL' ? '#eee' : '#fff'
                }}
                onClick={() => setSubFilter('ALL')}
              >
                Todas
              </div>
              {subFilterOptions.map(opt => (
                <div
                  key={opt}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: subFilter === opt ? '#eee' : '#fff'
                  }}
                  onClick={() => setSubFilter(opt)}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Modal para productos "PLACA" */}
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
              minWidth: 340,
              maxWidth: 400,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              textAlign: 'center',
              position: 'relative',
              animation: 'modalPopIn 0.25s'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Botón de cerrar en la esquina */}
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
            <div style={{ marginBottom: 18 }}>
              <span
                style={{
                  display: 'inline-block',
                  background: '#c8a165',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  lineHeight: '48px',
                  fontSize: 28,
                  marginBottom: 8
                }}
              >
                🏷️
              </span>
              <h3 style={{ margin: 0, fontSize: 22, color: '#c8a165' }}>
                {modalItem.placa}
              </h3>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Cantidad:</strong>
              <div style={{
                fontSize: 28,
                color: '#333',
                marginTop: 4,
                marginBottom: 8,
                fontWeight: 600,
                letterSpacing: 1
              }}>
                {modalItem.cantidad}
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <button
                style={{
                  padding: '8px 24px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#c8a165',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 16,
                  marginRight: 8,
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
                  navigator.clipboard.writeText(modalItem.placa);
                }}
                title="Copiar nombre del producto"
              >
                Copiar nombre
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#888' }}>
              Haz clic fuera del modal o en "Cerrar" para salir.
            </div>
          </div>
          {/* Animaciones CSS */}
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
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#c8a165', color: '#fff' }}>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Producto</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, idx) => (
            <tr key={idx}>
              <td
                style={{ border: '1px solid #ccc', padding: 8, cursor: 'pointer' }}
                onClick={() => setModalItem(item)}
              >
                {item.placa}
              </td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventarioTable;
