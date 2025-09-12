import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { config } from '../../set/config'; // Corrected import path
// Set the app element for react-modal
Modal.setAppElement('#root');

interface ReusableProcessComponentProps {
    proceso: string;
}

const ReusableProcessComponent: React.FC<ReusableProcessComponentProps> = ({ proceso }) => {
    const API_BASE_URL = config.apiUrl; // Use apiUrl from config
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
    const [placasCantMat, setPlacasCantMat] = useState<number[]>([]); // Nuevo: guarda CantMat de cada placa
    const [placasOptions, setPlacasOptions] = useState<string[]>([]); // Options fetched from API
    const [placasLoading, setPlacasLoading] = useState<boolean>(false);
    const [placasError, setPlacasError] = useState<string | null>(null);

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
        
        // Fetch placas options from API
        const fetchPlacas = async () => {
            setPlacasLoading(true);
            try {
                const res = await axios.get<{ placa: string }[]>(`${API_BASE_URL}/inventario/placas`);
                const opciones = res.data.map((p) => p.placa);
                setPlacasOptions(opciones);
            } catch (err) {
                console.error('Error fetching placas options', err);
                setPlacasError('No se pudo cargar las placas');
            } finally {
                setPlacasLoading(false);
            }
        };
        fetchPlacas();
    }, []);

    const openModal = (row: DataItem) => {
        setSelectedRow(row);
        setFormData({
            CANT_A_FABRICAR: row.CANT_A_FABRICAR.toString(),
            PLACAS_A_USAR: row.PLACAS_A_USAR,
            CANTIDAD_PLACAS: row.CANTIDAD_PLACAS,
        });

        // Pre-fill placas fields based on the row's data (robust JSON parse)
        let placasArray: string[] = [];
        let placasUsadasArray: string[] = [];
        try {
            const parsed = JSON.parse(row.PLACAS_A_USAR);
            placasArray = Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
            placasArray = [];
        }
        try {
            const parsed = JSON.parse(row.CANTIDAD_PLACAS);
            placasUsadasArray = Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
            placasUsadasArray = [];
        }
        setPlacasFields(placasArray);
        setPlacasUsadasFields(placasUsadasArray);

        // Fetch una sola vez el CantMat y lo guarda en el estado
        // Usar el endpoint correcto para obtener CantMat
        fetch(`${API_BASE_URL}/procesos/pendientes-${proceso}`)
            .then(res => res.json())
            .then((data: any[]) => {
                const item = data.find((d) => d.ID === row.ID);
                if (item && item.Placas) {
                    let placasArr = item.Placas;
                    if (typeof placasArr === 'string') {
                        try { placasArr = JSON.parse(placasArr); } catch { placasArr = []; }
                    }
                    if (Array.isArray(placasArr)) {
                        setPlacasCantMat(placasArr.map((placa: any) => Number(placa.CantMat) || 1));
                        // Sugerencia inicial
                        if (row.CANT_A_FABRICAR) {
                            const sugeridas = placasArr.map((placa: any) => {
                                const cantmat = Number(placa.CantMat) || 1;
                                return Math.ceil(Number(row.CANT_A_FABRICAR) * cantmat).toString();
                            });
                            setPlacasUsadasFields(sugeridas);
                        }
                    }
                }
            });

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

        // Si el usuario cambia la cantidad a fabricar, usa el CantMat ya guardado
        if (field === 'CANT_A_FABRICAR' && placasCantMat.length > 0) {
            const sugeridas = placasCantMat.map((cantmat) => {
                return Math.ceil(Number(value) * cantmat).toString();
            });
            setPlacasUsadasFields(sugeridas);
        }
    };

    const handleSubmit = () => {
        if (!selectedRow) return;

        // Filtrar strings vacíos antes de enviar
        const filteredPlacasFields = placasFields.filter((p) => p && p.trim() !== '');
        const filteredPlacasUsadasFields = placasUsadasFields
            .map((p) => p && p.trim() !== '' ? Number(p) : null)
            .filter((p) => p !== null) as number[];

        const payload = {
            ID: selectedRow.ID,
            CANT_A_FABRICAR: parseInt(formData.CANT_A_FABRICAR, 10),
            transformedPlacas: filteredPlacasFields,
            placasUsadas: filteredPlacasUsadasFields,
        };

        axios.post(`${API_BASE_URL}/edit-${proceso}`, payload)
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
        setPlacasFields((prev) => {
            const filtered = prev.filter((p) => p && p.trim() !== '');
            return [...filtered, ''];
        });
        setPlacasUsadasFields((prev) => {
            const filtered = prev.filter((p) => p && p.trim() !== '');
            return [...filtered, ''];
        });
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
        setPlacasFields((prev) => {
            const filtered = prev.filter((_, i) => i !== index).filter((p) => p && p.trim() !== '');
            return filtered.length > 0 ? filtered : [];
        });
        setPlacasUsadasFields((prev) => {
            const filtered = prev.filter((_, i) => i !== index).filter((p) => p && p.trim() !== '');
            return filtered.length > 0 ? filtered : [];
        });
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
                        {data.map((item) => {
                            let placasAUsar: string[] = [];
                            let cantidadPlacas: string[] = [];
                            try {
                                const parsedPlacas = JSON.parse(item.PLACAS_A_USAR);
                                placasAUsar = Array.isArray(parsedPlacas) ? parsedPlacas : [];
                            } catch {
                                placasAUsar = [];
                            }
                            try {
                                const parsedCant = JSON.parse(item.CANTIDAD_PLACAS);
                                cantidadPlacas = Array.isArray(parsedCant) ? parsedCant : [];
                            } catch {
                                cantidadPlacas = [];
                            }

                            return (
                                <tr key={item.ID} style={{ backgroundColor: '#fff', borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.NVNUMERO}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.NOMAUX}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.FECHA_ENTREGA}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.PROCESO}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.DETPROD}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.CANT_A_FABRICAR}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        {placasAUsar.map((placa: string, index: number) => (
                                            <div key={`placa-${index}`} style={{ marginBottom: '5px' }}>
                                                <strong>Placa:</strong> {placa}
                                            </div>
                                        ))}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        {cantidadPlacas.map((cantidad: string, index: number) => (
                                            <div key={`cantidad-${index}`} style={{ marginBottom: '5px' }}>
                                                <strong>Cantidad:</strong> {cantidad}
                                            </div>
                                        ))}
                                    </td>
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
                            );
                        })}
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
                                {/* Replace free-text placa input with a select populated from /inventario/placas but keep prerellenado */}
                                <select
                                    value={placa}
                                    onChange={(e) => handleUpdatePlaca(index, e.target.value)}
                                    style={{
                                        width: '90%',
                                        padding: '12px',
                                        marginBottom: '10px',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '16px',
                                        backgroundColor: '#fff',
                                    }}
                                >
                                    {/* If loading show a single option */}
                                    {placasLoading && <option>Loading...</option>}
                                    {!placasLoading && placasError && <option>{placasError}</option>}
                                    {!placasLoading && !placasError && (
                                        <>
                                            {/* If there's a prerellenado value that is not in opciones, keep it as first option */}
                                            {placa && !placasOptions.includes(placa) && (
                                                <option value={placa}>{placa}</option>
                                            )}
                                            {placasOptions.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </>
                                    )}
                                </select>
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
