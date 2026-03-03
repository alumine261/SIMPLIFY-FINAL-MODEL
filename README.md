# 🏭 Simplify.cnc - Calculadora de Costos CNC

Sistema completo de gestión y cálculo de costos para talleres CNC.

---

## 📋 **Características**

### **✨ Calculadora de Costos**
- Cálculo preciso de costos de materiales, mano de obra y máquinas
- Múltiples empleados y máquinas por proyecto
- Factor de ganancia configurable
- Cotización de dólar actualizada automáticamente

### **📊 Panel de Configuración**
- **Materiales**: Gestión de materiales con precios en USD
- **Empleados**: Configuración de tarifas por hora
- **Máquinas**: Costos de depreciación, mantenimiento y energía
- **Costos Base**: Gestión de costos fijos mensuales (luz, gas, alquiler, etc.)

### **🔐 Control de Acceso**
- **Acceso de Propietario**: Acceso completo (calculadora + configuración + dashboard)
- **Acceso de Taller**: Solo calculadora de costos

### **💰 Gestión de Costos**
- Costos fijos base configurables
- Costos adicionales personalizables
- Horas mensuales productivas ajustables
- Cálculo automático de costos indirectos

---

## 🚀 **Despliegue Rápido**

### **Opción 1: Despliegue en la Nube (Recomendado)**

Lee la guía completa en: **[DESPLIEGUE_FACIL.md](./DESPLIEGUE_FACIL.md)**

