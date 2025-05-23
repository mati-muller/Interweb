import React, { useEffect, useState } from 'react';
import { config } from '../set/config'; // Import the config file

interface InventarioItem {
  cantidad: number;
  placa: string;
}

const API_URL = `${config.apiUrl}/inventario/total`

const InventarioTable: React.FC = () => {
  const [data, setData] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div style={{ padding: 20 }}>
      <h2>Inventario</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#c8a165', color: '#fff' }}>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Producto</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.placa}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventarioTable;
