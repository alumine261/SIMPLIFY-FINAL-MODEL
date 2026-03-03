import React, { useState, useEffect } from 'react';
import ConfigPanel from './ConfigPanel';

const MainApp = () => {
  const [tipoAcceso, setTipoAcceso] = useState('');
  const [costoMaterial, setCostoMaterial] = useState('');
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

  const cargarDatos = async () => {
    try {
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
        // Manejar ambos formatos de respuesta
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

  const validarDatos = () => {
    if (!costoMaterial || parseFloat(costoMaterial) <= 0) {
      setMensaje('El costo de material es requerido y debe ser mayor a 0');
      return false;
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
      const response = await fetch('/api/calcular-precio-multiple-maquinas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          costo_material: parseFloat(costoMaterial),
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
      
      const data = await response.json();
      
      if (data.success) {
        setResultado(data.data);
        setMensaje('');
      } else {
        setMensaje(data.error || 'Error en el cálculo');
        setResultado(null);
      }
    } catch (error) {
      setMensaje('Error de conexión: ' + error.message);
      setResultado(null);
    }
  };

  const limpiarFormulario = () => {
    setCostoMaterial('');
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

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#2563eb', 
        color: 'white', 
        padding: '15px 20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>🏭 Simplify.cnc</h1>
          <p style={{ margin: 0, fontSize: '14px' }}>Acceso {tipoAcceso === 'propietario' ? 'Propietario' : 'Taller'}</p>
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
        
        {/* Costo de Material */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Costo de Material (ARS)
          </label>
          <input
            type="number"
            value={costoMaterial}
            onChange={(e) => setCostoMaterial(e.target.value)}
            placeholder="25000"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
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
                  <option key={maq.id} value={maq.nombre}>
                    {maq.nombre} ($ {Math.round(maq.costo_por_hora || 0).toLocaleString()}/h)
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
              width: '200px',
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
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🧮 Calcular Precio
          </button>
          <button 
            onClick={limpiarFormulario}
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

        {/* Mensajes */}
        {mensaje && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {mensaje}
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: '#0c4a6e', marginBottom: '15px' }}>💰 Resultado del Cálculo</h3>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#059669',
              marginBottom: '15px'
            }}>
              Precio Final: ${resultado.precio_final?.toLocaleString() || 0}
            </div>
            
            <div>
              <h4 style={{ color: '#374151', marginBottom: '10px' }}>📊 Desglose de Costos:</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ padding: '5px 0' }}>Material: ${resultado.desglose?.costo_material?.toLocaleString() || 0}</li>
                <li style={{ padding: '5px 0' }}>Mano de Obra: ${resultado.desglose?.costo_mano_obra?.toLocaleString() || 0}</li>
                <li style={{ padding: '5px 0' }}>Máquinas: ${resultado.desglose?.costo_maquinas?.toLocaleString() || 0}</li>
                <li style={{ padding: '5px 0' }}>Costos Indirectos: ${resultado.desglose?.costos_indirectos?.toLocaleString() || 0}</li>
                <li style={{ padding: '5px 0', fontWeight: 'bold', borderTop: '1px solid #d1d5db', marginTop: '5px' }}>
                  Subtotal: ${resultado.desglose?.subtotal?.toLocaleString() || 0}
                </li>
                <li style={{ padding: '5px 0' }}>Ganancia ({resultado.factor_ganancia || 2}x): ${resultado.ganancia?.toLocaleString() || 0}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Panel de Configuración */}
      {mostrarConfigPanel && (
        <ConfigPanel 
          onClose={() => {
            setMostrarConfigPanel(false);
            cargarDatos(); // Recargar datos después de cerrar el panel
          }} 
        />
      )}
    </div>
  );
};

export default MainApp;
