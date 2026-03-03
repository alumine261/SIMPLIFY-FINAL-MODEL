import React, { useState, useEffect } from 'react';

const ConfigPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('materiales');
  const [materiales, setMateriales] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [costosFijos, setCostosFijos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState('');
  const [reloadKey, setReloadKey] = useState(0); // Para forzar recarga
  
  // Estados para modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState('agregar'); // 'agregar' o 'editar'
  const [itemEditando, setItemEditando] = useState(null);
  
  // Estados para modal de edición de costo base individual
  const [modalCostoBase, setModalCostoBase] = useState(false);
  const [costoBaseEditando, setCostoBaseEditando] = useState({ campo: '', nombre: '', valor: 0, tipo: 'costo_fijo' });
  
  // Estados para formularios
  const [formMaterial, setFormMaterial] = useState({
    nombre: '',
    descripcion: '',
    precio_por_m2: '',
    unidad_medida: 'm²',
    espesor: '',
    color: '',
    categoria: ''
  });
  
  const [formEmpleado, setFormEmpleado] = useState({
    id: '',
    nombre: '',
    tipo: 'operario',
    tarifa_por_hora: ''
  });
  
  const [formMaquina, setFormMaquina] = useState({
    nombre: '',
    costo_inicial: '',
    vida_util_meses: '',
    horas_semanales: '',
    costo_mantenimiento_mensual: '',
    fecha_compra: new Date().toISOString().split('T')[0]
  });
  
  const [formCostoFijo, setFormCostoFijo] = useState({
    nombre: '',
    categoria: 'servicio',
    monto_mensual: '',
    descripcion: '',
    activo: true
  });
  
  const [costosBase, setCostosBase] = useState(null);
  const [formCostosBase, setFormCostosBase] = useState({
    luz: '',
    gas: '',
    internet: '',
    telefono: '',
    alquiler: '',
    impuestos_fijos: '',
    manus: '',
    mantenimiento_basico: '',
    reserva_reparaciones: '',
    horas_mensuales: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [activeTab, reloadKey]);

  const cargarDatos = async () => {
    try {
      if (activeTab === 'materiales') {
        const res = await fetch('/api/materiales');
        if (res.ok) {
          const data = await res.json();
          setMateriales(data || []);
        }
      } else if (activeTab === 'empleados') {
        const res = await fetch('/api/empleados');
        if (res.ok) {
          const data = await res.json();
          setEmpleados(data || []);
        }
      } else if (activeTab === 'maquinas') {
        const res = await fetch('/api/maquinas');
        if (res.ok) {
          const data = await res.json();
          // Manejar ambos formatos de respuesta
          const maquinasArray = data.data || data || [];
          setMaquinas(maquinasArray);
        }
      } else if (activeTab === 'costos-base') {
        const res = await fetch('/api/costos-base');
        if (res.ok) {
          const response = await res.json();
          if (response && response.data) {
            const costos = response.data;
            setCostosBase(costos);
            setFormCostosBase({
              luz: costos.costos_fijos?.luz || '',
              gas: costos.costos_fijos?.gas || '',
              internet: costos.costos_fijos?.internet || '',
              telefono: costos.costos_fijos?.telefono || '',
              alquiler: costos.costos_fijos?.alquiler || '',
              impuestos_fijos: costos.costos_fijos?.impuestos_fijos || '',
              manus: costos.costos_fijos?.manus || '',
              mantenimiento_basico: costos.mantenimiento?.basico || '',
              reserva_reparaciones: costos.mantenimiento?.reserva_reparaciones || '',
              horas_mensuales: costos.horas_mensuales || 160
            });
          }
        }
        // Cargar costos fijos personalizados también
        const resCostosFijos = await fetch('/api/costos-fijos');
        if (resCostosFijos.ok) {
          const data = await resCostosFijos.json();
          setCostosFijos(data || []);
        }
      } else if (activeTab === 'costos-fijos') {
        const res = await fetch('/api/costos-fijos');
        if (res.ok) {
          const data = await res.json();
          setCostosFijos(data || []);
        }
      }
    } catch (error) {
      mostrarMensaje('Error cargando datos: ' + error.message, 'error');
    }
  };

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje(texto);
    setMensajeTipo(tipo);
    setTimeout(() => {
      setMensaje('');
      setMensajeTipo('');
    }, 3000);
  };

  const abrirModalAgregar = () => {
    setModoModal('agregar');
    setItemEditando(null);
    
    if (activeTab === 'materiales') {
      setFormMaterial({
        nombre: '',
        descripcion: '',
        precio_por_m2: '',
        unidad_medida: 'm²',
        espesor: '',
        color: '',
        categoria: ''
      });
    } else if (activeTab === 'empleados') {
      setFormEmpleado({
        id: '',
        nombre: '',
        tipo: 'operario',
        tarifa_por_hora: ''
      });
    } else if (activeTab === 'maquinas') {
      setFormMaquina({
        nombre: '',
        costo_inicial: '',
        vida_util_meses: '',
        horas_semanales: '',
        costo_mantenimiento_mensual: '',
        fecha_compra: new Date().toISOString().split('T')[0]
      });
    } else if (activeTab === 'costos-fijos' || activeTab === 'costos-base') {
      setFormCostoFijo({
        nombre: '',
        categoria: 'servicio',
        monto_mensual: '',
        descripcion: '',
        activo: true
      });
    }
    
    setModalAbierto(true);
  };

  const abrirModalEditar = (item) => {
    setModoModal('editar');
    setItemEditando(item);
    
    if (activeTab === 'materiales') {
      setFormMaterial({
        nombre: item.nombre || '',
        descripcion: item.descripcion || '',
        precio_por_m2: item.precio_por_m2 || '',
        unidad_medida: item.unidad_medida || 'm²',
        espesor: item.espesor || '',
        color: item.color || '',
        categoria: item.categoria || ''
      });
    } else if (activeTab === 'empleados') {
      setFormEmpleado({
        id: item.id || '',
        nombre: item.nombre || '',
        tipo: item.tipo || 'operario',
        tarifa_por_hora: item.tarifa_por_hora || ''
      });
    } else if (activeTab === 'maquinas') {
      setFormMaquina({
        nombre: item.nombre || '',
        costo_inicial: item.costo_inicial || '',
        vida_util_meses: item.vida_util_meses || '',
        horas_semanales: item.horas_semanales || '',
        costo_mantenimiento_mensual: item.costo_mantenimiento_mensual || '',
        fecha_compra: item.fecha_compra ? item.fecha_compra.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else if (activeTab === 'costos-fijos' || activeTab === 'costos-base') {
      setFormCostoFijo({
        nombre: item.nombre || '',
        categoria: item.categoria || 'servicio',
        monto_mensual: item.monto_mensual || item.valor || '',
        descripcion: item.descripcion || '',
        activo: item.activo !== undefined ? item.activo : true
      });
    }
    
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setItemEditando(null);
  };

  const guardarItem = async () => {
    try {
      let url = '';
      let method = 'POST';
      let body = {};
      
      if (activeTab === 'materiales') {
        if (modoModal === 'editar') {
          url = `/api/materiales/${itemEditando.id}`;
          method = 'PUT';
        } else {
          url = '/api/materiales';
        }
        body = formMaterial;
      } else if (activeTab === 'empleados') {
        if (modoModal === 'editar') {
          url = `/api/empleados/${itemEditando.id}`;
          method = 'PUT';
          body = {
            nombre: formEmpleado.nombre,
            tipo: formEmpleado.tipo,
            tarifa_por_hora: formEmpleado.tarifa_por_hora
          };
        } else {
          url = '/api/empleados';
          method = 'POST';
          body = {
            nombre: formEmpleado.nombre,
            tipo: formEmpleado.tipo,
            tarifa_por_hora: formEmpleado.tarifa_por_hora
          };
        }
      } else if (activeTab === 'maquinas') {
        if (modoModal === 'editar') {
          url = `/api/maquinas/${itemEditando.id}`;
          method = 'PUT';
        } else {
          url = '/api/maquinas';
        }
        body = formMaquina;
      } else if (activeTab === 'costos-fijos' || activeTab === 'costos-base') {
        if (modoModal === 'editar') {
          url = `/api/costos-fijos/${itemEditando.id}`;
          method = 'PUT';
        } else {
          url = '/api/costos-fijos';
        }
        body = formCostoFijo;
      }
      
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        mostrarMensaje(modoModal === 'editar' ? 'Actualizado correctamente' : 'Agregado correctamente', 'success');
        cerrarModal();
        // Forzar recarga incrementando el reloadKey
        setTimeout(() => {
          setReloadKey(prev => prev + 1);
        }, 300);
      } else {
        const error = await res.json();
        mostrarMensaje(error.error || 'Error al guardar', 'error');
      }
    } catch (error) {
      mostrarMensaje('Error: ' + error.message, 'error');
    }
  };

  const eliminarItem = async (item) => {
    if (!confirm('¿Está seguro de eliminar este elemento?')) return;
    
    try {
      let url = '';
      
      if (activeTab === 'materiales') {
        url = `/api/materiales/${item.id}`;
      } else if (activeTab === 'maquinas') {
        url = `/api/maquinas/${item.id}`;
      } else if (activeTab === 'costos-fijos' || activeTab === 'costos-base') {
        url = `/api/costos-fijos/${item.id}`;
      } else {
        mostrarMensaje('No se pueden eliminar empleados', 'error');
        return;
      }
      
      const res = await fetch(url, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        mostrarMensaje('Eliminado correctamente', 'success');
        // Forzar recarga incrementando el reloadKey
        setTimeout(() => {
          setReloadKey(prev => prev + 1);
        }, 300);
      } else {
        const error = await res.json();
        mostrarMensaje(error.error || 'Error al eliminar', 'error');
      }
    } catch (error) {
      mostrarMensaje('Error: ' + error.message, 'error');
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
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#2563eb',
          color: 'white',
          borderRadius: '8px 8px 0 0'
        }}>
          <h2 style={{ margin: 0 }}>⚙️ Panel de Configuración</h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 10px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Mensajes */}
        {mensaje && (
          <div style={{
            margin: '20px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: mensajeTipo === 'error' ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${mensajeTipo === 'error' ? '#fecaca' : '#bbf7d0'}`,
            color: mensajeTipo === 'error' ? '#dc2626' : '#16a34a'
          }}>
            {mensaje}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 20px'
        }}>
          <button
            onClick={() => setActiveTab('materiales')}
            style={{
              padding: '15px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'materiales' ? '2px solid #2563eb' : 'none',
              color: activeTab === 'materiales' ? '#2563eb' : '#6b7280',
              fontWeight: activeTab === 'materiales' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            📦 Materiales
          </button>
          <button
            onClick={() => setActiveTab('empleados')}
            style={{
              padding: '15px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'empleados' ? '2px solid #2563eb' : 'none',
              color: activeTab === 'empleados' ? '#2563eb' : '#6b7280',
              fontWeight: activeTab === 'empleados' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            👥 Empleados
          </button>
          <button
            onClick={() => setActiveTab('maquinas')}
            style={{
              padding: '15px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'maquinas' ? '2px solid #2563eb' : 'none',
              color: activeTab === 'maquinas' ? '#2563eb' : '#6b7280',
              fontWeight: activeTab === 'maquinas' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            ⚙️ Máquinas
          </button>
          <button
            onClick={() => setActiveTab('costos-base')}
            style={{
              padding: '15px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'costos-base' ? '2px solid #2563eb' : 'none',
              color: activeTab === 'costos-base' ? '#2563eb' : '#6b7280',
              fontWeight: activeTab === 'costos-base' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            📊 Costos Base
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>
              {activeTab === 'materiales' && 'Gestión de Materiales'}
              {activeTab === 'empleados' && 'Gestión de Empleados'}
              {activeTab === 'maquinas' && 'Gestión de Máquinas'}
              {activeTab === 'costos-base' && 'Gestión de Costos Base'}
            </h3>
            {(
              <button
                onClick={abrirModalAgregar}
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ➞ Agregar Nuevo
              </button>
            )}
          </div>

          {/* Tabla de Materiales */}
          {activeTab === 'materiales' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Nombre</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Precio/m²</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Espesor</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Color</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {materiales.map(material => (
                  <tr key={material.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px' }}>{material.nombre}</td>
                    <td style={{ padding: '10px' }}>$ {material.precio_por_m2?.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{material.espesor}</td>
                    <td style={{ padding: '10px' }}>{material.color}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button
                        onClick={() => abrirModalEditar(material)}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => eliminarItem(material)}
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Tabla de Empleados */}
          {activeTab === 'empleados' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Nombre</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Tipo</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Tarifa/Hora</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map(empleado => (
                  <tr key={empleado.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px' }}>{empleado.nombre}</td>
                    <td style={{ padding: '10px' }}>{empleado.tipo}</td>
                    <td style={{ padding: '10px' }}>$ {empleado.tarifa_por_hora?.toLocaleString()}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button
                        onClick={() => abrirModalEditar(empleado)}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ Editar Tarifa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Tabla de Máquinas */}
          {activeTab === 'maquinas' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Nombre</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Costo/Hora</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Horas/Semana</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Vida Útil</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {maquinas.map(maquina => (
                  <tr key={maquina.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px' }}>{maquina.nombre}</td>
                    <td style={{ padding: '10px' }}>$ {Math.round(maquina.costo_por_hora || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{maquina.horas_semanales}</td>
                    <td style={{ padding: '10px' }}>{maquina.vida_util_meses} meses</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button
                        onClick={() => abrirModalEditar(maquina)}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => eliminarItem(maquina)}
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Lista de Costos Base */}
          {activeTab === 'costos-base' && (
            <div>
              <p style={{ marginBottom: '20px', color: '#6b7280' }}>
                Gestiona todos los costos fijos mensuales de tu negocio. Incluye costos predefinidos y personalizados.
              </p>
              
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Nombre</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Tipo</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Monto Mensual</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Estado</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Costos Base Predefinidos */}
                  {costosBase && [
                    { nombre: '💡 Luz', valor: costosBase.costos_fijos?.luz, tipo: 'Base', campo: 'luz', apiTipo: 'costo_fijo' },
                    { nombre: '🔥 Gas', valor: costosBase.costos_fijos?.gas, tipo: 'Base', campo: 'gas', apiTipo: 'costo_fijo' },
                    { nombre: '🌐 Internet', valor: costosBase.costos_fijos?.internet, tipo: 'Base', campo: 'internet', apiTipo: 'costo_fijo' },
                    { nombre: '📞 Teléfono', valor: costosBase.costos_fijos?.telefono, tipo: 'Base', campo: 'telefono', apiTipo: 'costo_fijo' },
                    { nombre: '🏠 Alquiler', valor: costosBase.costos_fijos?.alquiler, tipo: 'Base', campo: 'alquiler', apiTipo: 'costo_fijo' },
                    { nombre: '📋 Impuestos Fijos', valor: costosBase.costos_fijos?.impuestos_fijos, tipo: 'Base', campo: 'impuestos_fijos', apiTipo: 'costo_fijo' },
                    { nombre: '🤖 Manus', valor: costosBase.costos_fijos?.manus, tipo: 'Base', campo: 'manus', apiTipo: 'costo_fijo' },
                    { nombre: '🔧 Mantenimiento Básico', valor: costosBase.mantenimiento?.basico, tipo: 'Base', campo: 'basico', apiTipo: 'mantenimiento' },
                    { nombre: '💰 Reserva Reparaciones', valor: costosBase.mantenimiento?.reserva_reparaciones, tipo: 'Base', campo: 'reserva_reparaciones', apiTipo: 'mantenimiento' }
                  ].map((costo, index) => (
                    <tr key={`base-${index}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '10px' }}>{costo.nombre}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: '#e0e7ff',
                          color: '#1f2937'
                        }}>
                          {costo.tipo}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>$ {costo.valor?.toLocaleString()}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: '#d1fae5',
                          color: '#065f46'
                        }}>
                          Activo
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            // Abrir modal para editar costo base individual
                            setCostoBaseEditando({
                              campo: costo.campo,
                              nombre: costo.nombre,
                              valor: costo.valor || 0,
                              apiTipo: costo.apiTipo
                            });
                            setModalCostoBase(true);
                          }}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Costos Fijos Personalizados */}
                  {costosFijos.map(costo => (
                    <tr key={`custom-${costo.id}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '10px' }}>{costo.nombre}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: 
                            costo.categoria === 'impuesto' ? '#fef3c7' :
                            costo.categoria === 'membresia' ? '#dbeafe' :
                            costo.categoria === 'alquiler' ? '#fecaca' :
                            costo.categoria === 'servicio' ? '#d1fae5' : '#e5e7eb',
                          color: '#1f2937'
                        }}>
                          {costo.categoria.charAt(0).toUpperCase() + costo.categoria.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>$ {costo.monto_mensual?.toLocaleString()}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: costo.activo ? '#d1fae5' : '#fee2e2',
                          color: costo.activo ? '#065f46' : '#991b1b'
                        }}>
                          {costo.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          onClick={() => abrirModalEditar(costo)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '5px',
                            fontSize: '12px'
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => eliminarItem(costo)}
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Campo de Horas Mensuales */}
              <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', maxWidth: '400px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '10px' }}>⏰ Horas Mensuales Productivas</h4>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '15px' }}>
                  Total de horas de trabajo productivas por mes. Afecta el cálculo de costos indirectos por hora.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={formCostosBase.horas_mensuales}
                    onChange={(e) => setFormCostosBase({ ...formCostosBase, horas_mensuales: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                    placeholder="Ej: 630"
                  />
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>horas/mes</span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/costos-base', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          horas_mensuales: parseFloat(formCostosBase.horas_mensuales)
                        })
                      });
                      if (res.ok) {
                        mostrarMensaje('Horas mensuales actualizadas: ' + formCostosBase.horas_mensuales + ' horas/mes', 'success');
                        cargarDatos();
                      } else {
                        mostrarMensaje('Error al actualizar horas mensuales', 'error');
                      }
                    } catch (error) {
                      mostrarMensaje('Error: ' + error.message, 'error');
                    }
                  }}
                  style={{
                    marginTop: '15px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  💾 Guardar Horas Mensuales
                </button>
              </div>
            </div>
          )}

          {activeTab === 'costos-base-old' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Nombre</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Categoría</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Monto Mensual</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Estado</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {costosFijos.map(costo => (
                  <tr key={costo.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px' }}>{costo.nombre}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: 
                          costo.categoria === 'impuesto' ? '#fef3c7' :
                          costo.categoria === 'membresia' ? '#dbeafe' :
                          costo.categoria === 'alquiler' ? '#fecaca' :
                          costo.categoria === 'servicio' ? '#d1fae5' : '#e5e7eb',
                        color: '#1f2937'
                      }}>
                        {costo.categoria.charAt(0).toUpperCase() + costo.categoria.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>$ {costo.monto_mensual?.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: costo.activo ? '#d1fae5' : '#fee2e2',
                        color: costo.activo ? '#065f46' : '#991b1b'
                      }}>
                        {costo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button
                        onClick={() => abrirModalEditar(costo)}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => eliminarItem(costo)}
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal para Agregar/Editar */}
      {modalAbierto && (
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
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0 }}>
              {modoModal === 'agregar' ? '➥ Agregar' : '✏️ Editar'} {' '}
              {activeTab === 'materiales' && 'Material'}
              {activeTab === 'empleados' && 'Empleado'}
              {activeTab === 'maquinas' && 'Máquina'}
              {(activeTab === 'costos-fijos' || activeTab === 'costos-base') && 'Costo Fijo'}
            </h3>

            {/* Formulario de Material */}
            {activeTab === 'materiales' && (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre</label>
                  <input
                    type="text"
                    value={formMaterial.nombre}
                    onChange={(e) => setFormMaterial({ ...formMaterial, nombre: e.target.value })}
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
                    value={formMaterial.descripcion}
                    onChange={(e) => setFormMaterial({ ...formMaterial, descripcion: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      minHeight: '60px'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Precio por Unidad</label>
                    <input
                      type="number"
                      value={formMaterial.precio_por_m2}
                      onChange={(e) => setFormMaterial({ ...formMaterial, precio_por_m2: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Unidad</label>
                    <select
                      value={formMaterial.unidad_medida}
                      onChange={(e) => setFormMaterial({ ...formMaterial, unidad_medida: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="m²">m²</option>
                      <option value="ml">ml</option>
                      <option value="Gr">Gr</option>
                      <option value="U">U</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Espesor</label>
                    <input
                      type="text"
                      value={formMaterial.espesor}
                      onChange={(e) => setFormMaterial({ ...formMaterial, espesor: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Color</label>
                    <input
                      type="text"
                      value={formMaterial.color}
                      onChange={(e) => setFormMaterial({ ...formMaterial, color: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Categoría</label>
                  <input
                    type="text"
                    value={formMaterial.categoria}
                    onChange={(e) => setFormMaterial({ ...formMaterial, categoria: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Formulario de Empleado */}
            {activeTab === 'empleados' && (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre</label>
                  <input
                    type="text"
                    value={formEmpleado.nombre}
                    onChange={(e) => setFormEmpleado({ ...formEmpleado, nombre: e.target.value })}
                    disabled={modoModal === 'editar'}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: modoModal === 'editar' ? '#f3f4f6' : 'white'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tipo</label>
                  <select
                    value={formEmpleado.tipo}
                    onChange={(e) => setFormEmpleado({ ...formEmpleado, tipo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="operario">Operario</option>
                    <option value="operario_especializado">Operario Especializado</option>
                    <option value="propietario">Propietario</option>
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tarifa por Hora (ARS)</label>
                  <input
                    type="number"
                    value={formEmpleado.tarifa_por_hora}
                    onChange={(e) => setFormEmpleado({ ...formEmpleado, tarifa_por_hora: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Formulario de Máquina */}
            {activeTab === 'maquinas' && (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre</label>
                  <input
                    type="text"
                    value={formMaquina.nombre}
                    onChange={(e) => setFormMaquina({ ...formMaquina, nombre: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Costo Inicial (ARS)</label>
                  <input
                    type="number"
                    value={formMaquina.costo_inicial}
                    onChange={(e) => setFormMaquina({ ...formMaquina, costo_inicial: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Vida Útil (meses)</label>
                    <input
                      type="number"
                      value={formMaquina.vida_util_meses}
                      onChange={(e) => setFormMaquina({ ...formMaquina, vida_util_meses: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Horas/Semana</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formMaquina.horas_semanales}
                      onChange={(e) => setFormMaquina({ ...formMaquina, horas_semanales: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Costo Mantenimiento Mensual (ARS)</label>
                  <input
                    type="number"
                    value={formMaquina.costo_mantenimiento_mensual}
                    onChange={(e) => setFormMaquina({ ...formMaquina, costo_mantenimiento_mensual: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fecha de Compra</label>
                  <input
                    type="date"
                    value={formMaquina.fecha_compra}
                    onChange={(e) => setFormMaquina({ ...formMaquina, fecha_compra: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Formulario de Costo Fijo */}
            {(activeTab === 'costos-fijos' || activeTab === 'costos-base') && (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre del Costo</label>
                  <input
                    type="text"
                    value={formCostoFijo.nombre}
                    onChange={(e) => setFormCostoFijo({ ...formCostoFijo, nombre: e.target.value })}
                    placeholder="Ej: Impuesto Municipal, Alquiler Taller"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Categoría</label>
                  <select
                    value={formCostoFijo.categoria}
                    onChange={(e) => setFormCostoFijo({ ...formCostoFijo, categoria: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="servicio">Servicio</option>
                    <option value="impuesto">Impuesto</option>
                    <option value="membresia">Membresía</option>
                    <option value="alquiler">Alquiler</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Monto Mensual (ARS)</label>
                  <input
                    type="number"
                    value={formCostoFijo.monto_mensual}
                    onChange={(e) => setFormCostoFijo({ ...formCostoFijo, monto_mensual: e.target.value })}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descripción (opcional)</label>
                  <textarea
                    value={formCostoFijo.descripcion}
                    onChange={(e) => setFormCostoFijo({ ...formCostoFijo, descripcion: e.target.value })}
                    placeholder="Detalles adicionales sobre este costo"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      minHeight: '60px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formCostoFijo.activo}
                      onChange={(e) => setFormCostoFijo({ ...formCostoFijo, activo: e.target.checked })}
                      style={{
                        width: '18px',
                        height: '18px',
                        marginRight: '8px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontWeight: 'bold' }}>Activo (incluir en cálculos)</span>
                  </label>
                  <p style={{ margin: '5px 0 0 26px', fontSize: '12px', color: '#6b7280' }}>
                    Si está desactivado, este costo no se sumará en los cálculos
                  </p>
                </div>
              </div>
            )}

            {/* Botones del Modal */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={cerrarModal}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarItem}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar Costo Base Individual */}
      {modalCostoBase && (
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
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Editar {costoBaseEditando.nombre}</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Monto Mensual (ARS)
              </label>
              <input
                type="number"
                value={costoBaseEditando.valor || 0}
                onChange={(e) => setCostoBaseEditando({ ...costoBaseEditando, valor: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                placeholder="Ingrese el monto"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalCostoBase(false)}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    // Determinar la URL según el tipo
                    const url = costoBaseEditando.apiTipo === 'mantenimiento'
                      ? `/api/costos-base/mantenimiento/${costoBaseEditando.campo}`
                      : `/api/costos-base/costo-fijo/${costoBaseEditando.campo}`;
                    
                    const res = await fetch(url, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ valor: costoBaseEditando.valor })
                    });

                    if (res.ok) {
                      mostrarMensaje('✅ Costo actualizado exitosamente', 'exito');
                      setModalCostoBase(false);
                      // Recargar costos base
                      const resCostos = await fetch('/api/costos-base');
                      if (resCostos.ok) {
                        const costos = await resCostos.json();
                        setCostosBase(costos);
                      }
                    } else {
                      const error = await res.json();
                      mostrarMensaje(`❌ Error: ${error.error || 'No se pudo actualizar'}`, 'error');
                    }
                  } catch (error) {
                    console.error('Error al actualizar costo base:', error);
                    mostrarMensaje('❌ Error al actualizar costo base', 'error');
                  }
                }}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigPanel;
