import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { config } from '../set/config';

const ProcesosTable: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null); // Store selected row index
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#c8a165', color: '#fff' }}>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nota de venta</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Producto</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Cliente</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
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
                                            <tbody>
                                                {item.procesos.map((proceso: any, procIndex: number) => (
                                                    <tr key={procIndex} style={{ backgroundColor: '#fff', borderBottom: '1px solid #ddd' }}>
                                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{proceso.PROCESO}</td>
                                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{proceso.cantidad_producida}</td>
                                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{proceso.ESTADO_PROC}</td>
                                                        
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
    );
};

export default ProcesosTable;
