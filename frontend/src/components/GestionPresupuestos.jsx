import React, { useState, useEffect } from 'react';

const GestionPresupuestos = ({ onClose }) => {
  const [presupuestos, setPresupuestos] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: '',
    items: []
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar presupuestos
      const resPresupuestos = await fetch('/api/presupuestos');
      const dataPresupuestos = await resPresupuestos.json();
      if (dataPresupuestos.success) {
        setPresupuestos(dataPresupuestos.presupuestos);
      }

      // Cargar KPI
      const resKpi = await fetch('/api/presupuestos/kpi');
      const dataKpi = await resKpi.json();
      if (dataKpi.success) {
        setKpi(dataKpi.kpi);
      }

      // Cargar clientes
      const resClientes = await fetch('/api/clientes');
      const dataClientes = await resClientes.json();
      if (dataClientes.success) {
        setClientes(dataClientes.clientes);
      }

      // Cargar productos del catálogo
      const resProductos = await fetch('/api/catalogo');
      const dataProductos = await resProductos.json();
      if (dataProductos.success) {
        setProductos(dataProductos.productos);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const aprobarPresupuesto = async (id) => {
    if (!confirm('¿Aprobar este presupuesto?')) return;
    
    try {
      const response = await fetch(`/api/presupuestos/${id}/aprobar`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        cargarDatos();
      }
    } catch (error) {
      console.error('Error aprobando presupuesto:', error);
    }
  };

  const rechazarPresupuesto = async (id) => {
    if (!confirm('¿Rechazar este presupuesto?')) return;
    
    try {
      const response = await fetch(`/api/presupuestos/${id}/rechazar`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        cargarDatos();
      }
    } catch (error) {
      console.error('Error rechazando presupuesto:', error);
    }
  };

  const eliminarPresupuesto = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este presupuesto?')) return;
    
    try {
      const response = await fetch(`/api/presupuestos/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        cargarDatos();
      }
    } catch (error) {
      console.error('Error eliminando presupuesto:', error);
    }
  };

  const generarPDF = (id, numero) => {
    // Abrir en nueva ventana para descargar el PDF
    window.open(`/api/presupuestos/${id}/pdf`, '_blank');
  };

  const agregarItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { producto_id: '', cantidad: 1, precio_unitario: 0, descuento: 0 }]
    });
  };

  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...formData.items];
    nuevosItems[index][campo] = valor;
    setFormData({ ...formData, items: nuevosItems });
  };

  const eliminarItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const calcularTotal = () => {
    return formData.items.reduce((total, item) => {
      const subtotal = item.cantidad * item.precio_unitario;
      const descuento = subtotal * (item.descuento / 100);
      return total + (subtotal - descuento);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const total = calcularTotal();
      const response = await fetch('/api/presupuestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: parseInt(formData.cliente_id),
          items: JSON.stringify(formData.items),
          total: total
        })
      });
      
      const data = await response.json();
      if (data.success) {
        cargarDatos();
        setMostrarForm(false);
        setFormData({ cliente_id: '', items: [] });
      }
    } catch (error) {
      console.error('Error creando presupuesto:', error);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobado': return '#16a34a';
      case 'rechazado': return '#dc2626';
      default: return '#f59e0b';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'aprobado': return '✓ Aprobado';
      case 'rechazado': return '✗ Rechazado';
      default: return '⏳ Borrador';
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
        maxWidth: '1200px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>📋 Gestión de Presupuestos</h2>
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

        {/* KPI Dashboard */}
        {kpi && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '15px', 
            marginBottom: '20px' 
          }}>
            <div style={{ 
              backgroundColor: '#dbeafe', 
              padding: '15px', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
                {kpi.total_generados}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Generados</div>
            </div>
            <div style={{ 
              backgroundColor: '#dcfce7', 
              padding: '15px', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                {kpi.aprobados}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Aprobados</div>
            </div>
            <div style={{ 
              backgroundColor: '#fee2e2', 
              padding: '15px', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                {kpi.rechazados}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Rechazados</div>
            </div>
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '15px', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                {kpi.borradores}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Borradores</div>
            </div>
            <div style={{ 
              backgroundColor: '#e0e7ff', 
              padding: '15px', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4f46e5' }}>
                {kpi.tasa_aprobacion}%
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Tasa Aprobación</div>
            </div>
          </div>
        )}

        {!mostrarForm ? (
          <>
            <button onClick={() => setMostrarForm(true)} style={{
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}>
              ➕ Nuevo Presupuesto
            </button>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Número</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Cliente</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Fecha</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Total</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {presupuestos.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                      No hay presupuestos registrados
                    </td>
                  </tr>
                ) : (
                  presupuestos.map(presupuesto => (
                    <tr key={presupuesto.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        #{presupuesto.numero}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {clientes.find(c => c.id === presupuesto.cliente_id)?.nombre || 'Cliente desconocido'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {new Date(presupuesto.fecha).toLocaleDateString('es-AR')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                        ${presupuesto.total.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: getEstadoColor(presupuesto.estado) + '20',
                          color: getEstadoColor(presupuesto.estado),
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {getEstadoTexto(presupuesto.estado)}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => generarPDF(presupuesto.id, presupuesto.numero)} style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '5px',
                          fontSize: '12px'
                        }}>
                          📄 PDF
                        </button>
                        {presupuesto.estado === 'borrador' && (
                          <>
                            <button onClick={() => aprobarPresupuesto(presupuesto.id)} style={{
                              backgroundColor: '#16a34a',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginRight: '5px',
                              fontSize: '12px'
                            }}>
                              ✓ Aprobar
                            </button>
                            <button onClick={() => rechazarPresupuesto(presupuesto.id)} style={{
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginRight: '5px',
                              fontSize: '12px'
                            }}>
                              ✗ Rechazar
                            </button>
                          </>
                        )}
                        <button onClick={() => eliminarPresupuesto(presupuesto.id)} style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginTop: 0 }}>Nuevo Presupuesto</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cliente *</label>
              <select
                value={formData.cliente_id}
                onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} {cliente.empresa ? `- ${cliente.empresa}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0 }}>Items del Presupuesto</h4>
                <button type="button" onClick={agregarItem} style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}>
                  ➕ Agregar Item
                </button>
              </div>

              {formData.items.map((item, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                  gap: '10px',
                  marginBottom: '10px',
                  padding: '10px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px'
                }}>
                  <select
                    value={item.producto_id}
                    onChange={(e) => {
                      const producto = productos.find(p => p.id === parseInt(e.target.value));
                      actualizarItem(index, 'producto_id', e.target.value);
                      if (producto) {
                        actualizarItem(index, 'precio_unitario', producto.precio);
                        // Guardar snapshot de componentes X,Y,Z,T,G al momento de crear el presupuesto
                        try {
                          const datosCalculo = typeof producto.datos_calculo === 'string'
                            ? JSON.parse(producto.datos_calculo)
                            : producto.datos_calculo;
                          const resultado = datosCalculo?.resultado || {};
                          actualizarItem(index, 'snapshot_x', resultado.costo_materiales || 0);
                          actualizarItem(index, 'snapshot_y', resultado.costo_mano_obra || 0);
                          actualizarItem(index, 'snapshot_z', resultado.costo_maquinas || 0);
                          actualizarItem(index, 'snapshot_t', resultado.costos_indirectos || 0);
                          actualizarItem(index, 'snapshot_g', resultado.ganancia || 0);
                        } catch(err) {
                          console.error('Error leyendo datos_calculo:', err);
                        }
                      }
                    }}
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Producto / Servicio</option>
                    {productos.map(producto => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre} - ${producto.precio.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value))}
                    placeholder="Cant."
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.precio_unitario}
                    onChange={(e) => actualizarItem(index, 'precio_unitario', parseFloat(e.target.value))}
                    placeholder="Precio"
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.descuento}
                    onChange={(e) => actualizarItem(index, 'descuento', parseFloat(e.target.value))}
                    placeholder="Desc %"
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                  <button type="button" onClick={() => eliminarItem(index)} style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <div style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '15px', 
              borderRadius: '4px', 
              marginBottom: '20px',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                Total: ${calcularTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
                💾 Guardar Presupuesto
              </button>
              <button type="button" onClick={() => {
                setMostrarForm(false);
                setFormData({ cliente_id: '', items: [] });
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
    </div>
  );
};

export default GestionPresupuestos;
