import React, { useState, useEffect } from 'react';
import ConfigPanel from './ConfigPanel';

const MainApp = () => {
  const [tipoAcceso, setTipoAcceso] = useState('');
  const [materiales, setMateriales] = useState([]);
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [horasEmpleado, setHorasEmpleado] = useState('');
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState('');
  const [horasMaquina, setHorasMaquina] = useState('');
  const [factorGanancia, setFactorGanancia] = useState('2.0');
  const [resultado, setResultado] = useState(null);
  const [cotizacionDolar, setCotizacionDolar] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [mostrarConfigPanel, setMostrarConfigPanel] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const tipo = localStorage.getItem('tipo_acceso');
    
    if (!token) {
      window.location.reload();
      return;
    }
    
    setTipoAcceso(tipo);
    cargarDatos();
  }, []);

  // Efecto para recalcular costos cuando cambian los precios de materiales
  useEffect(() => {
    // Forzar re-render de los costos cuando cambian los materiales
    if (materialesSeleccionados.length > 0) {
      // Los costos se recalcularán automáticamente en el render
      setMaterialesSeleccionados([...materialesSeleccionados]);
    }
  }, [materiales]);

  const cargarDatos = async () => {
    try {
      // Cargar materiales
      const resMateriales = await fetch('/api/materiales');
      if (resMateriales.ok) {
        const dataMateriales = await resMateriales.json();
        setMateriales(dataMateriales || []);
      }
      
      // Cargar empleados
      const resEmpleados = await fetch('/api/empleados');
      if (resEmpleados.ok) {
        const dataEmpleados = await resEmpleados.json();
        setEmpleados(dataEmpleados || []);
      }
      
      // Cargar máquinas
      const resMaquinas = await fetch('/api/maquinas');
      if (resMaquinas.ok) {
        const dataMaquinas = await resMaquinas.json();
        const maquinasArray = dataMaquinas.data || dataMaquinas || [];
        setMaquinas(maquinasArray);
      }
      
      // Cargar cotización del dólar
      const resDolar = await fetch('/api/cotizacion-dolar');
      if (resDolar.ok) {
        const dataDolar = await resDolar.json();
        setCotizacionDolar(dataDolar);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const agregarMaterial = () => {
    setMaterialesSeleccionados([...materialesSeleccionados, {
      id: Date.now(),
      material_id: '',
      cantidad: '',
      unidad: 'm2'
    }]);
  };

  const eliminarMaterial = (id) => {
    setMaterialesSeleccionados(materialesSeleccionados.filter(m => m.id !== id));
  };

  const actualizarMaterial = (id, campo, valor) => {
    setMaterialesSeleccionados(materialesSeleccionados.map(m => 
      m.id === id ? { ...m, [campo]: valor } : m
    ));
  };

  const calcularCostoMaterial = (materialSel) => {
    const material = materiales.find(m => m.id === parseInt(materialSel.material_id));
    if (!material || !materialSel.cantidad) return 0;
    
    const cantidad = parseFloat(materialSel.cantidad);
    const precioBase = material.precio_por_m2 || 0;
    
    // Conversión según unidad
    let costoFinal = 0;
    switch(materialSel.unidad) {
      case 'm2':
        costoFinal = precioBase * cantidad;
        break;
      case 'ml': // mililitros (asumiendo que el precio es por litro)
        costoFinal = (precioBase / 1000) * cantidad;
        break;
      case 'g': // gramos (asumiendo que el precio es por kg)
        costoFinal = (precioBase / 1000) * cantidad;
        break;
      case 'unidad':
        costoFinal = precioBase * cantidad;
        break;
      default:
        costoFinal = precioBase * cantidad;
    }
    
    return costoFinal;
  };

  const calcularCostoTotalMateriales = () => {
    return materialesSeleccionados.reduce((total, mat) => {
      return total + calcularCostoMaterial(mat);
    }, 0);
  };

  const validarDatos = () => {
    if (materialesSeleccionados.length === 0) {
      setMensaje('Debe agregar al menos un material');
      return false;
    }
    
    for (let mat of materialesSeleccionados) {
      if (!mat.material_id || !mat.cantidad || parseFloat(mat.cantidad) <= 0) {
        setMensaje('Todos los materiales deben tener un tipo y cantidad válidos');
        return false;
      }
    }
    
    if (!empleadoSeleccionado || !horasEmpleado || parseFloat(horasEmpleado) <= 0) {
      setMensaje('Debe seleccionar un empleado y especificar las horas de trabajo');
      return false;
    }
    
    if (!maquinaSeleccionada || !horasMaquina || parseFloat(horasMaquina) <= 0) {
      setMensaje('Debe seleccionar una máquina y especificar las horas de uso');
      return false;
    }
    
    return true;
  };

  const calcularPrecio = async () => {
    if (!validarDatos()) return;
    
    try {
      const costoTotalMateriales = calcularCostoTotalMateriales();
      
      const response = await fetch('/api/calcular-precio-multiple-maquinas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          costo_material: costoTotalMateriales,
          empleados: [{
            tipo_empleado: empleadoSeleccionado,
            horas_trabajo: parseFloat(horasEmpleado)
          }],
          maquinas: [{
            tipo_maquina: maquinaSeleccionada,
            horas_maquina: parseFloat(horasMaquina)
          }],
          factor_ganancia: parseFloat(factorGanancia)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResultado(data);
        setMensaje('');
      } else {
        const error = await response.json();
        setMensaje(error.error || 'Error al calcular el precio');
      }
    } catch (error) {
      setMensaje('Error: ' + error.message);
    }
  };

  const limpiar = () => {
    setMaterialesSeleccionados([]);
    setEmpleadoSeleccionado('');
    setHorasEmpleado('');
    setMaquinaSeleccionada('');
    setHorasMaquina('');
    setFactorGanancia('2.0');
    setResultado(null);
    setMensaje('');
  };

  const salir = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tipo_acceso');
    window.location.reload();
  };

  if (!tipoAcceso) {
    return <div>Cargando...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#2563eb', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>🏭 Simplify.cnc</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
            Acceso {tipoAcceso === 'propietario' ? 'Propietario' : 'Taller'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {cotizacionDolar && (
            <div style={{ fontSize: '14px' }}>
              💵 Dólar Blue: $ {cotizacionDolar.venta || cotizacionDolar.data?.venta || 'N/A'}
            </div>
          )}
          {tipoAcceso === 'propietario' && (
            <button 
              onClick={() => setMostrarConfigPanel(true)}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ⚙️ Configuración
            </button>
          )}
          <button 
            onClick={salir}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🚪 Salir
          </button>
        </div>
      </div>

      {/* Calculadora */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>💰 Calculadora de Costos</h2>
        
        {/* Materiales */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: '#374151', margin: 0 }}>📦 Materiales</h3>
            <button
              onClick={agregarMaterial}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ➕ Agregar Material
            </button>
          </div>
          
          {materialesSeleccionados.length === 0 ? (
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '4px', 
              textAlign: 'center',
              color: '#6b7280'
            }}>
              No hay materiales agregados. Haz clic en "Agregar Material" para comenzar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {materialesSeleccionados.map((matSel) => {
                const material = materiales.find(m => m.id === parseInt(matSel.material_id));
                const costo = calcularCostoMaterial(matSel);
                
                return (
                  <div key={matSel.id} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr 1fr auto auto', 
                    gap: '10px',
                    padding: '15px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px',
                    alignItems: 'center'
                  }}>
                    <select
                      value={matSel.material_id}
                      onChange={(e) => actualizarMaterial(matSel.id, 'material_id', e.target.value)}
                      style={{
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Seleccionar material</option>
                      {materiales.map(mat => (
                        <option key={mat.id} value={mat.id}>
                          {mat.nombre} - ${mat.precio_por_m2?.toLocaleString()}/m²
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      step="0.01"
                      value={matSel.cantidad}
                      onChange={(e) => actualizarMaterial(matSel.id, 'cantidad', e.target.value)}
                      placeholder="Cantidad"
                      style={{
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    
                    <select
                      value={matSel.unidad}
                      onChange={(e) => actualizarMaterial(matSel.id, 'unidad', e.target.value)}
                      style={{
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="m2">m²</option>
                      <option value="ml">ml</option>
                      <option value="g">g</option>
                      <option value="unidad">Unidad</option>
                    </select>
                    
                    <div style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#1e40af',
                      minWidth: '100px',
                      textAlign: 'right'
                    }}>
                      ${costo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    
                    <button
                      onClick={() => eliminarMaterial(matSel.id)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
              
              <div style={{
                padding: '15px',
                backgroundColor: '#dbeafe',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                <span>Costo Total de Materiales:</span>
                <span style={{ color: '#1e40af', fontSize: '18px' }}>
                  ${calcularCostoTotalMateriales().toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Empleado */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#374151', marginBottom: '10px' }}>👥 Mano de Obra</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Tipo de Empleado
              </label>
              <select
                value={empleadoSeleccionado}
                onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                <option value="">Seleccionar</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} ($ {emp.tarifa_por_hora?.toLocaleString() || 0}/h)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Horas de Trabajo
              </label>
              <input
                type="number"
                step="0.1"
                value={horasEmpleado}
                onChange={(e) => setHorasEmpleado(e.target.value)}
                placeholder="3.5"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Máquina */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#374151', marginBottom: '10px' }}>⚙️ Máquinas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Tipo de Máquina
              </label>
              <select
                value={maquinaSeleccionada}
                onChange={(e) => setMaquinaSeleccionada(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                <option value="">Seleccionar máquina</option>
                {maquinas.map(maq => (
                  <option key={maq.id} value={maq.id}>
                    {maq.nombre} ($ {maq.costo_por_hora?.toLocaleString() || 0}/h)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Horas de Máquina
              </label>
              <input
                type="number"
                step="0.1"
                value={horasMaquina}
                onChange={(e) => setHorasMaquina(e.target.value)}
                placeholder="1.5"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Factor de Ganancia */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Factor de Ganancia
          </label>
          <input
            type="number"
            step="0.1"
            value={factorGanancia}
            onChange={(e) => setFactorGanancia(e.target.value)}
            placeholder="2.0"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={calcularPrecio}
            style={{
              flex: 1,
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🧮 Calcular Precio
          </button>
          <button
            onClick={limpiar}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🗑️ Limpiar
          </button>
        </div>

        {/* Mensaje de error */}
        {mensaje && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {mensaje}
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div style={{
            padding: '20px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '2px solid #10b981'
          }}>
            <h3 style={{ color: '#065f46', marginTop: 0 }}>✅ Resultado del Cálculo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <p style={{ margin: '5px 0' }}>
                  <strong>Costo Materiales:</strong> ${resultado.costo_materiales?.toLocaleString() || 0}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Costo Mano de Obra:</strong> ${resultado.costo_mano_obra?.toLocaleString() || 0}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Costo Máquinas:</strong> ${resultado.costo_maquinas?.toLocaleString() || 0}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Costos Indirectos:</strong> ${resultado.costos_indirectos?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p style={{ margin: '5px 0' }}>
                  <strong>Costo Total:</strong> ${resultado.costo_total?.toLocaleString() || 0}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Ganancia:</strong> ${resultado.ganancia?.toLocaleString() || 0}
                </p>
                <p style={{ 
                  margin: '15px 0 5px 0', 
                  fontSize: '20px', 
                  color: '#065f46',
                  fontWeight: 'bold'
                }}>
                  💵 Precio Final: ${resultado.precio_final?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel de Configuración */}
      {mostrarConfigPanel && (
        <ConfigPanel onClose={() => {
          setMostrarConfigPanel(false);
          // Recargar datos después de cerrar el panel de configuración
          cargarDatos();
        }} />
      )}
    </div>
  );
};

export default MainApp;

