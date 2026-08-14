import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { config } from '../set/config';

type AlertRow = {
    id?: number;
    id_proceso?: number;
    proceso?: string;
    nv_numero?: string;
    cliente?: string;
    producto?: string;
    placa?: string;
    placas_orden?: number;
    placas_usadas?: number;
    diferencia?: number;
    porcentaje_exceso?: number;
    mensaje?: string;
    fecha?: string;
};

const AlertsPage: React.FC = () => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState<AlertRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [processFilter, setProcessFilter] = useState('all');

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(user);
            if ((parsedUser.rol || '').toString().toLowerCase() !== 'superadmin') {
                navigate('/home');
                return;
            }
        } catch {
            navigate('/home');
            return;
        }

        const fetchAlerts = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${config.apiUrl}/app/alertas`);
                const rows = Array.isArray(response.data?.data) ? response.data.data : [];
                setAlerts(rows);
                setError(null);
            } catch (err) {
                console.error('Error fetching alerts:', err);
                setError('No se pudieron cargar las alertas.');
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, [navigate]);

    const processOptions = useMemo(() => {
        const values = alerts
            .map((item) => (item.proceso || '').trim())
            .filter(Boolean);
        return ['all', ...Array.from(new Set(values))];
    }, [alerts]);

    const filteredAlerts = useMemo(() => {
        const searchTerm = search.trim().toLowerCase();
        return alerts.filter((item) => {
            const matchesProcess = processFilter === 'all' || (item.proceso || '') === processFilter;
            if (!matchesProcess) {
                return false;
            }

            if (!searchTerm) {
                return true;
            }

            const haystack = [
                item.proceso,
                item.nv_numero,
                item.cliente,
                item.producto,
                item.placa,
                item.mensaje,
                item.fecha,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(searchTerm);
        });
    }, [alerts, search, processFilter]);

    return (
        <div style={styles.page}>
            <img src="/interchico.webp" alt="Watermark" style={styles.watermark} />

            <div style={styles.shell}>
                <div style={styles.topBar}>
                    <BackButton to="/home" label="← Volver" />
                    <button style={styles.refreshButton} onClick={() => window.location.reload()}>
                        Recargar
                    </button>
                </div>

                <div style={styles.hero}>
                    <p style={styles.kicker}>Monitoreo de excedentes</p>
                    <h1 style={styles.title}>Alertas registradas</h1>
                    <p style={styles.subtitle}>
                        Registros generados cuando una placa supera el 2% sobre la cantidad esperada de la orden.
                    </p>
                </div>

                <div style={styles.toolbar}>
                    <input
                        type="text"
                        placeholder="Buscar por proceso, cliente, placa, NV o mensaje"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={styles.searchInput}
                    />
                    <select
                        value={processFilter}
                        onChange={(e) => setProcessFilter(e.target.value)}
                        style={styles.select}
                    >
                        <option value="all">Todos los procesos</option>
                        {processOptions
                            .filter((item) => item !== 'all')
                            .map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                    </select>
                </div>

                <div style={styles.summaryRow}>
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryValue}>{filteredAlerts.length}</div>
                        <div style={styles.summaryLabel}>Mostradas</div>
                    </div>
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryValue}>{alerts.length}</div>
                        <div style={styles.summaryLabel}>Totales</div>
                    </div>
                </div>

                {loading ? (
                    <div style={styles.stateBox}>Cargando alertas...</div>
                ) : error ? (
                    <div style={{ ...styles.stateBox, ...styles.errorBox }}>{error}</div>
                ) : filteredAlerts.length === 0 ? (
                    <div style={styles.stateBox}>No hay alertas para mostrar.</div>
                ) : (
                    <div style={styles.list}>
                        {filteredAlerts.map((item, index) => {
                            const severity = (item.porcentaje_exceso || 0) >= 15 ? 'high' : 'medium';
                            return (
                                <article key={item.id ?? index} style={styles.card}>
                                    <div style={styles.cardHeader}>
                                        <div>
                                            <div style={styles.cardTitle}>
                                                {item.placa || 'Placa sin nombre'}
                                            </div>
                                            <div style={styles.cardMeta}>
                                                {item.proceso || 'Proceso'} · NV {item.nv_numero || '-'}
                                            </div>
                                        </div>
                                        <span
                                            style={{
                                                ...styles.badge,
                                                ...(severity === 'high' ? styles.badgeHigh : styles.badgeMedium),
                                            }}
                                        >
                                            {Number(item.porcentaje_exceso || 0).toFixed(2)}%
                                        </span>
                                    </div>

                                    <div style={styles.cardGrid}>
                                        <div style={styles.field}>
                                            <span style={styles.fieldLabel}>Cliente</span>
                                            <span style={styles.fieldValue}>{item.cliente || '-'}</span>
                                        </div>
                                        <div style={styles.field}>
                                            <span style={styles.fieldLabel}>Producto</span>
                                            <span style={styles.fieldValue}>{item.producto || '-'}</span>
                                        </div>
                                        <div style={styles.field}>
                                            <span style={styles.fieldLabel}>Orden</span>
                                            <span style={styles.fieldValue}>{item.placas_orden ?? '-'}</span>
                                        </div>
                                        <div style={styles.field}>
                                            <span style={styles.fieldLabel}>Usadas</span>
                                            <span style={styles.fieldValue}>{item.placas_usadas ?? '-'}</span>
                                        </div>
                                        <div style={styles.field}>
                                            <span style={styles.fieldLabel}>Diferencia</span>
                                            <span style={styles.fieldValue}>{item.diferencia ?? '-'}</span>
                                        </div>
                                        <div style={styles.field}>
                                            <span style={styles.fieldLabel}>Fecha</span>
                                            <span style={styles.fieldValue}>{item.fecha || '-'}</span>
                                        </div>
                                    </div>

                                    <p style={styles.message}>{item.mensaje || ''}</p>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8f4ee 0%, #f5f5f5 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '24px 16px 40px',
    },
    watermark: {
        position: 'fixed',
        width: '360px',
        height: '360px',
        opacity: 0.12,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0,
    },
    shell: {
        position: 'relative',
        zIndex: 1,
        maxWidth: '1180px',
        margin: '0 auto',
    },
    topBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '18px',
        flexWrap: 'wrap',
    },
    refreshButton: {
        background: '#22313f',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 18px',
        fontSize: '15px',
        fontWeight: 700,
        cursor: 'pointer',
    },
    hero: {
        background: 'rgba(255,255,255,0.82)',
        border: '1px solid rgba(200,161,101,0.18)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 18px 50px rgba(0,0,0,0.06)',
        marginBottom: '20px',
        backdropFilter: 'blur(8px)',
    },
    kicker: {
        margin: 0,
        fontSize: '12px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: '#8d6b3b',
        fontWeight: 700,
    },
    title: {
        margin: '8px 0 10px',
        fontSize: '34px',
        lineHeight: 1.05,
        color: '#1f2937',
    },
    subtitle: {
        margin: 0,
        color: '#4b5563',
        fontSize: '16px',
        maxWidth: '760px',
    },
    toolbar: {
        display: 'grid',
        gridTemplateColumns: '1fr 260px',
        gap: '12px',
        marginBottom: '18px',
    },
    searchInput: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid #d7c3a1',
        fontSize: '15px',
        outline: 'none',
        background: '#fff',
    },
    select: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid #d7c3a1',
        fontSize: '15px',
        background: '#fff',
        outline: 'none',
    },
    summaryRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '12px',
        marginBottom: '18px',
    },
    summaryCard: {
        background: '#fff',
        borderRadius: '16px',
        padding: '18px',
        border: '1px solid #ede2d0',
        boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
    },
    summaryValue: {
        fontSize: '28px',
        fontWeight: 800,
        color: '#c08a3a',
    },
    summaryLabel: {
        fontSize: '14px',
        color: '#6b7280',
        marginTop: '4px',
    },
    stateBox: {
        background: '#fff',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        color: '#374151',
        border: '1px solid #eee',
    },
    errorBox: {
        color: '#b42318',
        borderColor: '#f3c1bd',
    },
    list: {
        display: 'grid',
        gap: '14px',
    },
    card: {
        background: 'linear-gradient(180deg, #ffffff 0%, #fffdf8 100%)',
        borderRadius: '18px',
        padding: '18px',
        border: '1px solid #eadfca',
        boxShadow: '0 14px 32px rgba(0,0,0,0.05)',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '14px',
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: 800,
        color: '#1f2937',
    },
    cardMeta: {
        marginTop: '4px',
        color: '#6b7280',
        fontSize: '13px',
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '74px',
        padding: '8px 10px',
        borderRadius: '999px',
        fontSize: '13px',
        fontWeight: 800,
        color: '#fff',
    },
    badgeMedium: {
        background: '#b45309',
    },
    badgeHigh: {
        background: '#991b1b',
    },
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '10px 14px',
        marginBottom: '12px',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    fieldLabel: {
        fontSize: '12px',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: '#8b6f44',
        fontWeight: 700,
    },
    fieldValue: {
        fontSize: '14px',
        color: '#1f2937',
        fontWeight: 600,
    },
    message: {
        margin: 0,
        padding: '12px 14px',
        borderRadius: '12px',
        background: '#fff7ed',
        color: '#92400e',
        fontSize: '14px',
        fontWeight: 600,
    },
};

export default AlertsPage;
