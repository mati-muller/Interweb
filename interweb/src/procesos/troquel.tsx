import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../set/config'; // Import config

const API_BASE_URL = config.apiUrl; // Use apiUrl from config

interface DataItem {
    ID: number;
    NVNUMERO: string;
    NOMAUX: string;
    FECHA_ENTREGA: string;
    PROCESO: string;
    DETPROD: string;
    CANTPROD: number;
    CANT_A_PROD: number;
    CANT_A_FABRICAR?: number;
}

export default function Troquel() {
    const navigate = useNavigate();
    const [data, setData] = useState<DataItem[]>([]);
    const [originalData, setOriginalData] = useState<DataItem[]>([]); // Store original data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DataItem | null>(null);
    const [desiredQuantity, setDesiredQuantity] = useState('');
    const [selectedItems, setSelectedItems] = useState<DataItem[]>([]);
    const [searchQuery, setSearchQuery] = useState(''); // State for search query

    const fetchData = () => {
        const apiUrl = `${API_BASE_URL}/procesos/pendientes-troquel`;
        setLoading(true);
        axios.get<DataItem[]>(apiUrl)
            .then((response) => {
                if (Array.isArray(response.data)) {
                    setData(response.data);
                    setOriginalData(response.data); // Save original data
                } else {
                    setError('Unexpected API response format.');
                }
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to fetch data. Please check your network connection or API server.');
                setLoading(false);
            });
    };

    const handleCheckboxClick = (item: DataItem) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleAddToSelected = () => {
        if (selectedItem && desiredQuantity) {
            const updatedItem = {
                ...selectedItem,
                CANT_A_FABRICAR: parseInt(desiredQuantity, 10),
            };
            setSelectedItems((prev) => [...prev, updatedItem]);
            setData((prev) => prev.filter((item) => item.ID !== selectedItem.ID)); // Remove from main table
            setShowModal(false);
            setDesiredQuantity('');
        }
    };

    const handleRemoveFromSelected = (index: number) => {
        setSelectedItems((prev) => {
            const removedItem = prev[index];
            setData((prevData) => {
                const updatedData = prevData.some((item) => item.ID === removedItem.ID)
                    ? prevData // If the item already exists, do not add it again
                    : [...prevData, removedItem];
                return updatedData.sort((a, b) => {
                    const originalIndexA = originalData.findIndex((item) => item.ID === a.ID);
                    const originalIndexB = originalData.findIndex((item) => item.ID === b.ID);
                    return originalIndexA - originalIndexB;
                }); // Restore original order
            });
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmitSelected = () => {
        if (selectedItems.length === 0) {
            alert('No items selected.');
            return;
        }

        const payload = selectedItems.map((item) => ({
            ID: item.ID,
            CANT_A_FABRICAR: item.CANT_A_FABRICAR,
        }));

        axios.post(`${API_BASE_URL}/app/update-trquelado`, { items: payload }, {
            headers: { 'Content-Type': 'application/json' }
        })
            .then(() => {
                alert('Selected items submitted successfully!');
                setSelectedItems([]);
                fetchData();
            })
            .catch((error) => {
                console.error('Error submitting selected items:', error);
                alert('Failed to submit selected items.');
            });
    };

    const moveItemUp = (index: number) => {
        if (index === 0) return;
        setSelectedItems((prev) => {
            const updated = [...prev];
            [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
            return updated;
        });
    };

    const moveItemDown = (index: number) => {
        if (index === selectedItems.length - 1) return;
        setSelectedItems((prev) => {
            const updated = [...prev];
            [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
            return updated;
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter((item) =>
        item.NOMAUX.toLowerCase().includes(searchQuery.toLowerCase())
    ); // Filter data based on search query

    return (
        <div style={{ padding: '20px' }}>
            <button
                style={{
                    marginBottom: '10px',
                    padding: '15px 20px', // Increased padding for a larger button
                    backgroundColor: '#c8a165',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '18px', // Larger font size
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px', // Space between text and arrow
                }}
                onClick={() => navigate('/home')}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="20px"
                    height="20px"
                >
                    <path d="M10 19l-7-7 7-7v4h8v6h-8v4z" />
                </svg>
                Volver
            </button>
            <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                    marginBottom: '20px',
                    padding: '10px',
                    width: '100%',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    fontSize: '16px',
                }}
            />
            {selectedItems.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                    <h3 style={{ marginBottom: '15px', color: '#333' }}>Elementos Seleccionados</h3>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {selectedItems.map((item, index) => (
                            <li key={item.ID} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', backgroundColor: '#fff', padding: '10px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
                                <span style={{ flex: 1, fontSize: '14px' }}>
                                    <strong>Producto:</strong> {item.DETPROD} | <strong>Cliente:</strong> {item.NOMAUX} | <strong>Cantidad:</strong> {item.CANT_A_FABRICAR}
                                </span>
                                <button
                                    style={{
                                        marginRight: '5px',
                                        padding: '5px 10px',
                                        backgroundColor: '#4caf50',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => moveItemUp(index)}
                                    disabled={index === 0}
                                >
                                    ↑
                                </button>
                                <button
                                    style={{
                                        marginRight: '5px',
                                        padding: '5px 10px',
                                        backgroundColor: '#4caf50',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => moveItemDown(index)}
                                    disabled={index === selectedItems.length - 1}
                                >
                                    ↓
                                </button>
                                <button
                                    style={{
                                        padding: '5px 10px',
                                        backgroundColor: '#ff4c4c',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    onClick={() => handleRemoveFromSelected(index)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        width="16px"
                                        height="16px"
                                    >
                                        <path d="M3 6h18v2H3V6zm2 3h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9zm5 2v8h2v-8H8zm4 0v8h2v-8h-2zM9 4h6v2H9V4z" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button
                        style={{
                            marginTop: '15px',
                            padding: '10px',
                            backgroundColor: '#c8a165', // Updated color
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            width: '100%',
                            fontSize: '16px',
                        }}
                        onClick={handleSubmitSelected}
                    >
                        Subir Seleccionados
                    </button>
                </div>
            )}
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p style={{ color: 'red' }}>{error}</p>
            ) : filteredData.length === 0 ? (
                <p>No data available.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#c8a165', color: '#fff' }}>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Seleccionar</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nota de venta</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Cliente</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Fecha Entrega</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Proceso</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Producto</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Cantidad a producir</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Cantidad total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item) => (
                                <tr key={item.ID}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        <button
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#c8a165',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => handleCheckboxClick(item)}
                                        >
                                            Select
                                        </button>
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.NVNUMERO}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.NOMAUX}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.FECHA_ENTREGA}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.PROCESO}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.DETPROD}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.CANT_A_PROD}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.CANTPROD}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showModal && selectedItem && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '5px',
                            width: '300px',
                            textAlign: 'center',
                        }}
                    >
                        <p>
                            <strong>Cantidad a producir:</strong> {selectedItem.CANT_A_PROD}
                        </p>
                        <input
                            type="number"
                            placeholder="Cantidad deseada"
                            value={desiredQuantity}
                            onChange={(e) => setDesiredQuantity(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                marginBottom: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                            }}
                        />
                        <button
                            onClick={handleAddToSelected}
                            style={{
                                padding: '10px',
                                backgroundColor: '#c8a165',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                marginRight: '10px',
                            }}
                        >
                            Añadir
                        </button>
                        <button
                            onClick={() => setShowModal(false)}
                            style={{
                                padding: '10px',
                                backgroundColor: '#ff4c4c',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
