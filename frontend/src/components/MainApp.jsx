import React, { useState, useEffect } from 'react';
import ConfigPanel from './ConfigPanel';
import GestionClientes from './GestionClientes';
import GestionCatalogo from './GestionCatalogo';
import GestionPresupuestos from './GestionPresupuestos';
import KPIDashboard from './KPIDashboard';
import TallerPropietario from './TallerPropietario';
import TallerEmpleado from './TallerEmpleado';

const MainApp = () => {
  const [tipoAcceso, setTipoAcceso] = useState('');
  const [materiales, setMateriales] = useState([]);
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [maquinasSeleccionadas, setMaquinasSeleccionadas] = useState([]);
  const [factorGanancia, setFactorGanancia] = useState('2.0');
  const [resultado, setResultado] = useState(null);
  const [cotizacionDolar, setCotizacionDolar] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [mostrarConfigPanel, setMostrarConfigPanel] = useState(false);
  const [mostrarClientes, setMostrarClientes] = useState(false);
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [mostrarPresupuestos, setMostrarPresupuestos] = useState(false);
  const [mostrarKPI, setMostrarKPI] = useState(false);
  const [mostrarTallerPropietario, setMostrarTallerPropietario] = useState(false);
  const [mostrarModalGuardarCatalogo, setMostrarModalGuardarCatalogo] = useState(false);
  const [nombreProducto, setNombreProducto] = useState('');
  const [descripcionProducto, setDescripcionProducto] = useState('');

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

  // Funciones para materiales
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

  // Función para evaluar ecuaciones en el campo de cantidad
  const evaluarCantidad = (cantidadStr) => {
    if (!cantidadStr) return 0;
    
    // Si empieza con =, evaluar como ecuación
    if (cantidadStr.toString().trim().startsWith('=')) {
      try {
        const ecuacion = cantidadStr.substring(1).trim();
        // Evaluar la ecuación de forma segura
        const resultado = Function('"use strict"; return (' + ecuacion + ')')();
        return parseFloat(resultado) || 0;
      } catch (error) {
        console.error('Error evaluando ecuación:', error);
        return 0;
      }
    }
    
    // Si no, parsear como número normal
    return parseFloat(cantidadStr) || 0;
  };

  const calcularCostoMaterial = (materialSel) => {
    const material = materiales.find(m => m.id === parseInt(materialSel.material_id));
    if (!material) return 0;
    
    const cantidad = evaluarCantidad(materialSel.cantidad);
    if (cantidad === 0) return 0;
    
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

  // Funciones para empleados
  const agregarEmpleado = () => {
    setEmpleadosSeleccionados([...empleadosSeleccionados, {
      id: Date.now(),
      empleado_id: '',
      horas: ''
    }]);
  };

  const eliminarEmpleado = (id) => {
    setEmpleadosSeleccionados(empleadosSeleccionados.filter(e => e.id !== id));
  };

  const actualizarEmpleado = (id, campo, valor) => {
    setEmpleadosSeleccionados(empleadosSeleccionados.map(e => 
      e.id === id ? { ...e, [campo]: valor } : e
    ));
  };

  // Funciones para máquinas
  const agregarMaquina = () => {
    setMaquinasSeleccionadas([...maquinasSeleccionadas, {
      id: Date.now(),
      maquina_id: '',
      horas: ''
    }]);
  };

  const eliminarMaquina = (id) => {
    setMaquinasSeleccionadas(maquinasSeleccionadas.filter(m => m.id !== id));
  };

  const actualizarMaquina = (id, campo, valor) => {
    setMaquinasSeleccionadas(maquinasSeleccionadas.map(m => 
      m.id === id ? { ...m, [campo]: valor } : m
    ));
  };

  const validarDatos = () => {
    if (materialesSeleccionados.length === 0) {
      setMensaje('Debe agregar al menos un material');
      return false;
    }
    
    for (let mat of materialesSeleccionados) {
      if (!mat.material_id || !mat.cantidad) {
        setMensaje('Todos los materiales deben tener un tipo y cantidad válidos');
        return false;
      }
    }
    
    if (empleadosSeleccionados.length === 0) {
      setMensaje('Debe agregar al menos un empleado');
      return false;
    }
    
    for (let emp of empleadosSeleccionados) {
      const horas = evaluarCantidad(emp.horas);
      if (!emp.empleado_id || horas <= 0) {
        setMensaje('Todos los empleados deben tener horas de trabajo válidas');
        return false;
      }
    }
    
    if (maquinasSeleccionadas.length === 0) {
      setMensaje('Debe agregar al menos una máquina');
      return false;
    }
    
    for (let maq of maquinasSeleccionadas) {
      const horas = evaluarCantidad(maq.horas);
      if (!maq.maquina_id || horas <= 0) {
        setMensaje('Todas las máquinas deben tener horas de uso válidas');
        return false;
      }
    }
    
    return true;
  };

  const calcularPrecio = async () => {
    if (!validarDatos()) return;
    
    try {
      const costoTotalMateriales = calcularCostoTotalMateriales();
      
      // Preparar array de empleados con IDs correctos
      const empleadosData = empleadosSeleccionados.map(emp => ({
        tipo_empleado: parseInt(emp.empleado_id),
        horas_trabajo: evaluarCantidad(emp.horas)
      }));
      
      // Preparar array de máquinas con IDs correctos
      const maquinasData = maquinasSeleccionadas.map(maq => ({
        tipo_maquina: parseInt(maq.maquina_id),
        horas_maquina: evaluarCantidad(maq.horas)
      }));
      
      console.log('Enviando datos:', {
        costo_material: costoTotalMateriales,
        empleados: empleadosData,
        maquinas: maquinasData,
        factor_ganancia: parseFloat(factorGanancia)
      });
      
      const response = await fetch('/api/calcular-precio-multiple-maquinas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          costo_material: costoTotalMateriales,
          empleados: empleadosData,
          maquinas: maquinasData,
          factor_ganancia: parseFloat(factorGanancia)
        })
      });

      if (response.ok) {
        try {
          const data = await response.json();
          console.log('Respuesta del servidor:', data);
          setResultado(data);
          setMensaje('');
        } catch (e) {
          const text = await response.text();
          console.error('Respuesta no JSON (exitosa):', text);
          setMensaje('Error: La respuesta del servidor no es válida');
        }
      } else {
        try {
          const error = await response.json();
          setMensaje(error.error || 'Error al calcular el precio');
        } catch (e) {
          const text = await response.text();
          console.error('Respuesta no JSON:', text);
          setMensaje('Error del servidor: ' + response.status);
        }
      }
    } catch (error) {
      console.error('Error en calcular:', error);
      setMensaje('Error: ' + error.message);
    }
  };

  const limpiar = () => {
    setMaterialesSeleccionados([]);
    setEmpleadosSeleccionados([]);
    setMaquinasSeleccionadas([]);
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
            <>
              <button 
                onClick={() => setMostrarClientes(true)}
                style={{
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                👥 Clientes
              </button>
              <button 
                onClick={() => setMostrarCatalogo(true)}
                style={{
                  backgroundColor: '#0891b2',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📦 Catálogo
              </button>
              <button 
                onClick={() => setMostrarPresupuestos(true)}
                style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📋 Presupuestos
              </button>
              <button 
                onClick={() => setMostrarKPI(true)}
                style={{
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📊 KPIs
              </button>
              <button 
                onClick={() => setMostrarTallerPropietario(true)}
                style={{
                  backgroundColor: '#0f766e',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🏭 Taller
              </button>
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
            </>
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

      {/* Vista Taller para empleados */}
      {tipoAcceso === 'taller' && (
        <TallerEmpleado
          empleadoId={localStorage.getItem('empleado_id')}
          empleadoNombre={localStorage.getItem('empleado_nombre') || 'Empleado'}
        />
      )}

      {/* Calculadora - solo visible para propietario */}
      {tipoAcceso === 'propietario' && (
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
              No hay materiales agregados. Usa "=" para ecuaciones (ej: =100/2)
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {materialesSeleccionados.map((matSel) => {
                const material = materiales.find(m => m.id === parseInt(matSel.material_id));
                const costo = calcularCostoMaterial(matSel);
                const cantidadEvaluada = evaluarCantidad(matSel.cantidad);
                
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
                    
                    <div>
                      <input
                        type="text"
                        value={matSel.cantidad}
                        onChange={(e) => actualizarMaterial(matSel.id, 'cantidad', e.target.value)}
                        placeholder="=100/2 o 50"
                        style={{
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                          width: '100%'
                        }}
                      />
                      {matSel.cantidad && matSel.cantidad.toString().startsWith('=') && (
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                          = {cantidadEvaluada.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
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

        {/* Empleados */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: '#374151', margin: 0 }}>👥 Mano de Obra</h3>
            <button
              onClick={agregarEmpleado}
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
              ➕ Agregar Empleado
            </button>
          </div>
          
          {empleadosSeleccionados.length === 0 ? (
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '4px', 
              textAlign: 'center',
              color: '#6b7280'
            }}>
              No hay empleados agregados. Usa "=" para ecuaciones en horas
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {empleadosSeleccionados.map((empSel) => {
                const empleado = empleados.find(e => e.id === parseInt(empSel.empleado_id));
                const horasEvaluadas = evaluarCantidad(empSel.horas);
                const costo = empleado ? (empleado.tarifa_por_hora * horasEvaluadas) : 0;
                
                return (
                  <div key={empSel.id} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr auto auto', 
                    gap: '10px',
                    padding: '15px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px',
                    alignItems: 'center'
                  }}>
                    <select
                      value={empSel.empleado_id}
                      onChange={(e) => actualizarEmpleado(empSel.id, 'empleado_id', e.target.value)}
                      style={{
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Seleccionar empleado</option>
                      {empleados.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombre} (${emp.tarifa_por_hora?.toLocaleString()}/h)
                        </option>
                      ))}
                    </select>
                    
                    <div>
                      <input
                        type="text"
                        value={empSel.horas}
                        onChange={(e) => actualizarEmpleado(empSel.id, 'horas', e.target.value)}
                        placeholder="=8*2 o 16"
                        style={{
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                          width: '100%'
                        }}
                      />
                      {empSel.horas && empSel.horas.toString().startsWith('=') && (
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                          = {horasEvaluadas.toFixed(2)} horas
                        </div>
                      )}
                    </div>
                    
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
                      onClick={() => eliminarEmpleado(empSel.id)}
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
            </div>
          )}
        </div>

        {/* Máquinas */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: '#374151', margin: 0 }}>⚙️ Máquinas</h3>
            <button
              onClick={agregarMaquina}
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
              ➕ Agregar Máquina
            </button>
          </div>
          
          {maquinasSeleccionadas.length === 0 ? (
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '4px', 
              textAlign: 'center',
              color: '#6b7280'
            }}>
              No hay máquinas agregadas. Usa "=" para ecuaciones en horas
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {maquinasSeleccionadas.map((maqSel) => {
                const maquina = maquinas.find(m => m.id === parseInt(maqSel.maquina_id));
                const horasEvaluadas = evaluarCantidad(maqSel.horas);
                const costo = maquina ? (maquina.costo_por_hora * horasEvaluadas) : 0;
                
                return (
                  <div key={maqSel.id} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr auto auto', 
                    gap: '10px',
                    padding: '15px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px',
                    alignItems: 'center'
                  }}>
                    <select
                      value={maqSel.maquina_id}
                      onChange={(e) => actualizarMaquina(maqSel.id, 'maquina_id', e.target.value)}
                      style={{
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Seleccionar máquina</option>
                      {maquinas.map(maq => (
                        <option key={maq.id} value={maq.id}>
                          {maq.nombre} (${maq.costo_por_hora?.toLocaleString()}/h)
                        </option>
                      ))}
                    </select>
                    
                    <div>
                      <input
                        type="text"
                        value={maqSel.horas}
                        onChange={(e) => actualizarMaquina(maqSel.id, 'horas', e.target.value)}
                        placeholder="=4/2 o 2"
                        style={{
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                          width: '100%'
                        }}
                      />
                      {maqSel.horas && maqSel.horas.toString().startsWith('=') && (
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                          = {horasEvaluadas.toFixed(2)} horas
                        </div>
                      )}
                    </div>
                    
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
                      onClick={() => eliminarMaquina(maqSel.id)}
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
            </div>
          )}
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
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={() => setMostrarModalGuardarCatalogo(true)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#06b6d4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                💾 Guardar en Catálogo
              </button>
            </div>
          </div>
        )}
      </div>
      )}
      {/* Panel de Configuración */}
      {mostrarConfigPanel && (
        <ConfigPanel onClose={() => {
          setMostrarConfigPanel(false);
          // Recargar datos después de cerrar el panel de configuración
          cargarDatos();
        }} />
      )}

      {/* Gestión de Clientes */}
      {mostrarClientes && (
        <GestionClientes onClose={() => setMostrarClientes(false)} />
      )}

      {/* Gestión de Catálogo */}
      {mostrarCatalogo && (
        <GestionCatalogo onClose={() => setMostrarCatalogo(false)} />
      )}

      {/* Gestión de Presupuestos */}
      {mostrarPresupuestos && (
        <GestionPresupuestos onClose={() => setMostrarPresupuestos(false)} />
      )}

      {/* KPI Dashboard */}
      {mostrarKPI && (
        <KPIDashboard onClose={() => setMostrarKPI(false)} />
      )}

      {/* Taller Propietario */}
      {mostrarTallerPropietario && (
        <TallerPropietario onClose={() => setMostrarTallerPropietario(false)} />
      )}
      {/* Modal Guardar en Catálogo */}
      {mostrarModalGuardarCatalogo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginTop: 0, color: '#06b6d4' }}>💾 Guardar Producto en Catálogo</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Nombre del Producto *
              </label>
              <input
                type="text"
                value={nombreProducto}
                onChange={(e) => setNombreProducto(e.target.value)}
                placeholder="Ej: Premio Tipo 1, Cartel Acrílico 30x40"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Precio Calculado
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                border: '2px solid #10b981',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#065f46'
              }}>
                ${resultado?.precio_final?.toLocaleString() || 0}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Descripción (Opcional)
              </label>
              <textarea
                value={descripcionProducto}
                onChange={(e) => setDescripcionProducto(e.target.value)}
                placeholder="Descripción del producto, materiales usados, etc."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '5px 0', fontSize: '13px' }}>
                <strong>Materiales:</strong> {materialesSeleccionados.length} item(s)
              </p>
              <p style={{ margin: '5px 0', fontSize: '13px' }}>
                <strong>Empleados:</strong> {empleadosSeleccionados.length} item(s)
              </p>
              <p style={{ margin: '5px 0', fontSize: '13px' }}>
                <strong>Máquinas:</strong> {maquinasSeleccionadas.length} item(s)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setMostrarModalGuardarCatalogo(false);
                  setNombreProducto('');
                  setDescripcionProducto('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!nombreProducto.trim()) {
                    alert('Por favor ingresa un nombre para el producto');
                    return;
                  }

                  try {
                    const datosCalculo = {
                      materiales: materialesSeleccionados.map(m => ({
                        id: m.material_id,
                        nombre: materiales.find(mat => mat.id === m.material_id)?.nombre,
                        cantidad: m.cantidad,
                        precio_unitario: materiales.find(mat => mat.id === m.material_id)?.precio
                      })),
                      empleados: empleadosSeleccionados.map(e => ({
                        id: e.empleado_id,
                        nombre: empleados.find(emp => emp.id === e.empleado_id)?.nombre,
                        horas: e.horas,
                        tarifa_hora: empleados.find(emp => emp.id === e.empleado_id)?.tarifa_por_hora
                      })),
                      maquinas: maquinasSeleccionadas.map(m => ({
                        id: m.maquina_id,
                        nombre: maquinas.find(maq => maq.id === m.maquina_id)?.nombre,
                        horas: m.horas,
                        costo_hora: maquinas.find(maq => maq.id === m.maquina_id)?.costo_hora
                      })),
                      factor_ganancia: parseFloat(factorGanancia),
                      resultado: resultado
                    };

                    const response = await fetch('/api/catalogo', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({
                        nombre: nombreProducto,
                        precio: resultado.precio_final,
                        descripcion: descripcionProducto,
                        datos_calculo: datosCalculo
                      })
                    });

                    if (response.ok) {
                      alert('✅ Producto guardado en el catálogo exitosamente');
                      setMostrarModalGuardarCatalogo(false);
                      setNombreProducto('');
                      setDescripcionProducto('');
                    } else {
                      const error = await response.json();
                      alert(`Error: ${error.error || 'No se pudo guardar el producto'}`);
                    }
                  } catch (error) {
                    console.error('Error al guardar producto:', error);
                    alert('Error al guardar el producto en el catálogo');
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#06b6d4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                💾 Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MainApp;

