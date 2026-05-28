import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import BackButton from '../components/BackButton';
import { config } from '../set/config';

interface InventarioRow {
  id: number;
  placa: string;
  fecha_compra: string;
  precio_pp: number;
  precio_total: number;
  cantidad: number;
  oc: string;
}

const API_URL = `${config.apiUrl}/inventario/all`;
const CREATE_PLACA_URL = `${config.apiUrl}/inventario/addplaca`;
const CREATE_PRODUCTO_URL = `${config.apiUrl}/inventario/addproducto`;

type CreateStep = 'choose' | 'PLACA' | 'PRODUCTO';

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseInventoryDate = (value: string): Date | null => {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized) return null;

  if (normalized.includes('/')) {
    const [day, month, year] = normalized.split('/');
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const datePart = normalized.replace(' ', 'T').split('T')[0];
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return null;

  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const emptyCreateForm = {
  largo: '',
  ancho: '',
  celda: '',
  nombre: '',
  cantidad: '',
  precio_pp: '',
  oc: '',
};

const InventarioEdit: React.FC = () => {
  const [data, setData] = useState<InventarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pendingQuantities, setPendingQuantities] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>('choose');
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createSaving, setCreateSaving] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const initial = new Date();
    initial.setDate(initial.getDate() - 13);
    return formatDateForInput(initial);
  });
  const [dateTo, setDateTo] = useState(() => formatDateForInput(new Date()));

  useEffect(() => {
    axios
      .get<InventarioRow[]>(API_URL)
      .then((response) => {
        setData(response.data);
        const initialValues: Record<number, string> = {};
        response.data.forEach((item) => {
          initialValues[item.id] = String(item.cantidad);
        });
        setPendingQuantities(initialValues);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error al cargar inventario');
        setLoading(false);
      });
  }, []);

  const refreshData = async () => {
    const response = await axios.get<InventarioRow[]>(API_URL);
    setData(response.data);
    const initialValues: Record<number, string> = {};
    response.data.forEach((item) => {
      initialValues[item.id] = String(item.cantidad);
    });
    setPendingQuantities(initialValues);
  };

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const fromDate = dateFrom ? parseInventoryDate(dateFrom) : null;
    const toDate = dateTo ? parseInventoryDate(dateTo) : null;

    return data.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        String(item.id).includes(normalizedSearch) ||
        item.placa.toLowerCase().includes(normalizedSearch) ||
        (item.oc || '').toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) return false;

      if (!fromDate && !toDate) return true;

      const itemDate = parseInventoryDate(item.fecha_compra);
      if (!itemDate) return false;

      const itemTime = itemDate.getTime();
      const startTime = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
      const endTime = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

      if (startTime !== null && itemTime < startTime) return false;
      if (endTime !== null && itemTime > endTime) return false;
      return true;
    });
  }, [data, search, dateFrom, dateTo]);

  const handleSave = async (item: InventarioRow) => {
    const rawValue = pendingQuantities[item.id];
    const nextCantidad = Number.parseInt(rawValue, 10);

    if (Number.isNaN(nextCantidad) || nextCantidad < 0) {
      setStatus(`La cantidad de ${item.placa} no es válida.`);
      return;
    }

    setSavingId(item.id);
    setStatus(null);

    try {
      const response = await axios.put(`${config.apiUrl}/inventario/${item.id}`, {
        cantidad: nextCantidad,
      });

      setData((current) =>
        current.map((row) =>
          row.id === item.id
            ? {
                ...row,
                cantidad: nextCantidad,
                precio_total: response.data?.precio_total ?? row.precio_total,
              }
            : row
        )
      );
      setPendingQuantities((current) => ({
        ...current,
        [item.id]: String(nextCantidad),
      }));
      setStatus(`Cantidad actualizada para ${item.placa}.`);
    } catch (err: any) {
      const message = err?.response?.data?.error || err.message || 'Error al actualizar';
      setStatus(message);
    } finally {
      setSavingId(null);
    }
  };

  const openCreateModal = () => {
    setCreateForm(emptyCreateForm);
    setCreateStep('choose');
    setCreateOpen(true);
    setStatus(null);
  };

  const closeCreateModal = () => {
    if (createSaving) return;
    setCreateOpen(false);
    setCreateStep('choose');
    setCreateForm(emptyCreateForm);
  };

  const handleCreate = async () => {
    const cantidad = Number.parseInt(createForm.cantidad, 10);
    const precioPP = Number.parseFloat(createForm.precio_pp);

    if (Number.isNaN(cantidad) || cantidad <= 0) {
      setStatus('La cantidad debe ser mayor a 0.');
      return;
    }
    if (Number.isNaN(precioPP) || precioPP < 0) {
      setStatus('El precio debe ser válido.');
      return;
    }

    if (createStep === 'PLACA') {
      if (!createForm.largo.trim() || !createForm.ancho.trim() || !createForm.celda.trim()) {
        setStatus('Para una placa debes completar largo, ancho y celda.');
        return;
      }
    }

    if (createStep === 'PRODUCTO' && !createForm.nombre.trim()) {
      setStatus('Para un producto debes completar el nombre.');
      return;
    }

    setCreateSaving(true);
    setStatus(null);

    try {
      const payload =
        createStep === 'PLACA'
          ? {
              placa: `PLACA ${createForm.largo.trim()}*${createForm.ancho.trim()} ${createForm.celda.trim()}`.toUpperCase(),
              fecha: '',
              cantidad,
              preciopp: precioPP,
              precio_total: precioPP * cantidad,
              oc: createForm.oc,
            }
          : {
              nombre: createForm.nombre,
              cantidad,
              preciopp: precioPP,
              oc: createForm.oc,
            };

      await axios.post(
        createStep === 'PLACA' ? CREATE_PLACA_URL : CREATE_PRODUCTO_URL,
        payload
      );
      await refreshData();
      setStatus('Producto agregado correctamente.');
      setCreateSaving(false);
      setCreateOpen(false);
      setCreateStep('choose');
      setCreateForm(emptyCreateForm);
      return;
    } catch (err: any) {
      const message = err?.response?.data?.error || err.message || 'Error al agregar inventario';
      setStatus(message);
    } finally {
      setCreateSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Cargando inventario...</div>;
  }

  if (error) {
    return <div style={{ padding: 20, color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <BackButton to="/inventario" label="← Volver al inventario" />
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: '10px 0 6px' }}>Editar inventario</h2>
          <button
            onClick={openCreateModal}
            style={{
              background: '#c8a165',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Agregar producto
          </button>
        </div>
        <p style={{ margin: 0, color: '#666' }}>
          Tabla plana ordenada por `id`. Edita la cantidad y guarda fila por fila.
        </p>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por id, placa u OC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 12px',
            minWidth: 280,
            borderRadius: 8,
            border: '1px solid #d0d0d0',
            outline: 'none',
          }}
        />
        <div style={{ color: '#666' }}>
          Registros: <strong>{filteredData.length}</strong>
        </div>
      </div>

      <div style={{ marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#444', fontSize: 14 }}>
          Desde
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: '10px 12px',
              minWidth: 180,
              borderRadius: 8,
              border: '1px solid #d0d0d0',
              outline: 'none',
            }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#444', fontSize: 14 }}>
          Hasta
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: '10px 12px',
              minWidth: 180,
              borderRadius: 8,
              border: '1px solid #d0d0d0',
              outline: 'none',
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            const today = new Date();
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(today.getDate() - 13);
            setDateFrom(formatDateForInput(twoWeeksAgo));
            setDateTo(formatDateForInput(today));
          }}
          style={{
            alignSelf: 'end',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #c8a165',
            background: '#fff',
            color: '#c8a165',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Últimas 2 semanas
        </button>
      </div>

      {status && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#fff7e8',
            border: '1px solid #e8c98a',
            color: '#7a5a1a',
          }}
        >
          {status}
        </div>
      )}

      <div style={{ overflowX: 'auto', border: '1px solid #e5e5e5', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ backgroundColor: '#c8a165', color: '#fff' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Placa</th>
              <th style={thStyle}>OC</th>
              <th style={thStyle}>Precio PP</th>
              <th style={thStyle}>Precio Total</th>
              <th style={thStyle}>Cantidad actual</th>
              <th style={thStyle}>Nueva cantidad</th>
              <th style={thStyle}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => {
              const currentValue = pendingQuantities[item.id] ?? String(item.cantidad);
              const hasChange = currentValue !== String(item.cantidad);

              return (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.id}</td>
                  <td style={tdStyle}>{item.placa}</td>
                  <td style={tdStyle}>{item.oc || '-'}</td>
                  <td style={tdStyle}>{formatNumber(item.precio_pp)}</td>
                  <td style={tdStyle}>{formatNumber(item.precio_total)}</td>
                  <td style={tdStyle}>{item.cantidad}</td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      min={0}
                      value={currentValue}
                      onChange={(e) =>
                        setPendingQuantities((current) => ({
                          ...current,
                          [item.id]: e.target.value,
                        }))
                      }
                      style={{
                        width: 110,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #d0d0d0',
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleSave(item)}
                      disabled={savingId === item.id || !hasChange}
                      style={{
                        background: savingId === item.id || !hasChange ? '#d9c7ab' : '#c8a165',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 14px',
                        cursor: savingId === item.id || !hasChange ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {savingId === item.id ? 'Guardando...' : 'Guardar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20,
          }}
          onClick={closeCreateModal}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 620,
              background: '#fff',
              borderRadius: 18,
              boxShadow: '0 18px 60px rgba(0,0,0,0.22)',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
              <div>
                <h3 style={{ margin: '0 0 6px' }}>Agregar inventario</h3>
                <div style={{ color: '#666' }}>
                  Primero elige si vas a crear una placa o un producto.
                </div>
              </div>
              <button
                onClick={closeCreateModal}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 24,
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {createStep === 'choose' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 20 }}>
                <button
                  onClick={() => setCreateStep('PLACA')}
                  style={choiceButtonStyle}
                >
                  Placa
                </button>
                <button
                  onClick={() => setCreateStep('PRODUCTO')}
                  style={choiceButtonStyle}
                >
                  Producto
                </button>
              </div>
            )}

            {createStep !== 'choose' && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button
                    onClick={() => setCreateStep('PLACA')}
                    style={{
                      ...tabButtonStyle,
                      background: createStep === 'PLACA' ? '#c8a165' : '#fff',
                      color: createStep === 'PLACA' ? '#fff' : '#c8a165',
                    }}
                  >
                    Placa
                  </button>
                  <button
                    onClick={() => setCreateStep('PRODUCTO')}
                    style={{
                      ...tabButtonStyle,
                      background: createStep === 'PRODUCTO' ? '#c8a165' : '#fff',
                      color: createStep === 'PRODUCTO' ? '#fff' : '#c8a165',
                    }}
                  >
                    Producto
                  </button>
                </div>

                {createStep === 'PLACA' ? (
                  <div style={formGridStyle}>
                    <Field label="Largo" value={createForm.largo} onChange={(value) => setCreateForm((current) => ({ ...current, largo: value }))} />
                    <Field label="Ancho" value={createForm.ancho} onChange={(value) => setCreateForm((current) => ({ ...current, ancho: value }))} />
                    <Field label="Tipo de cartón" value={createForm.celda} onChange={(value) => setCreateForm((current) => ({ ...current, celda: value }))} />
                    <Field label="Cantidad" type="number" min={1} value={createForm.cantidad} onChange={(value) => setCreateForm((current) => ({ ...current, cantidad: value }))} />
                    <Field label="Precio" type="number" min={0} step="0.01" value={createForm.precio_pp} onChange={(value) => setCreateForm((current) => ({ ...current, precio_pp: value }))} />
                    <Field label="OC" value={createForm.oc} onChange={(value) => setCreateForm((current) => ({ ...current, oc: value }))} />
                  </div>
                ) : (
                  <div style={formGridStyle}>
                    <Field label="Nombre" value={createForm.nombre} onChange={(value) => setCreateForm((current) => ({ ...current, nombre: value }))} />
                    <Field label="Cantidad" type="number" min={1} value={createForm.cantidad} onChange={(value) => setCreateForm((current) => ({ ...current, cantidad: value }))} />
                    <Field label="Precio" type="number" min={0} step="0.01" value={createForm.precio_pp} onChange={(value) => setCreateForm((current) => ({ ...current, precio_pp: value }))} />
                    <Field label="OC" value={createForm.oc} onChange={(value) => setCreateForm((current) => ({ ...current, oc: value }))} />
                  </div>
                )}

                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setCreateStep('choose')}
                    style={secondaryActionStyle}
                    disabled={createSaving}
                  >
                    Cambiar tipo
                  </button>
                  <button
                    onClick={handleCreate}
                    style={{
                      ...primaryActionStyle,
                      opacity: createSaving ? 0.75 : 1,
                      cursor: createSaving ? 'not-allowed' : 'pointer',
                    }}
                    disabled={createSaving}
                  >
                    {createSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>

                <div style={{ marginTop: 10, color: '#777', fontSize: 13 }}>
                  En placa se guardará como `PLACA largo*ancho tipo de cartón`, normalizada en mayúsculas.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  step?: string;
};

const Field: React.FC<FieldProps> = ({ label, value, onChange, type = 'text', min, step }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ fontWeight: 600, color: '#444' }}>{label}</span>
    <input
      type={type}
      min={min}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid #d6d6d6',
        outline: 'none',
      }}
    />
  </label>
);

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
};

const choiceButtonStyle: React.CSSProperties = {
  border: '1px solid #c8a165',
  background: '#fff',
  color: '#c8a165',
  borderRadius: 12,
  padding: '18px 14px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 16,
};

const tabButtonStyle: React.CSSProperties = {
  border: '1px solid #c8a165',
  borderRadius: 999,
  padding: '8px 14px',
  cursor: 'pointer',
  fontWeight: 700,
};

const primaryActionStyle: React.CSSProperties = {
  border: 'none',
  background: '#c8a165',
  color: '#fff',
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 700,
};

const secondaryActionStyle: React.CSSProperties = {
  border: '1px solid #c8a165',
  background: '#fff',
  color: '#c8a165',
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 700,
};

const thStyle: React.CSSProperties = {
  border: '1px solid #d8b98a',
  padding: 10,
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  border: '1px solid #e5e5e5',
  padding: 10,
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

const formatNumber = (value: number) => {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
};

export default InventarioEdit;
