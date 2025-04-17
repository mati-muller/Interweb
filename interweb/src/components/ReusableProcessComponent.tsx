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
    transformedPlacas?: string[];
    placasUsadas?: number[];
    Placas: {
        DesProd: string;
        CantMat: number;
    }[];
}

interface ReusableProcessComponentProps {
    processName: string;
}

export default function ReusableProcessComponent({
    processName,
}: ReusableProcessComponentProps) {
    const navigate = useNavigate();
    const [data, setData] = useState<DataItem[]>([]);
    const [originalData, setOriginalData] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DataItem | null>(null);
    const [desiredQuantity, setDesiredQuantity] = useState('');
    const [selectedItems, setSelectedItems] = useState<DataItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [placasFields, setPlacasFields] = useState<string[]>(['']);
    const [placasUsadasFields, setPlacasUsadasFields] = useState<string[]>(['']);
    const [alertModalVisible, setAlertModalVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const fetchData = () => {
        setLoading(true);
        const apiUrl = `${API_BASE_URL}/procesos/pendientes-${processName}`;
        axios.get<DataItem[]>(apiUrl)
            .then((response) => {
                if (Array.isArray(response.data)) {
                    const transformedData = response.data.map((item) => ({
                        ...item,
                        Placas: typeof item.Placas === 'string' ? JSON.parse(item.Placas) : item.Placas,
                    }));
                    setData(transformedData);
                    setOriginalData(transformedData);
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
        setDesiredQuantity('');
        setPlacasFields(item.Placas.map((placa) => placa.DesProd));
        setPlacasUsadasFields(item.Placas.map(() => ''));
        setShowModal(true);
    };

    const handleDesiredQuantityChange = (value: string) => {
        setDesiredQuantity(value);
        if (selectedItem) {
            const updatedPlacasUsadas = selectedItem.Placas.map((placa) =>
                (parseFloat(value) * placa.CantMat).toFixed(2)
            );
            setPlacasUsadasFields(updatedPlacasUsadas);
        }
    };

    const handleAddToSelected = () => {
        if (selectedItem && desiredQuantity) {
            const inventoryData = JSON.parse(localStorage.getItem('inventoryData') || '[]');
            const placasUsadas = placasUsadasFields.map((value, index) =>
                Number(value || (parseFloat(desiredQuantity) * selectedItem.Placas[index].CantMat).toFixed(2))
            );

            for (let i = 0; i < placasFields.length; i++) {
                const placaName = placasFields[i];
                const requiredQuantity = placasUsadas[i];
                const inventoryItem = inventoryData.find((item: { placa: string }) => item.placa === placaName);

                if (!inventoryItem || inventoryItem.Cantidad < requiredQuantity) {
                    setAlertMessage(`No hay suficiente inventario para la placa "${placaName}". Requerido: ${requiredQuantity}, Disponible: ${inventoryItem ? inventoryItem.Cantidad : 0}`);
                    setAlertModalVisible(true);
                    return;
                }
            }

            placasFields.forEach((placaName, index) => {
                const inventoryItem = inventoryData.find((item: { placa: string }) => item.placa === placaName);
                if (inventoryItem) {
                    inventoryItem.Cantidad -= placasUsadas[index];
                }
            });
            localStorage.setItem('inventoryData', JSON.stringify(inventoryData));

            const updatedItem = {
                ...selectedItem,
                CANT_A_FABRICAR: parseInt(desiredQuantity, 10),
                placasUsadas,
                transformedPlacas: placasFields,
            };
            setSelectedItems((prev) => [...prev, updatedItem]);
            setData((prev) => prev.filter((item) => item.ID !== selectedItem.ID));
            setShowModal(false);
            setDesiredQuantity('');
        }
    };

    const handleSubmitSelected = () => {
        if (selectedItems.length === 0) {
            alert('No items selected.');
            return;
        }

        const payload = selectedItems.map((item) => ({
            ID: item.ID,
            CANT_A_FABRICAR: item.CANT_A_FABRICAR,
            transformedPlacas: item.transformedPlacas || [],
            placasUsadas: item.placasUsadas || [],
        }));
        const apiUrl = `${API_BASE_URL}/app/update-${processName}`;

        axios.post(apiUrl, { items: payload }, {
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

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter((item) =>
        item.NOMAUX.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ padding: '20px' }}>
            <button
                style={{
                    marginBottom: '10px',
                    padding: '15px 20px',
                    backgroundColor: '#c8a165',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '18px',
                }}
                onClick={() => navigate('/programa-produccion')}
            >
                Volver
            </button>
            <input
                type="text"
                placeholder={`Buscar cliente en ${processName}...`}
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
                            onChange={(e) => handleDesiredQuantityChange(e.target.value)}
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
                                    onChange={(e) => setPlacasFields((prev) => {
                                        const updated = [...prev];
                                        updated[index] = e.target.value;
                                        return updated;
                                    })}
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
                                    onChange={(e) => setPlacasUsadasFields((prev) => {
                                        const updated = [...prev];
                                        updated[index] = e.target.value;
                                        return updated;
                                    })}
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
                        <button
                            onClick={() => setPlacasFields((prev) => [...prev, ''])}
                            style={{
                                padding: '10px 15px',
                                backgroundColor: '#228B22',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                marginBottom: '15px',
                            }}
                        >
                            Agregar Placa
                        </button>
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
