import { useState, useEffect, useCallback } from 'react';

export default function TallerPropietario({ onClose }) {
  const [pestana, setPestana] = useState('asignar');
  const [presupuestos, setPresupuestos] = useState([]);
  const [trabajos, setTrabajos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [metricas, setMetricas] = useState([]);
  const [metricasAnuales, setMetricasAnuales] = useState([]);
  const [metricasHistorico, setMetricasHistorico] = useState([]);
  const [subvistaMet, setSubvistaMet] = useState('actual'); // 'actual' | 'historico' | 'anual'
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Modal de asignación
  const [modalAsignar, setModalAsignar] = useState(null);
  const [asignacion, setAsignacion] = useState({ fecha_entrega: '', tareas: [] });

  // Modal de sueldo
  const [modalSueldo, setModalSueldo] = useState(null);
  const [sueldoReal, setSueldoReal] = useState('');

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resPresupuestos, resTrab, resEmp, resCat] = await Promise.all([
        fetch('/api/taller/presupuestos-aprobados'),
        fetch('/api/taller/trabajos'),
        fetch('/api/empleados'),
        fetch('/api/catalogo')
      ]);
      setPresupuestos(await resPresupuestos.json());
      setTrabajos(await resTrab.json());
      setEmpleados(await resEmp.json());
      const catData = await resCat.json();
      setCatalogo(catData.productos || catData || []);
    } catch (e) {
      setMensaje('Error al cargar datos');
    }
    setLoading(false);
  }, []);

  const cargarMetricas = useCallback(async () => {
    setLoadingMetricas(true);
    try {
      const [resMet, resAnual, resHist] = await Promise.all([
        fetch('/api/taller/metricas'),
        fetch('/api/taller/metricas/anual'),
        fetch('/api/taller/metricas/historico')
      ]);
      const metData = await resMet.json();
      setMetricas(metData.metricas || []);
      const anualData = await resAnual.json();
      setMetricasAnuales(anualData || []);
      const histData = await resHist.json();
      setMetricasHistorico(Array.isArray(histData) ? histData : []);
    } catch (e) {
      setMensaje('Error al cargar métricas');
    }
    setLoadingMetricas(false);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (pestana === 'metricas') {
      cargarMetricas();
    }
  }, [pestana, cargarMetricas]);

  const abrirModalAsignar = (presupuesto, item, itemIndex) => {
    const productoId = parseInt(item.producto_id);
    const producto = catalogo.find(p => p.id === productoId);

    let empsCatalogo = item.empleados_catalogo || [];
    if (empsCatalogo.length === 0 && producto && producto.datos_calculo) {
      const dc = typeof producto.datos_calculo === 'string'
        ? JSON.parse(producto.datos_calculo)
        : producto.datos_calculo;
      empsCatalogo = dc.empleados || [];
    }

    let tareasIniciales = [];
    if (empsCatalogo.length > 0) {
      tareasIniciales = empsCatalogo.map((emp, i) => ({
        id: Date.now() + i,
        empleado_id: '',
        nombre_tarea: emp.nombre_tarea || `Tarea ${i + 1}`,
        horas_estimadas: parseFloat(emp.horas || 0) * (item.cantidad || 1),
        valor_sueldo_tarea: 0,
        compartida_con: ''
      }));
    }

    if (tareasIniciales.length === 0) {
      tareasIniciales = [{
        id: Date.now(),
        empleado_id: '',
        nombre_tarea: 'Trabajo general',
        horas_estimadas: 0,
        valor_sueldo_tarea: item.snapshot_y ? item.snapshot_y * (item.cantidad || 1) : 0,
        compartida_con: ''
      }];
    }

    const totalHoras = tareasIniciales.reduce((sum, t) => sum + t.horas_estimadas, 0);
    const valorSueldoTotal = (item.snapshot_y || 0) * (item.cantidad || 1);
    tareasIniciales = tareasIniciales.map(t => ({
      ...t,
      valor_sueldo_tarea: totalHoras > 0
        ? Math.round((t.horas_estimadas / totalHoras) * valorSueldoTotal * 100) / 100
        : Math.round(valorSueldoTotal / tareasIniciales.length * 100) / 100
    }));

    setAsignacion({ fecha_entrega: '', tareas: tareasIniciales });
    setModalAsignar({ presupuesto, item, itemIndex });
  };

  const actualizarTarea = (tareaId, campo, valor) => {
    setAsignacion(prev => ({
      ...prev,
      tareas: prev.tareas.map(t => t.id === tareaId ? { ...t, [campo]: valor } : t)
    }));
  };

  const agregarTarea = () => {
    setAsignacion(prev => ({
      ...prev,
      tareas: [...prev.tareas, {
        id: Date.now(),
        empleado_id: '',
        nombre_tarea: '',
        horas_estimadas: 0,
        valor_sueldo_tarea: 0,
        compartida_con: ''
      }]
    }));
  };

  const eliminarTarea = (tareaId) => {
    setAsignacion(prev => ({
      ...prev,
      tareas: prev.tareas.filter(t => t.id !== tareaId)
    }));
  };

  const guardarAsignacion = async () => {
    if (!asignacion.fecha_entrega) {
      setMensaje('Ingresá la fecha de entrega');
      return;
    }
    if (asignacion.tareas.some(t => !t.empleado_id)) {
      setMensaje('Asigná un empleado a cada tarea');
      return;
    }

    const { presupuesto, item } = modalAsignar;
    const nombreProducto = item.nombre_producto || `Producto #${item.producto_id}`;

    const tareasConCompaneros = asignacion.tareas.map(tarea => {
      const companeros = asignacion.tareas
        .filter(t => t.id !== tarea.id && t.empleado_id)
        .map(t => empleados.find(e => e.id === parseInt(t.empleado_id))?.nombre || '')
        .filter(n => n)
        .join(', ');
      return {
        empleado_id: parseInt(tarea.empleado_id),
        nombre_tarea: tarea.nombre_tarea,
        horas_estimadas: parseFloat(tarea.horas_estimadas) || 0,
        valor_sueldo_tarea: parseFloat(tarea.valor_sueldo_tarea) || 0,
        compartida_con: asignacion.tareas.length > 1 ? companeros : ''
      };
    });

    try {
      const res = await fetch('/api/taller/trabajos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presupuesto_id: presupuesto.id,
          producto_nombre: nombreProducto,
          cantidad: item.cantidad || 1,
          fecha_entrega: asignacion.fecha_entrega,
          valor_sueldo: (item.snapshot_y || 0) * (item.cantidad || 1),
          tareas: tareasConCompaneros
        })
      });
      if (res.ok) {
        setMensaje('✅ Trabajo asignado correctamente');
        setModalAsignar(null);
        cargarDatos();
      } else {
        const err = await res.json();
        setMensaje('Error: ' + (err.error || 'desconocido'));
      }
    } catch (e) {
      setMensaje('Error de conexión');
    }
  };

  const cargarSueldo = async () => {
    if (!sueldoReal || isNaN(sueldoReal) || parseFloat(sueldoReal) < 0) {
      setMensaje('Ingresá un sueldo válido');
      return;
    }
    try {
      const res = await fetch(`/api/taller/metricas/empleado/${modalSueldo.empleado_id}/sueldo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sueldo_real: parseFloat(sueldoReal) })
      });
      if (res.ok) {
        setMensaje(`✅ Sueldo de ${modalSueldo.nombre} actualizado`);
        setModalSueldo(null);
        setSueldoReal('');
        cargarMetricas();
      }
    } catch (e) {
      setMensaje('Error al guardar sueldo');
    }
  };

  const getColorEstado = (estado) => {
    const colores = {
      pendiente: '#f59e0b',
      en_progreso: '#3b82f6',
      entregado: '#10b981',
      tarde: '#ef4444'
    };
    return colores[estado] || '#6b7280';
  };

  const getLabelEstado = (estado) => {
    const labels = {
      pendiente: 'PENDIENTE',
      en_progreso: 'EN PROGRESO',
      entregado: '✅ ENTREGADO',
      tarde: '⚠️ TARDE'
    };
    return labels[estado] || estado?.toUpperCase();
  };

  const getColorRatio = (estado_color) => {
    const colores = {
      rojo: '#ef4444',
      amarillo: '#f59e0b',
      verde: '#10b981',
      recompensa: '#7c3aed',
      gris: '#9ca3af'
    };
    return colores[estado_color] || '#9ca3af';
  };

  const formatMoney = (n) => `$${(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'flex-start',
      zIndex: 2000, overflowY: 'auto', padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
        width: '100%', maxWidth: '1100px', minHeight: '80vh',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          color: 'white', padding: '20px 24px', borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px' }}>🏭 Gestión de Taller</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>Vista Propietario</p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
          }}>✕ Cerrar</button>
        </div>

        {/* Pestañas */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', padding: '0 24px' }}>
          {[
            { id: 'asignar', label: '📋 Asignar Trabajos' },
            { id: 'seguimiento', label: '👁 Seguimiento' },
            { id: 'metricas', label: '📊 Métricas' }
          ].map(p => (
            <button key={p.id} onClick={() => setPestana(p.id)} style={{
              padding: '14px 20px', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: '14px', fontWeight: pestana === p.id ? '700' : '400',
              color: pestana === p.id ? '#1e3a8a' : '#6b7280',
              borderBottom: pestana === p.id ? '3px solid #1e3a8a' : '3px solid transparent',
              marginBottom: '-2px'
            }}>{p.label}</button>
          ))}
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div style={{
            margin: '16px 24px 0', padding: '10px 16px', borderRadius: '6px',
            backgroundColor: mensaje.includes('✅') ? '#d1fae5' : '#fee2e2',
            color: mensaje.includes('✅') ? '#065f46' : '#991b1b', fontSize: '14px'
          }}>
            {mensaje}
            <button onClick={() => setMensaje('')} style={{
              float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px'
            }}>×</button>
          </div>
        )}

        <div style={{ padding: '24px' }}>

          {/* ─── PESTAÑA ASIGNAR ─── */}
          {pestana === 'asignar' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#1f2937', margin: 0 }}>Presupuestos aprobados</h3>
                <button onClick={cargarDatos} disabled={loading} style={{
                  backgroundColor: '#f3f4f6', border: '1px solid #d1d5db',
                  padding: '8px 16px', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '13px', opacity: loading ? 0.6 : 1
                }}>{loading ? '⏳ Cargando...' : '🔄 Actualizar'}</button>
              </div>
              {loading ? (
                <p style={{ color: '#6b7280' }}>Cargando...</p>
              ) : presupuestos.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  No hay presupuestos aprobados aún
                </div>
              ) : (
                presupuestos.map(pres => (
                  <div key={pres.id} style={{
                    border: '1px solid #e5e7eb', borderRadius: '8px',
                    marginBottom: '16px', overflow: 'hidden'
                  }}>
                    <div style={{
                      backgroundColor: '#f8fafc', padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <strong style={{ color: '#1e3a8a' }}>Presupuesto #{pres.numero}</strong>
                        <span style={{ color: '#6b7280', marginLeft: '12px', fontSize: '14px' }}>
                          {pres.cliente} {pres.empresa ? `(${pres.empresa})` : ''}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {pres.trabajos_asignados} trabajo(s) asignado(s)
                      </span>
                    </div>
                    {pres.items.map((item, idx) => {
                      const yaAsignado = item.trabajo_asignado;
                      const estadoTrabajo = item.trabajo_estado;
                      const esTerminado = estadoTrabajo === 'entregado' || estadoTrabajo === 'tarde';

                      return (
                        <div key={idx} style={{
                          padding: '14px 16px', display: 'flex',
                          justifyContent: 'space-between', alignItems: 'center',
                          borderBottom: idx < pres.items.length - 1 ? '1px solid #f3f4f6' : 'none',
                          backgroundColor: yaAsignado ? (esTerminado ? '#f0fdf4' : '#fffbeb') : 'white'
                        }}>
                          <div>
                            <span style={{ fontWeight: '500', color: '#374151' }}>
                              {item.nombre_producto || `Producto #${item.producto_id}`}
                            </span>
                            <span style={{ color: '#6b7280', marginLeft: '12px', fontSize: '14px' }}>
                              Cantidad: {item.cantidad}
                            </span>
                            {item.snapshot_y > 0 && (
                              <span style={{ color: '#059669', marginLeft: '12px', fontSize: '13px' }}>
                                Sueldo: {formatMoney(item.snapshot_y * item.cantidad)}
                              </span>
                            )}
                            {item.empleados_catalogo && item.empleados_catalogo.length > 0 && (
                              <span style={{ color: '#7c3aed', marginLeft: '12px', fontSize: '12px' }}>
                                {item.empleados_catalogo.length} tarea(s) predefinida(s)
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {yaAsignado ? (
                              <>
                                <span style={{
                                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
                                  fontWeight: '700',
                                  backgroundColor: esTerminado ? '#d1fae5' : '#fef3c7',
                                  color: esTerminado ? '#065f46' : '#92400e',
                                  border: `1px solid ${esTerminado ? '#6ee7b7' : '#fcd34d'}`
                                }}>
                                  {getLabelEstado(estadoTrabajo)}
                                </span>
                                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                  🔒 Ya asignado
                                </span>
                              </>
                            ) : (
                              <button
                                onClick={() => abrirModalAsignar(pres, item, idx)}
                                style={{
                                  backgroundColor: '#1e3a8a', color: 'white',
                                  border: 'none', padding: '8px 16px',
                                  borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
                                }}
                              >
                                ➕ Asignar al Taller
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─── PESTAÑA SEGUIMIENTO ─── */}
          {pestana === 'seguimiento' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#1f2937', margin: 0 }}>Trabajos en curso</h3>
                <button onClick={cargarDatos} disabled={loading} style={{
                  backgroundColor: '#f3f4f6', border: '1px solid #d1d5db',
                  padding: '8px 16px', borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '13px', opacity: loading ? 0.6 : 1
                }}>{loading ? '⏳ Cargando...' : '🔄 Actualizar'}</button>
              </div>
              {trabajos.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  No hay trabajos asignados aún
                </div>
              ) : (
                trabajos.map(trabajo => {
                  const tareasCompletadas = trabajo.tareas.filter(t => t.completada).length;
                  const totalTareas = trabajo.tareas.length;
                  const progreso = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;
                  const esTerminado = trabajo.estado === 'entregado' || trabajo.estado === 'tarde';
                  return (
                    <div key={trabajo.id} style={{
                      border: `1px solid ${esTerminado ? '#6ee7b7' : '#e5e7eb'}`,
                      borderRadius: '8px', marginBottom: '16px', overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: esTerminado ? '#f0fdf4' : '#f8fafc',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div>
                          <strong style={{ color: '#1f2937' }}>{trabajo.producto_nombre}</strong>
                          <span style={{ marginLeft: '12px', fontSize: '13px', color: '#6b7280' }}>
                            Cantidad: {trabajo.cantidad}
                          </span>
                          {trabajo.fecha_entrega && (
                            <span style={{ marginLeft: '12px', fontSize: '13px', color: '#6b7280' }}>
                              📅 Entrega: {new Date(trabajo.fecha_entrega + 'T00:00:00').toLocaleDateString('es-AR')}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            backgroundColor: getColorEstado(trabajo.estado),
                            color: 'white', padding: '4px 10px',
                            borderRadius: '12px', fontSize: '12px', fontWeight: '600'
                          }}>
                            {getLabelEstado(trabajo.estado)}
                          </span>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>
                            {tareasCompletadas}/{totalTareas} tareas
                          </span>
                        </div>
                      </div>
                      {/* Barra de progreso */}
                      <div style={{ padding: '8px 16px', backgroundColor: '#f9fafb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
                          <span>Progreso</span>
                          <span>{progreso}%</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${progreso}%`,
                            backgroundColor: progreso === 100 ? '#10b981' : '#3b82f6',
                            borderRadius: '3px', transition: 'width 0.3s'
                          }} />
                        </div>
                      </div>
                      {/* Tareas */}
                      <div style={{ padding: '0 16px 12px' }}>
                        {trabajo.tareas.map(tarea => (
                          <div key={tarea.id} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '8px 0', borderBottom: '1px solid #f3f4f6'
                          }}>
                            <span style={{
                              width: '22px', height: '22px', borderRadius: '50%',
                              backgroundColor: tarea.completada ? '#10b981' : '#e5e7eb',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', color: 'white', flexShrink: 0, fontWeight: '700'
                            }}>
                              {tarea.completada ? '✓' : ''}
                            </span>
                            <div style={{ flex: 1 }}>
                              <span style={{
                                fontWeight: '500', color: tarea.completada ? '#6b7280' : '#1f2937',
                                textDecoration: tarea.completada ? 'line-through' : 'none'
                              }}>
                                {tarea.nombre_tarea}
                              </span>
                              <span style={{ marginLeft: '8px', fontSize: '13px', color: '#6b7280' }}>
                                → <strong>{tarea.empleado_nombre}</strong>
                              </span>
                              {tarea.compartida_con && (
                                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#7c3aed' }}>
                                  (con {tarea.compartida_con})
                                </span>
                              )}
                              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#9ca3af' }}>
                                {tarea.horas_estimadas}hs
                              </span>
                            </div>
                            {tarea.completada && tarea.fecha_completada && (
                              <span style={{ fontSize: '11px', color: '#10b981', whiteSpace: 'nowrap' }}>
                                ✅ {new Date(tarea.fecha_completada).toLocaleDateString('es-AR')}
                              </span>
                            )}
                            {!tarea.completada && (
                              <span style={{ fontSize: '11px', color: '#f59e0b', whiteSpace: 'nowrap' }}>
                                ⏳ Pendiente
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ─── PESTAÑA MÉTRICAS ─── */}
          {pestana === 'metricas' && (
            <div>
              {/* Barra de subvistas + acciones */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
                  {[['actual', '📊 Período Actual'], ['historico', '📅 Histórico'], ['anual', '📈 Acumulado Anual']].map(([key, label]) => (
                    <button key={key} onClick={() => setSubvistaMet(key)} style={{
                      padding: '7px 14px', borderRadius: '6px', border: 'none',
                      cursor: 'pointer', fontSize: '13px', fontWeight: subvistaMet === key ? '700' : '400',
                      backgroundColor: subvistaMet === key ? '#1e3a8a' : 'transparent',
                      color: subvistaMet === key ? 'white' : '#374151',
                      transition: 'all 0.15s'
                    }}>{label}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={cargarMetricas} disabled={loadingMetricas} style={{
                    backgroundColor: '#f3f4f6', border: '1px solid #d1d5db',
                    padding: '8px 14px', borderRadius: '6px',
                    cursor: loadingMetricas ? 'not-allowed' : 'pointer',
                    fontSize: '13px', opacity: loadingMetricas ? 0.6 : 1
                  }}>{loadingMetricas ? '⏳ Cargando...' : '🔄 Actualizar'}</button>
                  <a href="/api/taller/metricas/pdf" download style={{
                    backgroundColor: '#dc2626', color: 'white',
                    border: 'none', padding: '8px 14px', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '13px', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}>📄 PDF</a>
                </div>
              </div>

              {/* Leyenda de estados (siempre visible) */}
              <div style={{
                backgroundColor: '#f8fafc', border: '1px solid #e5e7eb',
                borderRadius: '8px', padding: '10px 16px', marginBottom: '16px',
                fontSize: '12px', color: '#374151'
              }}>
                <strong>Cómo leer el ratio:</strong>
                <span style={{ marginLeft: '12px' }}>
                  <span style={{ color: '#9ca3af' }}>⬜ Sin dato</span> = aún no se cargó el sueldo real
                  &nbsp;|&nbsp;
                  <span style={{ color: '#ef4444' }}>🔴 Rojo</span> = produjo menos de lo que cobró
                  &nbsp;|&nbsp;
                  <span style={{ color: '#f59e0b' }}>🟡 Amarillo</span> = produjo igual a lo que cobró
                  &nbsp;|&nbsp;
                  <span style={{ color: '#10b981' }}>🟢 Verde</span> = produjo más de lo que cobró
                  &nbsp;|&nbsp;
                  <span style={{ color: '#7c3aed' }}>🏆 Recompensa</span> = ratio ≥ 1.5x
                </span>
              </div>

              {/* SUBVISTA: PERÍODO ACTUAL */}
              {subvistaMet === 'actual' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {loadingMetricas ? (
                  <p style={{ color: '#6b7280' }}>Cargando métricas...</p>
                ) : metricas.length === 0 ? (
                  <p style={{ color: '#6b7280' }}>No hay métricas disponibles</p>
                ) : (
                  metricas.map(met => (
                    <div key={met.empleado_id} style={{
                      border: `2px solid ${getColorRatio(met.estado_color)}`,
                      borderRadius: '10px', padding: '16px', backgroundColor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: 0, color: '#1f2937', fontSize: '17px' }}>{met.empleado_nombre}</h4>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {met.tareas_completadas} tarea(s) completada(s)
                          </span>
                        </div>
                        <span style={{
                          backgroundColor: getColorRatio(met.estado_color),
                          color: 'white', padding: '4px 10px',
                          borderRadius: '12px', fontSize: '11px', fontWeight: '700'
                        }}>
                          {met.estado_color === 'recompensa' ? '🏆 RECOMPENSA' :
                           met.estado_color === 'verde' ? '✅ VERDE' :
                           met.estado_color === 'amarillo' ? '⚠️ AMARILLO' :
                           met.estado_color === 'rojo' ? '❌ ROJO' : '⬜ SIN SUELDO'}
                        </span>
                      </div>

                      {/* Barra de producción */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          <span>Producción vs Meta ($300.000)</span>
                          <span style={{ fontWeight: '700', color: getColorRatio(met.estado_color) }}>
                            {met.porcentaje_barra}%
                          </span>
                        </div>
                        <div style={{ height: '10px', backgroundColor: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, met.porcentaje_barra)}%`,
                            backgroundColor: getColorRatio(met.estado_color),
                            borderRadius: '5px', transition: 'width 0.5s'
                          }} />
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>Producido este período:</span>
                          <strong>{formatMoney(met.valor_producido)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>Sueldo real pagado:</span>
                          <strong style={{ color: met.sueldo_real_pagado ? '#374151' : '#9ca3af' }}>
                            {met.sueldo_real_pagado ? formatMoney(met.sueldo_real_pagado) : 'No cargado'}
                          </strong>
                        </div>
                        {met.ratio_produccion !== null && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Ratio producción/sueldo:</span>
                            <strong style={{ color: getColorRatio(met.estado_color) }}>
                              {met.ratio_produccion}x
                            </strong>
                          </div>
                        )}
                      </div>

                      {met.trabajos_entregados_tarde > 0 && (
                        <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px' }}>
                          ⚠️ {met.trabajos_entregados_tarde} trabajo(s) entregado(s) tarde
                        </div>
                      )}

                      {met.recompensa_ganada && (
                        <div style={{
                          backgroundColor: '#f5f3ff', border: '1px solid #7c3aed',
                          borderRadius: '6px', padding: '8px', textAlign: 'center',
                          fontSize: '13px', color: '#7c3aed', fontWeight: '600', marginBottom: '8px'
                        }}>
                          🏆 ¡Recompensa ganada! (1 jornada de 6hs)
                        </div>
                      )}

                      <button
                        onClick={() => { setModalSueldo({ empleado_id: met.empleado_id, nombre: met.empleado_nombre }); setSueldoReal(met.sueldo_real_pagado || ''); }}
                        style={{
                          width: '100%', marginTop: '4px',
                          backgroundColor: '#1e3a8a', color: 'white',
                          border: 'none', padding: '8px', borderRadius: '6px',
                          cursor: 'pointer', fontSize: '13px'
                        }}
                      >
                        💰 {met.sueldo_real_pagado ? 'Actualizar Sueldo' : 'Cargar Sueldo Real'}
                      </button>
                    </div>
                  ))
                )}
              </div>

              )} {/* fin subvista actual */}

              {/* SUBVISTA: HISTÓRICO DE PERÍODOS */}
              {subvistaMet === 'historico' && (
                <div>
                  {loadingMetricas ? (
                    <p style={{ color: '#6b7280' }}>Cargando histórico...</p>
                  ) : metricasHistorico.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', color: '#6b7280', fontSize: '14px' }}>
                      No hay períodos registrados aún.
                    </div>
                  ) : (
                    metricasHistorico.map(periodo => (
                      <div key={periodo.periodo_id} style={{ marginBottom: '28px' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          backgroundColor: '#1e3a8a', color: 'white',
                          padding: '10px 16px', borderRadius: '8px 8px 0 0'
                        }}>
                          <span style={{ fontWeight: '700', fontSize: '15px' }}>{periodo.periodo_nombre}</span>
                          <span style={{
                            backgroundColor: periodo.cerrado ? '#10b981' : '#f59e0b',
                            color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px'
                          }}>{periodo.cerrado ? 'CERRADO' : 'EN CURSO'}</span>
                          <span style={{ fontSize: '12px', opacity: 0.8, marginLeft: 'auto' }}>
                            {periodo.fecha_inicio} → {periodo.fecha_cierre}
                          </span>
                        </div>
                        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f3f4f6' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Empleado</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Producido</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Sueldo</th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Ratio</th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Tareas</th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Tarde</th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {periodo.metricas.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>Sin datos de empleados en este período</td></tr>
                              ) : (
                                periodo.metricas.map(met => {
                                  const colorEst = getColorRatio(met.estado_color);
                                  return (
                                    <tr key={met.empleado_id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: met.estado_color === 'recompensa' ? '#faf5ff' : met.estado_color === 'verde' ? '#f0fdf4' : met.estado_color === 'rojo' ? '#fef2f2' : met.estado_color === 'amarillo' ? '#fffbeb' : 'white' }}>
                                      <td style={{ padding: '8px 12px', fontWeight: '600' }}>{met.empleado_nombre}</td>
                                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatMoney(met.valor_producido)}</td>
                                      <td style={{ padding: '8px 12px', textAlign: 'right', color: met.sueldo_real_pagado ? '#374151' : '#9ca3af' }}>
                                        {met.sueldo_real_pagado ? formatMoney(met.sueldo_real_pagado) : 'No cargado'}
                                      </td>
                                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                        {met.ratio_produccion !== null ? (
                                          <span style={{ color: colorEst, fontWeight: '700' }}>{met.ratio_produccion}x</span>
                                        ) : <span style={{ color: '#9ca3af' }}>-</span>}
                                      </td>
                                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{met.tareas_completadas}</td>
                                      <td style={{ padding: '8px 12px', textAlign: 'center', color: met.trabajos_entregados_tarde > 0 ? '#ef4444' : '#374151' }}>
                                        {met.trabajos_entregados_tarde}
                                      </td>
                                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                        <span style={{ backgroundColor: colorEst, color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                                          {met.estado_color === 'recompensa' ? '🏆' : met.estado_color === 'verde' ? '✅' : met.estado_color === 'amarillo' ? '⚠️' : met.estado_color === 'rojo' ? '❌' : '⬜'}
                                          {' '}{met.estado_color === 'recompensa' ? 'RECOMPENSA' : met.estado_color === 'verde' ? 'VERDE' : met.estado_color === 'amarillo' ? 'AMARILLO' : met.estado_color === 'rojo' ? 'ROJO' : 'SIN SUELDO'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )} {/* fin subvista historico */}

              {/* SUBVISTA: ACUMULADO ANUAL */}
              {subvistaMet === 'anual' && (
              <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '24px' }}>
                <h3 style={{ color: '#1f2937', marginBottom: '16px' }}>
                  📈 Acumulado Anual {new Date().getFullYear()}
                </h3>
                {metricasAnuales.length === 0 ? (
                  <div style={{
                    padding: '24px', textAlign: 'center', backgroundColor: '#f9fafb',
                    borderRadius: '8px', color: '#6b7280', fontSize: '14px'
                  }}>
                    El acumulado anual se genera al cerrar cada período mensual.
                    Los datos del período actual se verán reflejados aquí una vez que se cierre.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Empleado</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Producido</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Sueldo Total</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Ratio Anual</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Tareas</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Recompensas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricasAnuales.map(anual => {
                          const ratioAnual = anual.ratio_anual;
                          const colorRatio = ratioAnual === null ? '#9ca3af' :
                            ratioAnual >= 1.5 ? '#7c3aed' :
                            ratioAnual > 1 ? '#10b981' :
                            ratioAnual === 1 ? '#f59e0b' : '#ef4444';
                          return (
                            <tr key={anual.empleado_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '10px 14px', fontWeight: '600' }}>{anual.empleado_nombre}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>{formatMoney(anual.valor_producido_total)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>{formatMoney(anual.sueldo_real_total)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                {ratioAnual !== null ? (
                                  <span style={{ color: colorRatio, fontWeight: '700' }}>{ratioAnual}x</span>
                                ) : (
                                  <span style={{ color: '#9ca3af' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>{anual.tareas_completadas_total}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                {anual.recompensas_ganadas > 0 ? (
                                  <span style={{ color: '#7c3aed' }}>🏆 {anual.recompensas_ganadas}</span>
                                ) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              )} {/* fin subvista anual */}

            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL ASIGNAR TRABAJO ─── */}
      {modalAsignar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 3000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            width: '90%', maxWidth: '700px', maxHeight: '90vh',
            overflow: 'auto', padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e3a8a' }}>
                  Asignar: {modalAsignar.item.nombre_producto || `Producto #${modalAsignar.item.producto_id}`}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                  Cantidad: {modalAsignar.item.cantidad} | Sueldo total: {formatMoney((modalAsignar.item.snapshot_y || 0) * (modalAsignar.item.cantidad || 1))}
                </p>
              </div>
              <button onClick={() => setModalAsignar(null)} style={{
                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280'
              }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                📅 Fecha de entrega
              </label>
              <input
                type="date"
                value={asignacion.fecha_entrega}
                onChange={e => setAsignacion(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  👷 Tareas y asignaciones
                </label>
                <button onClick={agregarTarea} style={{
                  backgroundColor: '#10b981', color: 'white',
                  border: 'none', padding: '6px 12px', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '12px'
                }}>+ Agregar tarea</button>
              </div>

              {asignacion.tareas.map((tarea, idx) => (
                <div key={tarea.id} style={{
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  padding: '12px', marginBottom: '10px', backgroundColor: '#f9fafb'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#7c3aed', marginBottom: '8px' }}>
                    Tarea {idx + 1}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '150px' }}>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Nombre de tarea</label>
                      <input
                        type="text"
                        value={tarea.nombre_tarea}
                        onChange={e => actualizarTarea(tarea.id, 'nombre_tarea', e.target.value)}
                        placeholder="ej: Corte, Armado, Pegado..."
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ flex: '1', minWidth: '150px' }}>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Empleado</label>
                      <select
                        value={tarea.empleado_id}
                        onChange={e => actualizarTarea(tarea.id, 'empleado_id', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                      >
                        <option value="">Seleccionar...</option>
                        {empleados.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '100px' }}>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Horas estimadas</label>
                      <input
                        type="number"
                        value={tarea.horas_estimadas}
                        onChange={e => actualizarTarea(tarea.id, 'horas_estimadas', e.target.value)}
                        min="0" step="0.01"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ flex: '1', minWidth: '120px' }}>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Valor sueldo ($)</label>
                      <input
                        type="number"
                        value={tarea.valor_sueldo_tarea}
                        onChange={e => actualizarTarea(tarea.id, 'valor_sueldo_tarea', e.target.value)}
                        min="0" step="0.01"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    {asignacion.tareas.length > 1 && (
                      <button onClick={() => eliminarTarea(tarea.id)} style={{
                        backgroundColor: '#fee2e2', color: '#ef4444',
                        border: 'none', padding: '6px 10px', borderRadius: '4px',
                        cursor: 'pointer', fontSize: '13px', alignSelf: 'flex-end'
                      }}>🗑</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen */}
            <div style={{
              backgroundColor: '#f0f9ff', border: '1px solid #bae6fd',
              borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px'
            }}>
              <strong style={{ color: '#0369a1' }}>Resumen:</strong>
              <span style={{ marginLeft: '8px', color: '#374151' }}>
                {asignacion.tareas.length} tarea(s) | Total horas: {asignacion.tareas.reduce((s, t) => s + (parseFloat(t.horas_estimadas) || 0), 0).toFixed(1)}hs |
                Total sueldo: {formatMoney(asignacion.tareas.reduce((s, t) => s + (parseFloat(t.valor_sueldo_tarea) || 0), 0))}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalAsignar(null)} style={{
                backgroundColor: '#f3f4f6', border: '1px solid #d1d5db',
                padding: '10px 20px', borderRadius: '6px', cursor: 'pointer'
              }}>Cancelar</button>
              <button onClick={guardarAsignacion} style={{
                backgroundColor: '#1e3a8a', color: 'white',
                border: 'none', padding: '10px 24px', borderRadius: '6px',
                cursor: 'pointer', fontWeight: '600'
              }}>✅ Guardar Asignación</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL SUELDO ─── */}
      {modalSueldo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 3000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            width: '90%', maxWidth: '400px', padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#1e3a8a' }}>
              💰 Sueldo real — {modalSueldo.nombre}
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
              Ingresá el monto total pagado a {modalSueldo.nombre} en este período.
              Esto permite calcular el ratio de producción.
            </p>
            <input
              type="number"
              value={sueldoReal}
              onChange={e => setSueldoReal(e.target.value)}
              placeholder="Ej: 350000"
              min="0"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalSueldo(null)} style={{
                backgroundColor: '#f3f4f6', border: '1px solid #d1d5db',
                padding: '10px 20px', borderRadius: '6px', cursor: 'pointer'
              }}>Cancelar</button>
              <button onClick={cargarSueldo} style={{
                backgroundColor: '#1e3a8a', color: 'white',
                border: 'none', padding: '10px 24px', borderRadius: '6px',
                cursor: 'pointer', fontWeight: '600'
              }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
