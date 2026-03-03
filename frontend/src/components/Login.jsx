import React, { useState, useEffect } from 'react';

const Login = ({ onLogin }) => {
  const [tipoAcceso, setTipoAcceso] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [paso, setPaso] = useState('seleccion'); // 'seleccion' | 'password' | 'empleado'
  const [empleados, setEmpleados] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

  const cargarEmpleados = async () => {
    try {
      const res = await fetch('/api/empleados');
      const data = await res.json();
      setEmpleados(data.filter(e => e.activo !== false));
    } catch (e) {
      setEmpleados([]);
    }
  };

  const handleLogin = async () => {
    if (!password) {
      setMensaje('Ingresá la contraseña');
      return;
    }
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoAcceso, password })
      });
      const data = await response.json();
      if (data.success) {
        if (tipoAcceso === 'taller') {
          // Guardar token temporalmente y pedir selección de empleado
          localStorage.setItem('token', data.token);
          localStorage.setItem('tipo_acceso', tipoAcceso);
          await cargarEmpleados();
          setPaso('empleado');
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('tipo_acceso', tipoAcceso);
          onLogin(tipoAcceso);
        }
      } else {
        setMensaje(data.error || 'Contraseña incorrecta');
      }
    } catch (error) {
      setMensaje('Error de conexión');
    }
  };

  const handleSeleccionEmpleado = (empleado) => {
    localStorage.setItem('empleado_id', empleado.id);
    localStorage.setItem('empleado_nombre', empleado.nombre);
    onLogin('taller');
  };

  // Paso: selección de tipo de acceso
  if (paso === 'seleccion') {
    return (
      <div style={{
        maxWidth: '500px', margin: '100px auto', padding: '30px',
        backgroundColor: 'white', borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#2563eb', color: 'white',
          padding: '20px', borderRadius: '8px', marginBottom: '30px'
        }}>
          <h1 style={{ margin: 0, fontSize: '28px' }}>🏭 Simplify.cnc</h1>
          <p style={{ margin: '10px 0 0 0', fontSize: '16px' }}>Sistema de Gestión</p>
        </div>

        <h2 style={{ color: '#374151', marginBottom: '20px' }}>Seleccioná tu acceso</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button
            onClick={() => { setTipoAcceso('taller'); setPaso('password'); }}
            style={{
              backgroundColor: '#0f766e', color: 'white', border: 'none',
              padding: '20px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '18px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            <span style={{ fontSize: '24px' }}>👷</span>
            <div style={{ textAlign: 'left' }}>
              <div>Acceso de Taller</div>
              <div style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.9 }}>
                Ver mis tareas y progreso
              </div>
            </div>
          </button>

          <button
            onClick={() => { setTipoAcceso('propietario'); setPaso('password'); }}
            style={{
              backgroundColor: '#8b5cf6', color: 'white', border: 'none',
              padding: '20px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '18px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            <span style={{ fontSize: '24px' }}>👑</span>
            <div style={{ textAlign: 'left' }}>
              <div>Acceso de Propietario</div>
              <div style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.9 }}>
                Acceso completo al sistema
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Paso: contraseña
  if (paso === 'password') {
    return (
      <div style={{
        maxWidth: '400px', margin: '100px auto', padding: '30px',
        backgroundColor: 'white', borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: tipoAcceso === 'propietario' ? '#8b5cf6' : '#0f766e',
          color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0 }}>
            {tipoAcceso === 'propietario' ? '👑 Propietario' : '👷 Taller'}
          </h2>
          <p style={{ margin: '10px 0 0', fontSize: '14px' }}>Ingresá la contraseña</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoFocus
            style={{
              width: '100%', padding: '12px', border: '1px solid #d1d5db',
              borderRadius: '4px', fontSize: '16px', boxSizing: 'border-box'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        {mensaje && (
          <div style={{
            backgroundColor: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', padding: '10px', borderRadius: '4px',
            marginBottom: '20px', fontSize: '14px'
          }}>
            {mensaje}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleLogin} style={{
            flex: 1, backgroundColor: tipoAcceso === 'propietario' ? '#8b5cf6' : '#0f766e',
            color: 'white', border: 'none', padding: '12px',
            borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
          }}>
            Ingresar
          </button>
          <button onClick={() => { setPaso('seleccion'); setPassword(''); setMensaje(''); }} style={{
            flex: 1, backgroundColor: '#6b7280', color: 'white', border: 'none',
            padding: '12px', borderRadius: '4px', cursor: 'pointer', fontSize: '16px'
          }}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Paso: selección de empleado (solo para taller)
  if (paso === 'empleado') {
    return (
      <div style={{
        maxWidth: '500px', margin: '80px auto', padding: '30px',
        backgroundColor: 'white', borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#0f766e', color: 'white',
          padding: '20px', borderRadius: '8px', marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0 }}>👷 ¿Quién sos?</h2>
          <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.9 }}>
            Seleccioná tu nombre para ver tus tareas
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {empleados.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No hay empleados registrados</p>
          ) : (
            empleados.map(emp => (
              <button
                key={emp.id}
                onClick={() => handleSeleccionEmpleado(emp)}
                style={{
                  backgroundColor: 'white', color: '#1f2937',
                  border: '2px solid #e5e7eb', padding: '16px 20px',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
                  fontWeight: '600', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#0f766e';
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <span style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  backgroundColor: '#0f766e', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', flexShrink: 0
                }}>
                  {emp.nombre.charAt(0).toUpperCase()}
                </span>
                <div>
                  <div>{emp.nombre}</div>
                  {emp.tarifa_hora && (
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}>
                      Empleado activo
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <button onClick={() => { setPaso('seleccion'); setPassword(''); setMensaje(''); }} style={{
          marginTop: '20px', backgroundColor: '#f3f4f6', color: '#374151',
          border: '1px solid #d1d5db', padding: '10px 24px',
          borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
        }}>
          ← Volver al inicio
        </button>
      </div>
    );
  }

  return null;
};

export default Login;
