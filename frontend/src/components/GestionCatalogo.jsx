import React, { useState, useEffect } from 'react';

const GestionCatalogo = ({ onClose }) => {
  const [productos, setProductos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    precio: '',
    costo: ''
  });

  // Modal de tareas
  const [modalTareas, setModalTareas] = useState(null); // { producto, tareas: [{indice, empleado_slot, horas, nombre_tarea}] }
  const [guardandoTareas, setGuardandoTareas] = useState(false);
  const [mensajeTareas, setMensajeTareas] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await fetch('/api/catalogo');
      const data = await response.json();
      if (data.success) {
        setProductos(data.productos);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editando ? `/api/catalogo/${editando.id}` : '/api/catalogo';
      const method = editando ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          precio: parseFloat(formData.precio),
          costo: parseFloat(formData.costo || 0)
        })
      });

      const data = await response.json();
      if (data.success) {
        cargarProductos();
        setMostrarForm(false);
        setEditando(null);
        setFormData({ nombre: '', descripcion: '', categoria: '', precio: '', costo: '' });
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
    }
  };

  const eliminarProducto = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const response = await fetch(`/api/catalogo/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        cargarProductos();
      }
    } catch (error) {
      console.error('Error eliminando producto:', error);
    }
  };

  const editarProducto = (producto) => {
    setEditando(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria: producto.categoria || '',
      precio: producto.precio.toString(),
      costo: producto.costo ? producto.costo.toString() : ''
    });
    setMostrarForm(true);
  };

  // Abrir modal de tareas para un producto
  const abrirModalTareas = async (producto) => {
    setMensajeTareas('');
    try {
      const res = await fetch(`/api/taller/catalogo/${producto.id}/tareas`);
      const data = await res.json();
      if (data.tareas) {
        setModalTareas({ producto, tareas: data.tareas });
      } else {
        // Producto sin datos_calculo - no tiene empleados asignados
        setModalTareas({ producto, tareas: [] });
      }
    } catch (e) {
      console.error('Error cargando tareas:', e);
    }
  };

  const actualizarNombreTarea = (indice, valor) => {
    setModalTareas(prev => ({
      ...prev,
      tareas: prev.tareas.map(t => t.indice === indice ? { ...t, nombre_tarea: valor } : t)
    }));
  };

  const guardarTareas = async () => {
    if (!modalTareas) return;
    setGuardandoTareas(true);
    try {
      const nombres = modalTareas.tareas.map(t => t.nombre_tarea);
      const res = await fetch(`/api/taller/catalogo/${modalTareas.producto.id}/tareas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombres_tareas: nombres })
      });
      const data = await res.json();
      if (data.mensaje) {
        setMensajeTareas('✅ Nombres de tareas guardados');
        setTimeout(() => {
          setModalTareas(null);
          setMensajeTareas('');
        }, 1200);
      } else {
        setMensajeTareas('Error: ' + (data.error || 'desconocido'));
      }
    } catch (e) {
      setMensajeTareas('Error de conexión');
    }
    setGuardandoTareas(false);
  };

  // Obtener cantidad de empleados de un producto
  const getEmpleadosCount = (producto) => {
    if (!producto.datos_calculo) return 0;
    try {
      const dc = typeof producto.datos_calculo === 'string'
        ? JSON.parse(producto.datos_calculo)
        : producto.datos_calculo;
      return (dc.empleados || []).length;
    } catch {
      return 0;
    }
  };

  // Verificar si un producto tiene tareas definidas
  const tieneTareasDefinidas = (producto) => {
    if (!producto.datos_calculo) return false;
    try {
      const dc = typeof producto.datos_calculo === 'string'
        ? JSON.parse(producto.datos_calculo)
        : producto.datos_calculo;
      const emps = dc.empleados || [];
      return emps.length > 0 && emps.every(e => e.nombre_tarea && e.nombre_tarea.trim());
    } catch {
      return false;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '1100px',
        width: '90%',
        maxHeight: '85vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>📦 Catálogo de Productos</h2>
          <button onClick={onClose} style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            ✕ Cerrar
          </button>
        </div>

        {!mostrarForm ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => setMostrarForm(true)} style={{
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                ➕ Nuevo Producto
              </button>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                💡 Usá <strong>Definir Tareas</strong> para nombrar las tareas de cada empleado (ej: Corte, Armado, Pegado)
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Nombre</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Categoría</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Costo</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Precio</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Margen</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Tareas Taller</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                      No hay productos en el catálogo
                    </td>
                  </tr>
                ) : (
                  productos.map(producto => {
                    const margen = producto.costo ? ((producto.precio - producto.costo) / producto.costo * 100).toFixed(1) : '-';
                    const numEmpleados = getEmpleadosCount(producto);
                    const tareasOk = tieneTareasDefinidas(producto);
                    return (
                      <tr key={producto.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold' }}>{producto.nombre}</div>
                          {producto.descripcion && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{producto.descripcion}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>{producto.categoria || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          ${producto.costo ? producto.costo.toLocaleString() : '-'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                          ${producto.precio.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: margen !== '-' && parseFloat(margen) > 0 ? '#16a34a' : '#6b7280' }}>
                          {margen !== '-' ? `${margen}%` : '-'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {numEmpleados === 0 ? (
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Sin empleados</span>
                          ) : (
                            <div>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: tareasOk ? '#d1fae5' : '#fef3c7',
                                color: tareasOk ? '#065f46' : '#92400e',
                                marginBottom: '4px'
                              }}>
                                {tareasOk ? '✅ Definidas' : `⚠️ ${numEmpleados} sin nombre`}
                              </span>
                              <br />
                              <button
                                onClick={() => abrirModalTareas(producto)}
                                style={{
                                  backgroundColor: '#7c3aed',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px'
                                }}
                              >
                                ✏️ Definir Tareas
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button onClick={() => editarProducto(producto)} style={{
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '5px'
                          }}>
                            ✏️ Editar
                          </button>
                          <button onClick={() => eliminarProducto(producto.id)} style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginTop: 0 }}>{editando ? 'Editar Producto' : 'Nuevo Producto'}</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Categoría</label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ej: Láser, Impresión 3D"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Costo</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costo}
                  onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  required
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                💾 Guardar
              </button>
              <button type="button" onClick={() => {
                setMostrarForm(false);
                setEditando(null);
                setFormData({ nombre: '', descripcion: '', categoria: '', precio: '', costo: '' });
              }} style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── MODAL DEFINIR TAREAS ─── */}
      {modalTareas && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            width: '90%', maxWidth: '560px', padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#7c3aed' }}>✏️ Definir Tareas del Taller</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                  Producto: <strong>{modalTareas.producto.nombre}</strong>
                </p>
              </div>
              <button onClick={() => setModalTareas(null)} style={{
                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280'
              }}>✕</button>
            </div>

            {modalTareas.tareas.length === 0 ? (
              <div style={{
                padding: '24px', textAlign: 'center', backgroundColor: '#f9fafb',
                borderRadius: '8px', color: '#6b7280', fontSize: '14px'
              }}>
                <p style={{ margin: '0 0 8px' }}>Este producto no tiene empleados asignados en la calculadora.</p>
                <p style={{ margin: 0, fontSize: '12px' }}>
                  Para definir tareas, primero calculá el producto con empleados en la calculadora de costos.
                </p>
              </div>
            ) : (
              <>
                <div style={{
                  backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe',
                  borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#5b21b6'
                }}>
                  Asigná un nombre descriptivo a cada tarea (ej: Corte, Armado, Pegado, Lijado, Pintura...).
                  Estos nombres aparecerán pre-cargados al asignar el trabajo al taller.
                </div>

                {modalTareas.tareas.map((tarea) => (
                  <div key={tarea.indice} style={{
                    border: '1px solid #e5e7eb', borderRadius: '8px',
                    padding: '12px', marginBottom: '10px', backgroundColor: '#fafafa'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        backgroundColor: '#7c3aed', color: 'white',
                        borderRadius: '50%', width: '28px', height: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700', flexShrink: 0
                      }}>
                        {tarea.indice + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                          {tarea.empleado_slot} — {tarea.horas}hs
                        </div>
                        <input
                          type="text"
                          value={tarea.nombre_tarea}
                          onChange={e => actualizarNombreTarea(tarea.indice, e.target.value)}
                          placeholder="ej: Corte, Armado, Pegado..."
                          style={{
                            width: '100%', padding: '7px 10px',
                            border: '1px solid #d1d5db', borderRadius: '4px',
                            fontSize: '14px', boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {mensajeTareas && (
              <div style={{
                padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px',
                backgroundColor: mensajeTareas.includes('✅') ? '#d1fae5' : '#fee2e2',
                color: mensajeTareas.includes('✅') ? '#065f46' : '#991b1b'
              }}>
                {mensajeTareas}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalTareas(null)} style={{
                backgroundColor: '#f3f4f6', border: '1px solid #d1d5db',
                padding: '10px 20px', borderRadius: '6px', cursor: 'pointer'
              }}>Cancelar</button>
              {modalTareas.tareas.length > 0 && (
                <button
                  onClick={guardarTareas}
                  disabled={guardandoTareas}
                  style={{
                    backgroundColor: '#7c3aed', color: 'white',
                    border: 'none', padding: '10px 24px', borderRadius: '6px',
                    cursor: guardandoTareas ? 'not-allowed' : 'pointer',
                    fontWeight: '600', opacity: guardandoTareas ? 0.7 : 1
                  }}
                >
                  {guardandoTareas ? 'Guardando...' : '💾 Guardar Tareas'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCatalogo;
