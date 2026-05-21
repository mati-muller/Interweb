import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { config } from '../set/config';

interface ProcesoItem {
    ID: number;
    PROCESO: string;
    ESTADO_PROC: string;
    NVCANT: number;
    CANT_A_PROD: number;
    FECHA_ENTREGA: string;
    cantidad_producida: number;
}

interface NVItem {
    NVNUMERO: string;
    DetProd: string;
    NOMAUX: string;
    procesos: ProcesoItem[];
}

interface SelectedNote extends NVItem {
    NVNUMERO: string;
    DetProd: string;
    NOMAUX: string;
    currentFechaEntrega: string;
}

const toDateInputValue = (value: string) => {
    if (!value) return '';

    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        return trimmed.slice(0, 10);
    }

    const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
        return `${match[3]}-${match[2]}-${match[1]}`;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }

    return '';
};

const ProcesosTable: React.FC = () => {
    const [data, setData] = useState<NVItem[]>([]);
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedNote, setSelectedNote] = useState<SelectedNote | null>(null);
    const [newFechaEntrega, setNewFechaEntrega] = useState('');
    const [savingFecha, setSavingFecha] = useState(false);

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

    useEffect(() => {
        fetchData();
    }, []);

    const openFechaModal = (item: NVItem) => {
        const firstFecha = item.procesos.find((p) => p.FECHA_ENTREGA)?.FECHA_ENTREGA || '';
        setSelectedNote({
            ...item,
            NVNUMERO: item.NVNUMERO,
            DetProd: item.DetProd,
            NOMAUX: item.NOMAUX,
            currentFechaEntrega: firstFecha,
        });
        setNewFechaEntrega(toDateInputValue(firstFecha));
    };

    const closeFechaModal = () => {
        setSelectedNote(null);
        setNewFechaEntrega('');
    };

    const handleSaveFecha = async () => {
        if (!selectedNote || !newFechaEntrega) return;

        setSavingFecha(true);
        try {
            await axios.put(`${config.apiUrl}/procesos/fecha-entrega`, {
                NVNUMERO: selectedNote.NVNUMERO,
                FECHA_ENTREGA: newFechaEntrega,
            });
            closeFechaModal();
            await fetchData();
            alert('Fecha de entrega actualizada.');
        } catch (err) {
            alert('No se pudo actualizar la fecha de entrega.');
        } finally {
            setSavingFecha(false);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ width: '100vw', minHeight: '100vh', background: '#faf8f5', padding: '30px 0' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
                <div style={{ height: '58px' }} />
                <div style={{ margin: '0 0 0', position: 'relative', left: 0, alignContent: 'left', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', alignItems: 'left', maxWidth: '1400px', margin: '0 auto' }}>
                        <input
                            type="text"
                            placeholder="Buscar cliente o nota de venta..."
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
                <div style={{ height: '18px' }} />
            </div>
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', background: '#fff' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#c8a165', color: '#fff' }}>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nota de venta</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Producto</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Cliente</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data
                            .filter(item => {
                                const procesos = Array.isArray(item.procesos) ? item.procesos : [];
                                const allListo = procesos.length > 0 && procesos.every((p) => (p.ESTADO_PROC || '').toString().toLowerCase() === 'listo');
                                if (allListo) return false;
                                const term = search.toLowerCase();
                                return (
                                    (item.NOMAUX || '').toLowerCase().includes(term) ||
                                    (item.NVNUMERO || '').toLowerCase().includes(term)
                                );
                            })
                            .map((item, index) => (
                                <React.Fragment key={`${item.NVNUMERO}-${item.DetProd}-${index}`}>
                                    <tr
                                        style={{
                                            backgroundColor: selectedRowIndex === index ? '#f5f5f5' : '#fff',
                                            borderBottom: '1px solid #ddd',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => setSelectedRowIndex(selectedRowIndex === index ? null : index)}
                                    >
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.NVNUMERO}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.DetProd}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.NOMAUX}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openFechaModal(item);
                                                }}
                                                style={{
                                                    padding: '6px 10px',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    backgroundColor: '#c8a165',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Cambiar fecha
                                            </button>
                                        </td>
                                    </tr>
                                    {selectedRowIndex === index && (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '10px', border: '1px solid #ddd' }}>
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
                                                        {item.procesos.map((proceso, procIndex) => (
                                                            <tr key={proceso.ID || procIndex} style={{ backgroundColor: '#fff', borderBottom: '1px solid #ddd' }}>
                                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{proceso.PROCESO}</td>
                                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{proceso.ESTADO_PROC}</td>
                                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{proceso.CANT_A_PROD}</td>
                                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{proceso.cantidad_producida}</td>
                                                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{proceso.NVCANT}</td>
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

            {selectedNote && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '20px',
                    }}
                    onClick={closeFechaModal}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '460px',
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>Cambiar fecha de entrega</h3>
                        <p style={{ margin: '0 0 8px', color: '#666' }}>
                            Nota de venta: {selectedNote.NVNUMERO}
                        </p>
                        <p style={{ margin: '0 0 18px', color: '#666' }}>
                            Cliente: {selectedNote.NOMAUX}
                            <br />
                            Producto: {selectedNote.DetProd}
                            <br />
                            Fecha actual: {selectedNote.currentFechaEntrega || 'Sin fecha'}
                            <br />
                            El cambio se aplicará a todos los procesos de esta nota.
                        </p>
                        <label style={{ display: 'block', fontWeight: 600, color: '#444', marginBottom: '8px' }}>
                            Nueva fecha de entrega
                        </label>
                        <input
                            type="date"
                            value={newFechaEntrega}
                            onChange={(e) => setNewFechaEntrega(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ccc',
                                borderRadius: '6px',
                                fontSize: '16px',
                                boxSizing: 'border-box',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' }}>
                            <button
                                onClick={closeFechaModal}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #c8a165',
                                    backgroundColor: '#fff',
                                    color: '#c8a165',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                }}
                                disabled={savingFecha}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveFecha}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: '#c8a165',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    opacity: savingFecha ? 0.7 : 1,
                                }}
                                disabled={savingFecha || !newFechaEntrega}
                            >
                                {savingFecha ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcesosTable;
