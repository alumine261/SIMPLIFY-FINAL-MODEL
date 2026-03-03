import { useState, useEffect } from 'react';

export default function TallerEmpleado({ empleadoId, empleadoNombre }) {
  const [tareas, setTareas] = useState([]);
  const [metrica, setMetrica] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');

  const META_SUELDO = 300000;

  useEffect(() => {
    if (empleadoId) cargarDatos();
  }, [empleadoId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resTareas, resMet] = await Promise.all([
        fetch(`/api/taller/empleado/${empleadoId}/tareas`),
        fetch(`/api/taller/metricas/empleado/${empleadoId}`)
      ]);
      const tareasData = await resTareas.json();
      setTareas(tareasData);
      const metData = await resMet.json();
      setMetrica(metData);
    } catch (e) {
      setMensaje('Error al cargar datos');
    }
    setLoading(false);
  };

  const completarTarea = async (tareaId) => {
    try {
      const res = await fetch(`/api/taller/tareas/${tareaId}/completar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setMensaje('✅ ¡Tarea marcada como completada!');
        cargarDatos();
        setTimeout(() => setMensaje(''), 3000);
      } else {
        const err = await res.json();
        setMensaje('Error: ' + (err.error || 'desconocido'));
      }
    } catch (e) {
      setMensaje('Error de conexión');
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

  const porcentajeBarra = metrica ? Math.min(150, metrica.porcentaje_barra) : 0;
  const colorBarra = porcentajeBarra >= 150 ? '#7c3aed' :
                     porcentajeBarra >= 100 ? '#10b981' :
                     porcentajeBarra >= 50 ? '#f59e0b' : '#ef4444';

  const tareasPendientes = tareas.filter(t => !t.completada);
  const tareasCompletadas = tareas.filter(t => t.completada);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p>Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>

      {/* Header personal */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
        color: 'white', borderRadius: '12px', padding: '24px',
        marginBottom: '20px', textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>👷</div>
        <h2 style={{ margin: 0, fontSize: '24px' }}>{empleadoNombre}</h2>
        <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '14px' }}>Taller Simplify.cnc</p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          backgroundColor: mensaje.includes('✅') ? '#d1fae5' : '#fee2e2',
          color: mensaje.includes('✅') ? '#065f46' : '#991b1b',
          fontSize: '14px', textAlign: 'center'
        }}>
          {mensaje}
        </div>
      )}

      {/* Barra de producción */}
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
        padding: '20px', marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#1f2937', fontSize: '16px' }}>🎯 Tu producción del período</h3>
          <span style={{
            fontSize: '22px', fontWeight: '800', color: colorBarra
          }}>
            {porcentajeBarra}%
          </span>
        </div>

        {/* Barra principal */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <div style={{
            height: '20px', backgroundColor: '#e5e7eb',
            borderRadius: '10px', overflow: 'hidden', position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, porcentajeBarra)}%`,
              background: `linear-gradient(90deg, ${colorBarra}, ${colorBarra}cc)`,
              borderRadius: '10px',
              transition: 'width 0.8s ease',
              position: 'relative'
            }}>
              {porcentajeBarra >= 10 && (
                <span style={{
                  position: 'absolute', right: '8px', top: '50%',
                  transform: 'translateY(-50%)', color: 'white',
                  fontSize: '11px', fontWeight: '700'
                }}>
                  {porcentajeBarra}%
                </span>
              )}
            </div>
          </div>
          {/* Marca del 100% */}
          <div style={{
            position: 'absolute', left: '66.67%', top: '-4px',
            width: '2px', height: '28px', backgroundColor: '#6b7280'
          }} />
          {/* Marca del 150% (meta recompensa) */}
          <div style={{
            position: 'absolute', right: '0', top: '-4px',
            width: '2px', height: '28px', backgroundColor: '#7c3aed'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '12px' }}>
          <span>0%</span>
          <span style={{ color: '#6b7280' }}>100% (meta)</span>
          <span style={{ color: '#7c3aed' }}>150% (🏆 recompensa)</span>
        </div>

        {/* Estado actual */}
        <div style={{
          backgroundColor: colorBarra + '15',
          border: `1px solid ${colorBarra}40`,
          borderRadius: '8px', padding: '10px 14px',
          textAlign: 'center'
        }}>
          {porcentajeBarra >= 150 ? (
            <span style={{ color: '#7c3aed', fontWeight: '700', fontSize: '15px' }}>
              🏆 ¡Felicitaciones! ¡Ganaste una jornada de recompensa!
            </span>
          ) : porcentajeBarra >= 100 ? (
            <span style={{ color: '#10b981', fontWeight: '600', fontSize: '14px' }}>
              ✅ ¡Excelente! Superaste tu meta. ¡Seguí así!
            </span>
          ) : porcentajeBarra >= 50 ? (
            <span style={{ color: '#f59e0b', fontWeight: '600', fontSize: '14px' }}>
              ⚡ Vas bien, seguí sumando para llegar a la meta
            </span>
          ) : (
            <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '14px' }}>
              💪 ¡Arrancá fuerte! Cada tarea completada suma
            </span>
          )}
        </div>

        {metrica && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
              <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '16px' }}>
                {metrica.tareas_completadas}
              </div>
              <div>tareas completadas</div>
            </div>
            <div style={{ width: '1px', backgroundColor: '#e5e7eb' }} />
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
              <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '16px' }}>
                {metrica.trabajos_entregados_tarde > 0 ? (
                  <span style={{ color: '#ef4444' }}>{metrica.trabajos_entregados_tarde}</span>
                ) : '0'}
              </div>
              <div>entregas tarde</div>
            </div>
            {metrica.trabajos_entregados_tarde >= 5 && (
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#ef4444' }}>
                ⚠️ 5+ entregas tarde = sin recompensa este período
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tareas pendientes */}
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
        padding: '20px', marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '16px' }}>
          📋 Tareas pendientes ({tareasPendientes.length})
        </h3>

        {tareasPendientes.length === 0 ? (
          <div style={{
            padding: '30px', textAlign: 'center', color: '#6b7280',
            backgroundColor: '#f9fafb', borderRadius: '8px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
            <p style={{ margin: 0 }}>¡No tenés tareas pendientes!</p>
          </div>
        ) : (
          tareasPendientes.map(tarea => {
            const hoy = new Date();
            const fechaEntrega = tarea.fecha_entrega ? new Date(tarea.fecha_entrega + 'T00:00:00') : null;
            const diasRestantes = fechaEntrega ? Math.ceil((fechaEntrega - hoy) / (1000 * 60 * 60 * 24)) : null;
            const urgente = diasRestantes !== null && diasRestantes <= 2;

            return (
              <div key={tarea.id} style={{
                border: `2px solid ${urgente ? '#ef4444' : '#e5e7eb'}`,
                borderRadius: '10px', padding: '16px', marginBottom: '12px',
                backgroundColor: urgente ? '#fff5f5' : 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', color: '#1f2937', fontSize: '15px' }}>
                      {tarea.nombre_tarea}
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                      📦 {tarea.trabajo_nombre} — Cantidad: {tarea.cantidad}
                    </p>
                  </div>
                  <span style={{
                    backgroundColor: getColorEstado(tarea.estado_trabajo),
                    color: 'white', padding: '4px 10px',
                    borderRadius: '12px', fontSize: '11px', fontWeight: '600'
                  }}>
                    {tarea.estado_trabajo?.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '13px', color: '#374151' }}>
                    ⏱ <strong>{tarea.horas_estimadas}hs</strong> estimadas
                  </div>
                  {fechaEntrega && (
                    <div style={{ fontSize: '13px', color: urgente ? '#ef4444' : '#374151', fontWeight: urgente ? '700' : '400' }}>
                      📅 Entrega: {fechaEntrega.toLocaleDateString('es-AR')}
                      {diasRestantes !== null && (
                        <span style={{ marginLeft: '6px' }}>
                          ({diasRestantes > 0 ? `${diasRestantes} día(s)` : diasRestantes === 0 ? '¡HOY!' : '¡VENCIDA!'})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {tarea.compartida_con && (
                  <div style={{
                    backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe',
                    borderRadius: '6px', padding: '8px 12px', marginBottom: '12px',
                    fontSize: '13px', color: '#7c3aed'
                  }}>
                    👥 Trabajo compartido con: <strong>{tarea.compartida_con}</strong>
                  </div>
                )}

                <button
                  onClick={() => completarTarea(tarea.id)}
                  style={{
                    width: '100%', backgroundColor: '#1e3a8a', color: 'white',
                    border: 'none', padding: '12px', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.backgroundColor = '#1e40af'}
                  onMouseLeave={e => e.target.style.backgroundColor = '#1e3a8a'}
                >
                  ✅ Marcar como entregada
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Tareas completadas */}
      {tareasCompletadas.length > 0 && (
        <div style={{
          backgroundColor: 'white', borderRadius: '12px',
          padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '16px' }}>
            ✅ Completadas este período ({tareasCompletadas.length})
          </h3>
          {tareasCompletadas.map(tarea => (
            <div key={tarea.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 0', borderBottom: '1px solid #f3f4f6'
            }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                backgroundColor: '#10b981', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '14px', flexShrink: 0
              }}>✓</div>
              <div style={{ flex: 1 }}>
                <span style={{ color: '#6b7280', textDecoration: 'line-through', fontSize: '14px' }}>
                  {tarea.nombre_tarea}
                </span>
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#9ca3af' }}>
                  — {tarea.trabajo_nombre}
                </span>
              </div>
              {tarea.fecha_completada && (
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {new Date(tarea.fecha_completada).toLocaleDateString('es-AR')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botón actualizar */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={cargarDatos} style={{
          backgroundColor: '#f3f4f6', border: '1px solid #d1d5db',
          padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
          fontSize: '14px', color: '#374151'
        }}>🔄 Actualizar</button>
      </div>
    </div>
  );
}
