import React, { useState, useEffect, useCallback } from 'react';

const API = '';

const fmt = (n) =>
  typeof n === 'number'
    ? n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0,00';

const fmtPct = (n) => (typeof n === 'number' ? n.toFixed(1) + '%' : '0,0%');

const colorSaldo = (v) => {
  if (v > 0) return '#16a34a';   // verde
  if (v < 0) return '#dc2626';   // rojo
  return '#6b7280';              // gris
};

const signo = (v) => (v > 0 ? '+' : '');

// ── Tarjeta grande destacada ──────────────────────────────────────────────────
const TarjetaDestacada = ({ titulo, valor, color, subtitulo }) => (
  <div style={{
    background: color,
    borderRadius: 12,
    padding: '24px 28px',
    color: '#fff',
    flex: 1,
    minWidth: 220,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
  }}>
    <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
      {titulo}
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>
      $ {fmt(valor)}
    </div>
    {subtitulo && (
      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>{subtitulo}</div>
    )}
  </div>
);

// ── Fila de componente ────────────────────────────────────────────────────────
const FilaComponente = ({ etiqueta, valor, color }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid #f1f5f9'
  }}>
    <span style={{ fontSize: 14, color: '#374151' }}>{etiqueta}</span>
    <span style={{ fontSize: 14, fontWeight: 700, color: color || '#1e3a8a' }}>
      $ {fmt(valor)}
    </span>
  </div>
);

// ── Fila de comparación K o J ─────────────────────────────────────────────────
const FilaComparacion = ({ etiqueta, presupuestado, real, diferencia, nombre }) => (
  <div style={{
    background: '#f8fafc',
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 10,
    border: '1px solid #e2e8f0'
  }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 8 }}>{etiqueta}</div>
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Presupuestado</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>$ {fmt(presupuestado)}</div>
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Real pagado</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>$ {fmt(real)}</div>
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{nombre}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: colorSaldo(diferencia) }}>
          {signo(diferencia)}$ {fmt(diferencia)}
        </div>
      </div>
    </div>
  </div>
);