**Resumen:**
1. Crea cuenta en [Railway.app](https://railway.app) o [Render.com](https://render.com)
2. Sube el código a GitHub
3. Conecta el repositorio
4. ¡Listo! Tu app estará en línea 24/7

### **Opción 2: Ejecución Local**

```bash
# 1. Clonar o descomprimir el proyecto
cd calculadora-limpia

# 2. Crear entorno virtual
python3.11 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Ejecutar la aplicación
python app.py

# 5. Abrir en navegador
# http://localhost:5000
```

---

## 🔧 **Tecnologías Utilizadas**

### **Backend**
- **Flask** 3.0.0 - Framework web
- **SQLAlchemy** 3.1.1 - ORM para base de datos
- **SQLite** - Base de datos
- **Gunicorn** 23.0.0 - Servidor WSGI para producción

### **Frontend**
- **React** 18.2.0 - Biblioteca de UI
- **Vite** 4.5.0 - Build tool
- **JavaScript** (ES6+)

---

## 📁 **Estructura del Proyecto**

```
calculadora-limpia/
├── app.py                      # Punto de entrada de la aplicación
├── requirements.txt            # Dependencias de Python
├── Procfile                    # Configuración para Render
├── railway.json                # Configuración para Railway
├── runtime.txt                 # Versión de Python
│
├── src/                        # Código fuente del backend
│   ├── main.py                 # Configuración principal de Flask
│   ├── models/                 # Modelos de base de datos
│   │   ├── calculadora.py      # Modelo de costos base
│   │   ├── costo_fijo.py       # Modelo de costos fijos adicionales
│   │   ├── empleado.py         # Modelo de empleados
│   │   └── material.py         # Modelo de materiales
│   ├── routes/                 # Rutas de la API
│   │   ├── calculadora.py      # Endpoints de cálculo
│   │   ├── costos_fijos.py     # Endpoints de costos fijos
│   │   ├── empleados.py        # Endpoints de empleados
│   │   └── materiales.py       # Endpoints de materiales
│   ├── services/               # Servicios
│   │   └── dolar_service.py    # Servicio de cotización de dólar
│   ├── static/                 # Archivos estáticos (frontend compilado)
│   └── database/               # Base de datos SQLite
│
├── frontend/                   # Código fuente del frontend
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   │   ├── MainApp.jsx     # Aplicación principal
│   │   │   └── ConfigPanel.jsx # Panel de configuración
│   │   └── main.jsx            # Punto de entrada de React
│   ├── package.json            # Dependencias de Node.js
│   └── vite.config.js          # Configuración de Vite
│
└── DESPLIEGUE_FACIL.md         # Guía de despliegue paso a paso
```

---

## 🔐 **Credenciales por Defecto**

### **Acceso de Propietario**
- **Contraseña**: `propietario123`
- **Acceso**: Completo (calculadora + configuración + dashboard)

### **Acceso de Taller**
- **Contraseña**: `taller123`
- **Acceso**: Solo calculadora

⚠️ **IMPORTANTE**: Cambia estas contraseñas en producción editando `src/main.py`

---

## 📊 **Cómo Usar**

### **1. Acceder a la Aplicación**
- Abre la URL de tu despliegue o `http://localhost:5000`
- Selecciona tipo de acceso (Propietario o Taller)
- Ingresa la contraseña

### **2. Configurar Costos Base** (Solo Propietario)
1. Haz clic en **⚙️ Configuración**
2. Ve a la pestaña **📊 Costos Base**
3. Edita los costos fijos mensuales (luz, gas, alquiler, etc.)
4. Ajusta las **Horas Mensuales Productivas**
5. Guarda los cambios

### **3. Agregar Materiales, Empleados y Máquinas**
1. En **Configuración**, ve a cada pestaña
2. Haz clic en **➕ Agregar**
3. Completa los datos
4. Guarda

### **4. Calcular un Proyecto**
1. En la pantalla principal, selecciona:
   - **Materiales** (con área en m²)
   - **Empleados** (con horas de trabajo)
   - **Máquinas** (con horas de uso)
2. Ajusta el **Factor de Ganancia** (por defecto 2.0)
3. Haz clic en **🧮 Calcular Precio**
4. Verás el desglose completo de costos y precio final

---

## 💡 **Conceptos Clave**

### **Costos Indirectos**
- Se calculan **solo sobre las horas de empleados**
- No se aplican a las horas de máquinas (ya incluyen sus costos)
- Fórmula: `(Costos Fijos Mensuales / Horas Mensuales) × Horas de Empleados`

### **Factor de Ganancia**
- Multiplicador del costo total
- Ejemplo: Factor 2.0 = 100% de ganancia
- Precio Final = Costo Total × Factor de Ganancia

### **Cotización de Dólar**
- Se actualiza automáticamente desde dolarapi.com
- Usa el dólar oficial (venta)
- Los materiales se ingresan en USD y se convierten a pesos

---

## 🔄 **Actualizar la Aplicación**

Si hiciste cambios en el código:

```bash
# 1. Compilar frontend (si modificaste React)
cd frontend
npm run build
cp -r dist/* ../src/static/

# 2. Hacer commit de los cambios
cd ..
git add -A
git commit -m "Descripción de los cambios"
git push

# Railway/Render desplegarán automáticamente
```

---

## 🐛 **Solución de Problemas**

### **La aplicación no inicia**
- Verifica que `requirements.txt` esté completo
- Asegúrate de que la variable `PORT` esté configurada
- Revisa los logs en Railway/Render

### **Error de base de datos**
- La base de datos se crea automáticamente al iniciar
- Si usas SQLite en Railway/Render, los datos se perderán al reiniciar

### **Costos indirectos muy altos**
- Verifica las **Horas Mensuales Productivas** en Costos Base
- Ajusta los costos fijos base (alquiler, reserva reparaciones, etc.)
- Elimina costos duplicados

---

## 📝 **Changelog**

### **Versión 2.0** (Noviembre 2024)
- ✅ Corrección de cálculo de costos indirectos (solo horas de empleados)
- ✅ Nueva pestaña de Costos Base unificada
- ✅ Campo de Horas Mensuales Productivas editable
- ✅ Dólar oficial en lugar de blue
- ✅ Preparado para despliegue en Railway/Render

### **Versión 1.0** (Inicial)
- ✅ Calculadora de costos básica
- ✅ Gestión de materiales, empleados y máquinas
- ✅ Panel de configuración
- ✅ Control de acceso

---

## 📄 **Licencia**

Este proyecto es de uso privado para Simplify.cnc.

---

## 🆘 **Soporte**

Para problemas o consultas:
1. Revisa la guía [DESPLIEGUE_FACIL.md](./DESPLIEGUE_FACIL.md)
2. Verifica los logs de la aplicación
3. Consulta la documentación de [Railway](https://docs.railway.app) o [Render](https://render.com/docs)

---

**Desarrollado para Simplify.cnc** 🏭

