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
    NVCANT: number;
    CANT_A_PROD: number;
    CANT_A_FABRICAR?: number;
    transformedPlacas?: string[]; // Add transformedPlacas property
    placasUsadas?: number[]; // Add placasUsadas property
    Placas: {
        DesProd: string; // Corrected property name
        CantMat: number;
    }[]; // Update Placas field
}

export default function Encol() {
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
    const [placasFields, setPlacasFields] = useState<string[]>(['']); // Dynamic fields for Placas
    const [placasUsadasFields, setPlacasUsadasFields] = useState<string[]>(['']); // Dynamic fields for Placas Usadas
    const [alertModalVisible, setAlertModalVisible] = useState(false); // State for alert modal visibility
    const [alertMessage, setAlertMessage] = useState(''); // State for alert message
    const [sinConsumoPlacas, setSinConsumoPlacas] = useState(false); // State for "sin consumo de placas", por defecto desmarcado
    const [selectedEncolado, setSelectedEncolado] = useState<'Encolado 1' | 'Encolado 2'>('Encolado 1'); // Dropdown state
    const [selectedItemsEncolado1, setSelectedItemsEncolado1] = useState<DataItem[]>([]); // Separate table for Encolado 1
    const [selectedItemsEncolado2, setSelectedItemsEncolado2] = useState<DataItem[]>([]); // Separate table for Encolado 2
    const [encoladoData, setEncoladoData] = useState<DataItem[]>([]); // Data from /app/encolado
    const [encolado2Data, setEncolado2Data] = useState<DataItem[]>([]); // Data from /app/encolado2
    const [showEncoladoTable, setShowEncoladoTable] = useState<'none' | 'encolado' | 'encolado2'>('none');

    const fetchData = () => {
        const apiUrl = `${API_BASE_URL}/procesos/pendientes-encolado`;
        console.log('Fetching pendientes-encolado from:', apiUrl); // LOG para depuración
        setLoading(true);
        axios.get<DataItem[]>(apiUrl)
            .then((response) => {
                if (Array.isArray(response.data)) {
                    const transformedData = response.data.map((item) => ({
                        ...item,
                        Placas: typeof item.Placas === 'string' ? JSON.parse(item.Placas) : item.Placas, // Parse only if it's a string
                    }));
                    setData(transformedData);
                    setOriginalData(transformedData); // Save original data
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
        setDesiredQuantity(''); // Reset desired quantity
        setPlacasFields(item.Placas.map((placa) => placa.DesProd)); // Pre-fill all "Tipo Placa" fields with DesProd
        setPlacasUsadasFields(item.Placas.map(() => '')); // Reset all "Cantidad a usar" fields
        setSinConsumoPlacas(false); // Asegura que el checkbox esté desmarcado al abrir el modal
        setShowModal(true);
    };

    useEffect(() => {
        if (selectedItem && desiredQuantity !== '' && !sinConsumoPlacas) {
            const updatedPlacasUsadas = selectedItem.Placas.map((placa, index) => {
                const currentValue = placasUsadasFields[index];
                return currentValue !== '' ? Math.ceil(Number(currentValue)).toString() : Math.ceil(parseFloat(desiredQuantity) * placa.CantMat).toString();
            }); // Actualizar dinámicamente con el valor actual y redondear hacia arriba
            setPlacasUsadasFields(updatedPlacasUsadas);
        }
    }, [desiredQuantity, selectedItem, sinConsumoPlacas]); // Add sinConsumoPlacas to dependencies

    const handleDesiredQuantityChange = (value: string) => {
        setDesiredQuantity(value); // Actualizar el estado de desiredQuantity
        if (selectedItem) {
            const updatedPlacasUsadas = selectedItem.Placas.map((placa) =>
                Math.ceil(parseFloat(value) * placa.CantMat).toString()
            ); // Recalcular dinámicamente y redondear hacia arriba
            setPlacasUsadasFields(updatedPlacasUsadas);
        }
    };

    const handleAddToSelected = () => {
        if (selectedItem && desiredQuantity) {
            if (!sinConsumoPlacas) {
                const inventoryData = JSON.parse(localStorage.getItem('inventoryData') || '[]');
                const placasUsadas = placasUsadasFields.map((value, index) => 
                    Math.ceil(Number(value || (parseFloat(desiredQuantity) * selectedItem.Placas[index].CantMat)))
                );

                for (let i = 0; i < placasFields.length; i++) {
                    const placaName = placasFields[i];
                    const requiredQuantity = placasUsadas[i];
                    const inventoryItem = inventoryData.find((item: { placa: string }) => item.placa === placaName);

                    if (!inventoryItem || inventoryItem.cantidad < requiredQuantity) {
                        setAlertMessage(`No hay suficiente inventario para la placa "${placaName}". Requerido: ${requiredQuantity}, Disponible: ${inventoryItem ? inventoryItem.cantidad : 0}`);
                        setAlertModalVisible(true);
                        return;
                    }
                }

                placasFields.forEach((placaName, index) => {
                    const inventoryItem = inventoryData.find((item: { placa: string }) => item.placa === placaName);
                    if (inventoryItem) {
                        inventoryItem.cantidad -= placasUsadas[index];
                    }
                });
                localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
            }

            const updatedItem = {
                ...selectedItem,
                CANT_A_FABRICAR: parseInt(desiredQuantity, 10),
                placasUsadas: sinConsumoPlacas ? [] : placasUsadasFields.map((value, index) => Math.ceil(Number(value))),
                transformedPlacas: sinConsumoPlacas ? [] : placasFields,
            };

            if (selectedEncolado === 'Encolado 1') {
                setSelectedItemsEncolado1((prev) => [...prev, updatedItem]);
            } else {
                setSelectedItemsEncolado2((prev) => [...prev, updatedItem]);
            }

            setShowModal(false);
            setDesiredQuantity('');
        }
    };
    
    const handleRemoveFromSelected = (index: number, encoladoType: 'Encolado 1' | 'Encolado 2') => {
        if (encoladoType === 'Encolado 1') {
            setSelectedItemsEncolado1((prev) => {
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
        } else {
            setSelectedItemsEncolado2((prev) => {
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
        }
    };

    const handleSubmitSelected = (encoladoType: 'Encolado 1' | 'Encolado 2') => {
        const selectedItems = encoladoType === 'Encolado 1' ? selectedItemsEncolado1 : selectedItemsEncolado2;

        if (selectedItems.length === 0) {
            alert('No items selected.');
            return;
        }

        const payload = selectedItems.map((item) => ({
            ID: item.ID,
            CANT_A_FABRICAR: item.CANT_A_FABRICAR,
            transformedPlacas: item.transformedPlacas ?? item.transformedPlacas ?? [],
            placasUsadas: item.placasUsadas ?? item.placasUsadas ?? [],
        }));

        const endpoint = encoladoType === 'Encolado 1' ? `${API_BASE_URL}/app/update-encolado` : `${API_BASE_URL}/app/update-encolado2`;

        axios.post(endpoint, { items: payload }, {
            headers: { 'Content-Type': 'application/json' }
        })
            .then(() => {
                alert(`Selected items for ${encoladoType} submitted successfully!`);
                if (encoladoType === 'Encolado 1') {
                    setSelectedItemsEncolado1([]);
                } else {
                    setSelectedItemsEncolado2([]);
                }
                fetchData();
            })
            .catch((error) => {
                console.error(`Error submitting selected items for ${encoladoType}:`, error);
                alert(`Failed to submit selected items for ${encoladoType}.`);
            });
    };

    const moveItemUp = (index: number, encoladoType: 'Encolado 1' | 'Encolado 2') => {
        if (index === 0) return;
        if (encoladoType === 'Encolado 1') {
            setSelectedItemsEncolado1((prev) => {
                const updated = [...prev];
                [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
                return updated;
            });
        } else {
            setSelectedItemsEncolado2((prev) => {
                const updated = [...prev];
                [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
                return updated;
            });
        }
    };

    const moveItemDown = (index: number, encoladoType: 'Encolado 1' | 'Encolado 2') => {
        if (encoladoType === 'Encolado 1') {
            setSelectedItemsEncolado1((prev) => {
                if (index === prev.length - 1) return prev;
                const updated = [...prev];
                [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
                return updated;
            });
        } else {
            setSelectedItemsEncolado2((prev) => {
                if (index === prev.length - 1) return prev;
                const updated = [...prev];
                [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
                return updated;
            });
        }
    };

    const addPlacaField = () => {
        setPlacasFields([...placasFields, '']);
        setPlacasUsadasFields([...placasUsadasFields, '']);
    };

    const updatePlacaField = (index: number, value: string) => {
        const updatedPlacas = [...placasFields];
        updatedPlacas[index] = value;
        setPlacasFields(updatedPlacas);
    };

    const updatePlacaUsadaField = (index: number, value: string) => {
        setPlacasUsadasFields((prev) => {
            const updated = [...prev];
            updated[index] = value; // Actualizar el valor dinámicamente
            return updated;
        });
    };

    const handleSinConsumoPlacasChange = (checked: boolean) => {
        setSinConsumoPlacas(checked);
        if (checked) {
            setPlacasFields(['']); // Clear placas fields
            setPlacasUsadasFields(['']); // Clear placas quantities
        } else if (selectedItem) {
            setPlacasFields(selectedItem.Placas.map((placa) => placa.DesProd)); // Refill placas fields
            setPlacasUsadasFields(selectedItem.Placas.map(() => '')); // Reset quantities
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Render encolado/encolado2 GET results directamente en la tabla de selección
    useEffect(() => {
        const fetchAndSetEncolados = async () => {
            setLoading(true);
            try {
                const [res1, res2] = await Promise.all([
                    axios.get(`${API_BASE_URL}/app/encolado`),
                    axios.get(`${API_BASE_URL}/app/encolado2`)
                ]);
                // Mantén todos los campos originales y agrega los del payload
                const parsePlacas = (arr: any[]) => arr.map((item) => {
                    let transformedPlacas: string[] = [];
                    let placasUsadas: number[] = [];
                    try {
                        transformedPlacas = item.PLACAS_A_USAR ? JSON.parse(item.PLACAS_A_USAR) : [];
                    } catch { transformedPlacas = []; }
                    try {
                        placasUsadas = item.CANTIDAD_PLACAS ? JSON.parse(item.CANTIDAD_PLACAS) : [];
                    } catch { placasUsadas = []; }
                    return {
                        ...item,
                        CANT_A_FABRICAR: item.CANT_A_FABRICAR ?? 0,
                        transformedPlacas,
                        placasUsadas,
                    };
                });
                setSelectedItemsEncolado1(parsePlacas(res1.data));
                setSelectedItemsEncolado2(parsePlacas(res2.data));
            } catch (err) {
                setError('Error al obtener datos de encolado/encolado2');
            } finally {
                setLoading(false);
            }
        };
        fetchAndSetEncolados();
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
                onClick={() => navigate('/programa-produccion')}
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
            {selectedItemsEncolado1.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                    <h3 style={{ marginBottom: '15px', color: '#333' }}>Elementos Seleccionados - Encolado 1</h3>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {selectedItemsEncolado1.map((item, index) => (
                            <li key={item.ID} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', backgroundColor: '#fff', padding: '10px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
                                <span style={{ marginRight: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                                    {index + 1}.
                                </span>
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
                                    onClick={() => moveItemUp(index, 'Encolado 1')}
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
                                    onClick={() => moveItemDown(index, 'Encolado 1')}
                                    disabled={index === selectedItemsEncolado1.length - 1}
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
                                    onClick={() => handleRemoveFromSelected(index, 'Encolado 1')}
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
                        onClick={() => handleSubmitSelected('Encolado 1')}
                    >
                        Subir Seleccionados - Encolado 1
                    </button>
                </div>
            )}
            {selectedItemsEncolado2.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                    <h3 style={{ marginBottom: '15px', color: '#333' }}>Elementos Seleccionados - Encolado 2</h3>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {selectedItemsEncolado2.map((item, index) => (
                            <li key={item.ID} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', backgroundColor: '#fff', padding: '10px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
                                <span style={{ marginRight: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                                    {index + 1}.
                                </span>
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
                                    onClick={() => moveItemUp(index, 'Encolado 2')}
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
                                    onClick={() => moveItemDown(index, 'Encolado 2')}
                                    disabled={index === selectedItemsEncolado2.length - 1}
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
                                    onClick={() => handleRemoveFromSelected(index, 'Encolado 2')}
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
                        onClick={() => handleSubmitSelected('Encolado 2')}
                    >
                        Subir Seleccionados - Encolado 2
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
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.NVCANT}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            { /* Modal for selecting item details */ }
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
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '25px',
                            borderRadius: '10px',
                            width: '400px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                            textAlign: 'center',
                        }}
                    >
                        <h3 style={{ marginBottom: '20px', color: '#333' }}>Detalles del Producto</h3>
                        <p style={{ marginBottom: '15px', fontSize: '16px' }}>
                            <strong>Cantidad a producir:</strong> {selectedItem.CANT_A_PROD}
                        </p>
                        <input
                            type="number"
                            placeholder="Cantidad deseada"
                            value={desiredQuantity}
                            onChange={(e) => handleDesiredQuantityChange(e.target.value)} // Usar la nueva función
                            style={{
                                width: '90%',
                                padding: '12px',
                                marginBottom: '15px',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                                fontSize: '16px',
                            }}
                        />
                        {placasFields.map((placa, index) => (
                            <div key={`placa-group-${index}`} style={{ marginBottom: '15px' }}>
                                <input
                                    type="text"
                                    placeholder={`Tipo Placa ${index + 1}`}
                                    value={placa}
                                    onChange={(e) => updatePlacaField(index, e.target.value)}
                                    style={{
                                        width: '90%',
                                        padding: '12px',
                                        marginBottom: '10px',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '16px',
                                    }}
                                />
                                <input
                                    type="number"
                                    placeholder={`Cantidad a usar ${index + 1}`}
                                    value={placasUsadasFields[index]}
                                    onChange={(e) => updatePlacaUsadaField(index, e.target.value)}
                                    style={{
                                        width: '90%',
                                        padding: '12px',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '16px',
                                    }}
                                />
                            </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <button
                                onClick={addPlacaField}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '10px 15px',
                                    backgroundColor: '#228B22',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '20px', // Reduced width
                                        height: '20px', // Reduced height
                                        backgroundColor: '#fff',
                                        color: '#228B22',
                                        fontWeight: 'bold',
                                        borderRadius: '50%',
                                        marginRight: '8px',
                                        fontSize: '14px', // Adjusted font size for smaller circle
                                    }}
                                >
                                    +
                                </span>
                                Agregar Placa
                            </button>
                            <label style={{ fontSize: '16px', color: '#333', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={sinConsumoPlacas}
                                    onChange={(e) => handleSinConsumoPlacasChange(e.target.checked)}
                                    style={{ marginRight: '10px' }}
                                />
                                Sin consumo de placas
                            </label>
                        </div>
                        <select
                            value={selectedEncolado}
                            onChange={(e) => setSelectedEncolado(e.target.value as 'Encolado 1' | 'Encolado 2')}
                            style={{
                                width: '90%',
                                padding: '12px',
                                marginBottom: '15px',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                                fontSize: '16px',
                            }}
                        >
                            <option value="Encolado 1">Encolado 1</option>
                            <option value="Encolado 2">Encolado 2</option>
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={handleAddToSelected}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#c8a165',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                }}
                            >
                                Añadir
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#ff4c4c',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {alertModalVisible && (
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
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '10px',
                            width: '400px',
                            textAlign: 'center',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                        }}
                    >
                        <h3 style={{ marginBottom: '15px', color: '#333' }}>Alerta de Inventario</h3>
                        <p style={{ marginBottom: '20px', fontSize: '16px' }}>{alertMessage}</p>
                        <button
                            onClick={() => setAlertModalVisible(false)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#c8a165',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px',
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
