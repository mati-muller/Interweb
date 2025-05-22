import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { config } from '../set/config';

const ProcesosTable: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null); // Store selected row index
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState(''); // Estado para el buscador

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${config.apiUrl}/procesos/nv`);
                setData(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch data.');
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ width: '100vw', minHeight: '100vh', background: '#faf8f5', padding: '30px 0' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Botón de volver alineado a la izquierda del todo */}
                <button
                    onClick={() => window.location.href = '/programa-produccion'}
                    style={{
                        background: '#c8a165',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '10px 22px',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        margin: '30px 0 0 0',
                        zIndex: 2
                    }}
                >
                    ← Volver
                </button>
                <div style={{ height: '58px' }} /> {/* Espacio para que no tape el contenido */}
                {/* Buscador de clientes */}
                <div style={{ margin: '0 0  0', position: 'relative', left: 0, alignContent: 'left', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', alignItems: 'left', maxWidth: '1400px', margin: '0 auto' }}>
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                marginBottom: '20px',
                                padding: '10px',
                                width: '100vw',
                                maxWidth: '1400px',
                                minWidth: '200px',
                                border: '1.5px solid #c8a165',
                                borderRadius: '5px',
                                fontSize: '16px',
                                background: '#fff',
                                outline: 'none',
                                boxShadow: '0 1px 8px rgba(200,161,101,0.10)',
                                transition: 'border 0.2s',
                                flex: 1
                            }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                style={{
                                    background: '#fff',
                                    color: '#c8a165',
                                    border: '1.5px solid #c8a165',
                                    borderRadius: '8px',
                                    padding: '10px 18px',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    boxShadow: '0 1px 4px rgba(200,161,101,0.08)',
                                    transition: 'background 0.2s, color 0.2s',
                                    alignSelf: 'flex-start'
                                }}
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>
                <div style={{ height: '18px' }} /> {/* Espacio separador */}
            </div>
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', background: '#fff' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#c8a165', color: '#fff' }}>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nota de venta</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Producto</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Cliente</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data
                            .filter(item => item.NOMAUX.toLowerCase().includes(search.toLowerCase()))
                            .map((item, index) => (
                                <React.Fragment key={index}>
                                    <tr
                                        style={{
                                            backgroundColor: selectedRowIndex === index ? '#f5f5f5' : '#fff',
                                            borderBottom: '1px solid #ddd',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => setSelectedRowIndex(selectedRowIndex === index ? null : index)} // Toggle row selection
                                    >
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.NVNUMERO}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.DetProd}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.NOMAUX}</td>
                                    </tr>
                                    {selectedRowIndex === index && ( // Render processes below the selected row
                                        <tr>
                                            <td colSpan={3} style={{ padding: '10px', border: '1px solid #ddd' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: '#f3e7d2', color: '#333' }}>
                                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Proceso</th>
                                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Estado</th>
                                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Cantidad a producir</th>
                                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Cantidad producida</th>
                                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Cantidad total</th>
                                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Fecha entrega</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {item.procesos.map((proceso: any, procIndex: number) => (
                                                            <tr key={procIndex} style={{ backgroundColor: '#fff', borderBottom: '1px solid #ddd' }}>
                                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{proceso.PROCESO}</td>
                                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{proceso.ESTADO_PROC}</td>
                                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{proceso.CANT_A_PROD}</td>
                                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{proceso.cantidad_producida}</td>
                                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{proceso.CANTPROD}</td>
                                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{proceso.FECHA_ENTREGA}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProcesosTable;
