import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { config } from '../set/config'; // Import the config file

interface HistorialItem {
  CANTIDAD: number;
  CODPROD: string;
  DETPROD: string;
  FECHA: string | null;
  FECHA_ENTREGA: string;
  ID: number;
  ID_PROCESO: number;
  NUMERO_PERSONAS: number;
  NVCANT: number;
  NVNUMERO: number;
  PLACA: string;
  PLACAS_BUENAS: string;
  PLACAS_MALAS: string;
  PLACAS_USADAS: string;
  PROCESO: string;
  STOCK: string;
  STOCK_CANT: number;
  TIEMPO_TOTAL: number;
  USER: string;
}

const API_URL = `${config.apiUrl}/reportes/historial`;

const HistorialTable: React.FC = () => {
  const [data, setData] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get<HistorialItem[]>(API_URL)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar el historial');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ overflowX: 'auto', padding: 20 }}>
      <h2>Historial de Procesos</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ backgroundColor: '#c8a165', color: '#fff' }}>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Fecha</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Nota Venta</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Producto</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Cliente</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Proceso</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Cantidad</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Placas</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Placas Usadas</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Placas Buenas</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Placas Malas</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Personas</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Tiempo Total</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Stock</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Stock Cant</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Fecha Entrega</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Usuario</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.ID}>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.FECHA ? item.FECHA : '-'}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.ID}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.NVNUMERO}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.DETPROD}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.CODPROD}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.PROCESO}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.CANTIDAD}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.PLACA}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.PLACAS_USADAS}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.PLACAS_BUENAS}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.PLACAS_MALAS}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.NUMERO_PERSONAS}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.TIEMPO_TOTAL}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.STOCK}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.STOCK_CANT}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.FECHA_ENTREGA}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.USER}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistorialTable;
