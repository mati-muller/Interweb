import React, { useEffect, useState } from 'react';
import { config } from '../set/config';
import BackButton from '../components/BackButton';
import * as XLSX from 'xlsx';

interface OrdenCompraItem {
  id: number;
  placa: string;
  fecha_compra: string;
  precio_pp: number;
  precio_total: number;
  cantidad: number;
  oc: string;
}

const API_URL = `${config.apiUrl}/inventario/all`;

const parseDate = (dateString: string): string => {
  if (!dateString) return '';
  if (dateString.includes('/')) return dateString;
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
  const [modalItem, setModalItem] = useState<OrdenCompraItem | null>(null);  const [editingItem, setEditingItem] = useState<OrdenCompraItem | null>(null);
  const [editValues, setEditValues] = useState({ cantidad: 0, precio_pp: 0, precio_total: 0 });
  const [saveLoading, setSaveLoading] = useState(false);

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

  const handleEdit = (item: OrdenCompraItem) => {
    setEditingItem(item);
    setEditValues({
      cantidad: item.cantidad,
      precio_pp: item.precio_pp,
      precio_total: item.cantidad * item.precio_pp,
    });
  };

  const handlePrecioChange = (value: number) => {
    setEditValues(prev => ({
      ...prev,
      precio_pp: value,
      precio_total: prev.cantidad * value,
    }));
  };

  const handleCantidadChange = (value: number) => {
    setEditValues(prev => ({
      ...prev,
      cantidad: value,
      precio_total: value * prev.precio_pp,
    }));
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setSaveLoading(true);
    try {
      const response = await fetch(
        `${config.apiUrl}/inventario/${editingItem.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editValues),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar item');
      }

      const responseData = await response.json();
      setData(data.map(item =>
        item.id === editingItem.id
          ? { 
              ...item, 
              cantidad: responseData.cantidad,
              precio_pp: responseData.precio_pp,
              precio_total: responseData.precio_total
            }
          : item
      ));
      setEditingItem(null);
      alert('Item actualizado correctamente');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  const filteredData = data.filter(item =>
    item.oc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <BackButton to="/inventario" />
      <h2>Órdenes de Compra</h2>
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
        </span>        <button
          onClick={async () => {
            try {
              const response = await fetch(`${config.apiUrl}/inventario/export/csv`);
              if (!response.ok) throw new Error('Error al descargar CSV');
              const csvText = await response.text();
              
              // Parse CSV manually
              const lines = csvText.trim().split('\n');
              const headers = lines[0].split(',').map(h => h.trim());
              const data: any[] = [];
              
              for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const row: any = {};
                headers.forEach((header, idx) => {
                  row[header] = values[idx];
                });
                data.push(row);
              }
              
              // Create workbook and worksheet
              const worksheet = XLSX.utils.json_to_sheet(data);
              const workbook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
              
              // Auto-adjust column widths
              const colWidths = headers.map(header => ({
                wch: Math.max(header.length, 15)
              }));
              worksheet['!cols'] = colWidths;
              
              // Download file
              XLSX.writeFile(workbook, 'inventario_export.xlsx');
            } catch (err) {
              alert('Error al descargar el archivo: ' + (err as Error).message);
            }
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            border: 'none',
            background: '#27ae60',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 'bold',
            transition: 'background 0.2s',
            marginLeft: 'auto',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#229954')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#27ae60')}
          title="Descargar inventario en XLSX"
        >
          📥 Exportar Inventario a Excel
        </button>
      </div>

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
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
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
              }}
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
            </div>

            <div style={{ marginBottom: 16 }}>
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
                }}
                onClick={() => {
                  navigator.clipboard.writeText(modalItem.oc);
                }}
              >
                Copiar OC
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setEditingItem(null)}
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
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEditingItem(null)}
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
              }}
            >
              ×
            </button>

            <h3 style={{ marginTop: 0, color: '#c8a165' }}>
              Editar: {editingItem.placa}
            </h3>            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>
                Cantidad:
              </label>
              <input
                type="number"
                value={editValues.cantidad}
                onChange={(e) => handleCantidadChange(parseInt(e.target.value) || 0)}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>
                Precio PP:
              </label>
              <input
                type="number"
                step="0.01"
                value={editValues.precio_pp}
                onChange={(e) => handlePrecioChange(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>
                Precio Total (Automático):
              </label>
              <div style={{
                width: '100%',
                padding: 8,
                borderRadius: 4,
                border: '1px solid #ccc',
                background: '#f5f5f5',
                color: '#666',
                fontWeight: 'bold',
                fontSize: 16
              }}>
                ${(editValues.cantidad * editValues.precio_pp).toFixed(2)}
              </div>
              <small style={{ color: '#999', marginTop: 4, display: 'block' }}>
                Se calcula automáticamente: cantidad × precio_pp
              </small>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#c8a165',
                  color: '#fff',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                  opacity: saveLoading ? 0.6 : 1,
                }}
              >
                {saveLoading ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditingItem(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #c8a165',
                  background: '#fff',
                  color: '#c8a165',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#c8a165', color: '#fff' }}>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>OC</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Placa</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Fecha</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Cantidad</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Precio Total</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, idx) => (
            <tr key={idx}>
              <td 
                style={{ border: '1px solid #ccc', padding: 8, fontWeight: 'bold', color: '#c8a165', cursor: 'pointer' }} 
                onClick={() => setModalItem(item)}
              >
                {item.oc}
              </td>
              <td 
                style={{ border: '1px solid #ccc', padding: 8, cursor: 'pointer' }} 
                onClick={() => setModalItem(item)}
              >
                {item.placa}
              </td>
              <td 
                style={{ border: '1px solid #ccc', padding: 8, cursor: 'pointer' }} 
                onClick={() => setModalItem(item)}
              >
                {parseDate(item.fecha_compra)}
              </td>
              <td 
                style={{ border: '1px solid #ccc', padding: 8, textAlign: 'center', cursor: 'pointer' }} 
                onClick={() => setModalItem(item)}
              >
                {item.cantidad}
              </td>
              <td 
                style={{ border: '1px solid #ccc', padding: 8, textAlign: 'right', cursor: 'pointer' }} 
                onClick={() => setModalItem(item)}
              >
                ${item.precio_total.toFixed(2)}
              </td>
              <td style={{ border: '1px solid #ccc', padding: 8, textAlign: 'center' }}>
                <button
                  onClick={() => handleEdit(item)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: 'none',
                    background: '#c8a165',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#b89155')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#c8a165')}
                >
                  Editar
                </button>
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