// ── Tarjeta contador ──────────────────────────────────────────────────────────
const TarjetaContador = ({ titulo, valor, subtitulo, color }) => (
  <div style={{
    background: '#fff',
    border: `2px solid ${color || '#e2e8f0'}`,
    borderRadius: 10,
    padding: '14px 18px',
    flex: 1,
    minWidth: 120,
    textAlign: 'center'
  }}>
    <div style={{ fontSize: 28, fontWeight: 800, color: color || '#1e3a8a' }}>{valor}</div>
    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{titulo}</div>
    {subtitulo && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{subtitulo}</div>}
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
export default function KPIDashboard({ onClose }) {
  const [vista, setVista] = useState('mensual'); // 'mensual' | 'anual' | 'historico'
  const [periodo, setPeriodo] = useState(null);
  const [periodosHistorico, setPeriodosHistorico] = useState([]);
  const [resumenesAnuales, setResumenesAnuales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalSueldo, setModalSueldo] = useState(false);
  const [sueldoInput, setSueldoInput] = useState('');
  const [guardandoSueldo, setGuardandoSueldo] = useState(false);
  const [confirmCerrar, setConfirmCerrar] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [rPeriodo, rHistorico, rAnuales] = await Promise.all([
        fetch(`${API}/api/kpi/periodo-actual`),
        fetch(`${API}/api/kpi/periodos`),
        fetch(`${API}/api/kpi/anual`)
      ]);
      const [dPeriodo, dHistorico, dAnuales] = await Promise.all([
        rPeriodo.json(), rHistorico.json(), rAnuales.json()
      ]);
      setPeriodo(dPeriodo);
      setPeriodosHistorico(dHistorico);
      setResumenesAnuales(dAnuales);
    } catch (e) {
      setError('Error al cargar datos de KPI');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const guardarSueldoReal = async () => {
    if (!periodo) return;
    setGuardandoSueldo(true);
    try {
      const r = await fetch(`${API}/api/kpi/periodo/${periodo.id}/sueldo-real`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: parseFloat(sueldoInput) || 0 })
      });
      const d = await r.json();
      if (d.ok) {
        setPeriodo(d.periodo);
        setModalSueldo(false);
        setSueldoInput('');
      }
    } catch (e) {
      alert('Error al guardar sueldo');
    } finally {
      setGuardandoSueldo(false);
    }
  };

  const cerrarPeriodo = async () => {
    if (!periodo) return;
    setCerrando(true);
    try {
      const r = await fetch(`${API}/api/kpi/periodo/${periodo.id}/cerrar`, { method: 'POST' });
      const d = await r.json();
      if (d.ok) {
        await cargarDatos();
        setConfirmCerrar(false);
      } else {
        alert(d.error || 'Error al cerrar período');
      }
    } catch (e) {
      alert('Error al cerrar período');
    } finally {
      setCerrando(false);
    }
  };

  const generarPDF = async (tipo, id) => {
    setGenerandoPDF(true);
    try {
      const url = tipo === 'mensual'
        ? `${API}/api/kpi/periodo/${id}/pdf`
        : `${API}/api/kpi/anual/${id}/pdf`;
      const r = await fetch(url);
      if (r.ok) {
        const blob = await r.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = tipo === 'mensual' ? `kpi_mensual_${id}.pdf` : `kpi_anual_${id}.pdf`;
        link.click();
      } else {
        alert('Error al generar PDF');
      }
    } catch (e) {
      alert('Error al generar PDF');
    } finally {
      setGenerandoPDF(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      overflowY: 'auto', padding: '20px 16px'
    }}>
      <div style={{
        background: '#f8fafc', borderRadius: 16, width: '100%', maxWidth: 900,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
          padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 800 }}>📊 KPIs de Gestión</div>
            <div style={{ color: '#93c5fd', fontSize: 13, marginTop: 2 }}>
              Indicadores clave de rendimiento empresarial
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 600
          }}>✕ Cerrar</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', background: '#fff' }}>
          {[
            { id: 'mensual', label: '📅 Período Actual' },
            { id: 'historico', label: '📋 Histórico' },
            { id: 'anual', label: '📆 Anual' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setVista(tab.id)} style={{
              padding: '14px 22px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: vista === tab.id ? '#fff' : '#f8fafc',
              color: vista === tab.id ? '#1e3a8a' : '#6b7280',
              borderBottom: vista === tab.id ? '3px solid #1e3a8a' : '3px solid transparent',
              transition: 'all 0.2s'
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ padding: '24px 28px' }}>
          {cargando && (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              Cargando datos...
            </div>
          )}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 16, color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* ── VISTA MENSUAL ── */}
          {!cargando && !error && vista === 'mensual' && periodo && (
            <div>
              {/* Título del período */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a' }}>
                    Período: {periodo.nombre}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                    {periodo.fecha_inicio} → {periodo.fecha_cierre}
                    {periodo.cerrado && <span style={{ marginLeft: 8, background: '#dcfce7', color: '#16a34a', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>CERRADO</span>}
                  </div>
                </div>
                {!periodo.cerrado && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => { setSueldoInput(periodo.sueldo_real_pagado || ''); setModalSueldo(true); }} style={{
                      background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8,
                      padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600
                    }}>💰 Cargar Sueldo Real</button>
                    <button onClick={() => setConfirmCerrar(true)} style={{
                      background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8,
                      padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600
                    }}>🔒 Cerrar Período</button>
                  </div>
                )}
                {periodo.cerrado && (
                  <button onClick={() => generarPDF('mensual', periodo.id)} disabled={generandoPDF} style={{
                    background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 8,
                    padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600
                  }}>📄 {generandoPDF ? 'Generando...' : 'Descargar PDF'}</button>
                )}
              </div>

              {/* Tarjetas destacadas */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <TarjetaDestacada
                  titulo="Total Vendido"
                  valor={periodo.total_vendido}
                  color="linear-gradient(135deg, #1e3a8a, #1d4ed8)"
                  subtitulo={`${periodo.cantidad_presupuestos_aprobados} presupuesto(s) aprobado(s)`}
                />
                <TarjetaDestacada
                  titulo="Ganancia Real"
                  valor={periodo.ganancia_real}
                  color={periodo.ganancia_real >= 0
                    ? 'linear-gradient(135deg, #16a34a, #15803d)'
                    : 'linear-gradient(135deg, #dc2626, #b91c1c)'}
                  subtitulo="G + K + J"
                />
              </div>

              {/* Desglose de componentes */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: '#f1f5f9', fontWeight: 700, fontSize: 14, color: '#1e3a8a', borderBottom: '1px solid #e2e8f0' }}>
                  Desglose del Total Vendido
                </div>
                <FilaComponente etiqueta="X — Materiales" valor={periodo.total_materiales} />
                <FilaComponente etiqueta="Y — Sueldos (presupuestados)" valor={periodo.total_sueldos_presupuestados} />
                <FilaComponente etiqueta="Z — Reposición de máquinas" valor={periodo.total_maquinas} />
                <FilaComponente etiqueta="T — Costos indirectos (presupuestados)" valor={periodo.total_costos_indirectos_presupuestados} />
                <FilaComponente etiqueta="G — Ganancia presupuestada" valor={periodo.total_ganancia_presupuestada} color="#16a34a" />
              </div>

              {/* Comparaciones K y J */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a8a', marginBottom: 12 }}>
                  Comparaciones Reales vs. Presupuestadas
                </div>
                <FilaComparacion
                  etiqueta="Sueldos"
                  presupuestado={periodo.total_sueldos_presupuestados}
                  real={periodo.sueldo_real_pagado}
                  diferencia={periodo.K}
                  nombre="K (diferencia)"
                />
                <FilaComparacion
                  etiqueta="Costos Indirectos"
                  presupuestado={periodo.total_costos_indirectos_presupuestados}
                  real={periodo.costos_indirectos_reales}
                  diferencia={periodo.J}
                  nombre="J (diferencia)"
                />
              </div>

              {/* Fórmula Ganancia Real */}
              <div style={{
                background: '#fff', borderRadius: 12, border: '2px solid #1e3a8a',
                padding: '16px 20px', marginBottom: 20
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 10 }}>
                  Cálculo de Ganancia Real
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 15 }}>
                  <span style={{ color: '#374151' }}>G = <strong>$ {fmt(periodo.total_ganancia_presupuestada)}</strong></span>
                  <span style={{ color: '#6b7280' }}>+</span>
                  <span style={{ color: colorSaldo(periodo.K) }}>K = <strong>{signo(periodo.K)}$ {fmt(periodo.K)}</strong></span>
                  <span style={{ color: '#6b7280' }}>+</span>
                  <span style={{ color: colorSaldo(periodo.J) }}>J = <strong>{signo(periodo.J)}$ {fmt(periodo.J)}</strong></span>
                  <span style={{ color: '#6b7280' }}>=</span>
                  <span style={{
                    fontSize: 18, fontWeight: 800,
                    color: colorSaldo(periodo.ganancia_real)
                  }}>
                    {signo(periodo.ganancia_real)}$ {fmt(periodo.ganancia_real)}
                  </span>
                </div>
              </div>

              {/* Contadores */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <TarjetaContador titulo="Presupuestos generados" valor={periodo.cantidad_presupuestos_generados} color="#1e3a8a" />
                <TarjetaContador titulo="Aprobados" valor={periodo.cantidad_presupuestos_aprobados} color="#16a34a" />
                <TarjetaContador titulo="Rechazados" valor={periodo.cantidad_presupuestos_rechazados} color="#dc2626" />
                <TarjetaContador titulo="Tasa de conversión" valor={fmtPct(periodo.tasa_conversion)} color="#f59e0b" />
                <TarjetaContador titulo="Ticket promedio" valor={`$ ${fmt(periodo.ticket_promedio)}`} color="#7c3aed" />
              </div>
            </div>
          )}

          {/* ── VISTA HISTÓRICO ── */}
          {!cargando && !error && vista === 'historico' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a', marginBottom: 16 }}>
                Períodos Mensuales Cerrados
              </div>
              {periodosHistorico.filter(p => p.cerrado).length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  No hay períodos cerrados aún.
                </div>
              )}
              {periodosHistorico.filter(p => p.cerrado).map(p => (
                <div key={p.id} style={{
                  background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
                  padding: '16px 20px', marginBottom: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a8a' }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{p.fecha_inicio} → {p.fecha_cierre}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Total vendido</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a' }}>$ {fmt(p.total_vendido)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Ganancia real</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: colorSaldo(p.ganancia_real) }}>
                          {signo(p.ganancia_real)}$ {fmt(p.ganancia_real)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Conversión</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{fmtPct(p.tasa_conversion)}</div>
                      </div>
                      <button onClick={() => generarPDF('mensual', p.id)} disabled={generandoPDF} style={{
                        background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 8,
                        padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, alignSelf: 'center'
                      }}>📄 PDF</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── VISTA ANUAL ── */}
          {!cargando && !error && vista === 'anual' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a', marginBottom: 16 }}>
                Resúmenes Anuales
              </div>
              {resumenesAnuales.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  No hay resúmenes anuales aún. Se generan al cerrar períodos mensuales.
                </div>
              )}
              {resumenesAnuales.map(r => (
                <div key={r.id} style={{
                  background: '#fff', borderRadius: 12, border: '2px solid #1e3a8a',
                  padding: '20px 24px', marginBottom: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a' }}>Año {r.anio}</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {!r.cerrado && (
                        <button onClick={async () => {
                          if (window.confirm(`¿Cerrar el resumen del año ${r.anio}?`)) {
                            await fetch(`${API}/api/kpi/anual/${r.anio}/cerrar`, { method: 'POST' });
                            cargarDatos();
                          }
                        }} style={{
                          background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8,
                          padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600
                        }}>🔒 Cerrar Año</button>
                      )}
                      <button onClick={() => generarPDF('anual', r.anio)} disabled={generandoPDF} style={{
                        background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 8,
                        padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600
                      }}>📄 PDF Anual</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                    <TarjetaDestacada titulo="Total vendido anual" valor={r.total_vendido} color="linear-gradient(135deg, #1e3a8a, #1d4ed8)" />
                    <TarjetaDestacada titulo="Ganancia real anual" valor={r.ganancia_real}
                      color={r.ganancia_real >= 0 ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #dc2626, #b91c1c)'} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <TarjetaContador titulo="Presupuestos" valor={r.cantidad_presupuestos_generados} color="#1e3a8a" />
                    <TarjetaContador titulo="Aprobados" valor={r.cantidad_presupuestos_aprobados} color="#16a34a" />
                    <TarjetaContador titulo="Conversión" valor={fmtPct(r.tasa_conversion)} color="#f59e0b" />
                    <TarjetaContador titulo="Ticket promedio" valor={`$ ${fmt(r.ticket_promedio)}`} color="#7c3aed" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal cargar sueldo real */}
      {modalSueldo && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1e3a8a', marginBottom: 16 }}>
              💰 Cargar Sueldo Real Pagado
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Ingresá el total de sueldos realmente pagados en el período {periodo?.nombre}.
            </div>
            <input
              type="number"
              value={sueldoInput}
              onChange={e => setSueldoInput(e.target.value)}
              placeholder="Monto en $"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '2px solid #e2e8f0', fontSize: 16, boxSizing: 'border-box', marginBottom: 16
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalSueldo(false)} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', cursor: 'pointer', fontSize: 14
              }}>Cancelar</button>
              <button onClick={guardarSueldoReal} disabled={guardandoSueldo} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                background: '#1e3a8a', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700
              }}>{guardandoSueldo ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar cierre de período */}
      {confirmCerrar && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>
              🔒 Cerrar Período
            </div>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: 20 }}>
              Al cerrar el período <strong>{periodo?.nombre}</strong> los datos se acumularán al resumen anual y no podrán modificarse. ¿Confirmar?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmCerrar(false)} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', cursor: 'pointer', fontSize: 14
              }}>Cancelar</button>
              <button onClick={cerrarPeriodo} disabled={cerrando} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700
              }}>{cerrando ? 'Cerrando...' : 'Confirmar Cierre'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
