import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';

// Set the app element for react-modal
Modal.setAppElement('#root');

interface ReusableProcessComponentProps {
    proceso: string;
}

const ReusableProcessComponent: React.FC<ReusableProcessComponentProps> = ({ proceso }) => {
    const API_BASE_URL = 'http://localhost:3000';
    interface DataItem {
        ID: number;
        NVNUMERO: string;
        NOMAUX: string;
        FECHA_ENTREGA: string;
        PROCESO: string;
        DETPROD: string;
        CANTPROD: number;
        CANT_A_FABRICAR: number;
        PLACAS_A_USAR: string;
        CANTIDAD_PLACAS: string;
    }

    const [data, setData] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<DataItem | null>(null);
    const [formData, setFormData] = useState({
        CANT_A_FABRICAR: '',
        PLACAS_A_USAR: '',
        CANTIDAD_PLACAS: '',
    });
    const [placasFields, setPlacasFields] = useState<string[]>(['']); // Dynamic fields for Placas
    const [placasUsadasFields, setPlacasUsadasFields] = useState<string[]>(['']); // Dynamic fields for Placas Usadas

    const fetchData = () => {
        const apiUrl = `${API_BASE_URL}/app/${proceso}`;
        setLoading(true);
        axios.get<DataItem[]>(apiUrl)
            .then((response) => {
                setData(response.data);
                setLoading(false);
            })
            .catch((error) => {
                setError('Failed to fetch data.');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (row: DataItem) => {
        setSelectedRow(row);
        setFormData({
            CANT_A_FABRICAR: row.CANT_A_FABRICAR.toString(),
            PLACAS_A_USAR: row.PLACAS_A_USAR,
            CANTIDAD_PLACAS: row.CANTIDAD_PLACAS,
        });

        // Pre-fill placas fields based on the row's data
        const placasArray = row.PLACAS_A_USAR
            ? row.PLACAS_A_USAR.replace(/[\[\]"]/g, '').split(',').map((placa) => placa.trim())
            : [];
        const placasUsadasArray = row.CANTIDAD_PLACAS
            ? row.CANTIDAD_PLACAS.replace(/[\[\]"]/g, '').split(',').map((cantidad) => cantidad.trim())
            : [];
        setPlacasFields(placasArray);
        setPlacasUsadasFields(placasUsadasArray);

        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedRow(null);
        setFormData({
            CANT_A_FABRICAR: '',
            PLACAS_A_USAR: '',
            CANTIDAD_PLACAS: '',
        });
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = () => {
        if (!selectedRow) return;

        // Update formData with the latest placasFields and placasUsadasFields
        const updatedFormData = {
            ...formData,
            PLACAS_A_USAR: JSON.stringify(placasFields),
            CANTIDAD_PLACAS: JSON.stringify(placasUsadasFields),
        };

        const payload = {
            ID: selectedRow.ID,
            CANT_A_FABRICAR: parseInt(updatedFormData.CANT_A_FABRICAR, 10),
            PLACAS_A_USAR: updatedFormData.PLACAS_A_USAR,
            CANTIDAD_PLACAS: updatedFormData.CANTIDAD_PLACAS,
        };

        axios.post(`${API_BASE_URL}/edits/edit-${proceso}`, payload)
            .then(() => {
                alert('Data updated successfully!');
                closeModal();
                fetchData();
            })
            .catch(() => {
                alert('Failed to update data.');
            });
    };

    const handleAddPlaca = () => {
        setPlacasFields((prev) => [...prev, '']);
        setPlacasUsadasFields((prev) => [...prev, '']);
    };

    const handleUpdatePlaca = (index: number, value: string) => {
        setPlacasFields((prev) => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    const handleUpdatePlacaUsada = (index: number, value: string) => {
        setPlacasUsadasFields((prev) => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    const handleRemovePlaca = (index: number) => {
        setPlacasFields((prev) => prev.filter((_, i) => i !== index));
        setPlacasUsadasFields((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div>
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p style={{ color: 'red' }}>{error}</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#c8a165', color: '#fff' }}>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nota de venta</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Cliente</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Fecha Entrega</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Proceso</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Producto</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Cantidad a producir</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Placas a usar</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Cantidad de placas</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.ID} style={{ backgroundColor: '#fff', borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.NVNUMERO}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.NOMAUX}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.FECHA_ENTREGA}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.PROCESO}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.DETPROD}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.CANT_A_FABRICAR}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.PLACAS_A_USAR}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.CANTIDAD_PLACAS}</td>
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
                                        onClick={() => openModal(item)}
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={{
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                    content: {
                        backgroundColor: '#fff',
                        padding: '25px',
                        borderRadius: '10px',
                        width: '400px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                        textAlign: 'center',
                        position: 'relative',
                        margin: 'auto',
                    },
                }}
            >
                <h3 style={{ marginBottom: '20px', color: '#333' }}>Editar Fila</h3>
                {selectedRow && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '10px', color: '#555' }}>
                            Cantidad a fabricar:
                            <input
                                type="number"
                                value={formData.CANT_A_FABRICAR}
                                onChange={(e) => handleInputChange('CANT_A_FABRICAR', e.target.value)}
                                style={{
                                    width: '90%',
                                    padding: '12px',
                                    marginBottom: '10px',
                                    border: '1px solid #ccc',
                                    borderRadius: '5px',
                                    fontSize: '16px',
                                }}
                            />
                        </label>
                        {placasFields.map((placa, index) => (
                            <div key={`placa-group-${index}`} style={{ marginBottom: '15px' }}>
                                <input
                                    type="text"
                                    placeholder={`Tipo Placa ${index + 1}`}
                                    value={placa}
                                    onChange={(e) => handleUpdatePlaca(index, e.target.value)}
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
                                    placeholder={`Placas Usadas ${index + 1}`}
                                    value={placasUsadasFields[index] || ''}
                                    onChange={(e) => handleUpdatePlacaUsada(index, e.target.value)}
                                    style={{
                                        width: '90%',
                                        padding: '12px',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '16px',
                                    }}
                                />
                                <button
                                    onClick={() => handleRemovePlaca(index)}
                                    style={{
                                        padding: '5px 10px',
                                        backgroundColor: '#ff4c4c',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        marginTop: '5px',
                                    }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={handleAddPlaca}
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
                                marginBottom: '15px',
                            }}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: '#fff',
                                    color: '#228B22',
                                    fontWeight: 'bold',
                                    borderRadius: '50%',
                                    marginRight: '8px',
                                    fontSize: '14px',
                                }}
                            >
                                +
                            </span>
                            Agregar Placa
                        </button>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={handleSubmit}
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
                                Guardar
                            </button>
                            <button
                                onClick={closeModal}
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
                )}
            </Modal>
        </div>
    );
};

export default ReusableProcessComponent;
