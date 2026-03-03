# 🚀 Guía de Despliegue Fácil - Simplify.cnc

Esta guía te permitirá tener tu aplicación **en línea 24/7** de forma **GRATIS** en menos de 10 minutos.

---

## 📋 **Requisitos Previos**

- ✅ Una cuenta de GitHub (gratis)
- ✅ 10 minutos de tu tiempo
- ❌ NO necesitas saber programación
- ❌ NO necesitas configurar servidores

---

## 🎯 **Opción 1: Railway.app (Recomendado)**

### **Paso 1: Crear cuenta en Railway**

1. Ve a [https://railway.app](https://railway.app)
2. Haz clic en **"Start a New Project"**
3. Inicia sesión con tu cuenta de GitHub

### **Paso 2: Subir tu código a GitHub**

1. Ve a [https://github.com/new](https://github.com/new)
2. Nombre del repositorio: `simplify-cnc`
3. Marca como **Privado** (para que nadie más lo vea)
4. Haz clic en **"Create repository"**

5. En tu computadora, abre una terminal y ejecuta:

```bash
cd /ruta/a/calculadora-limpia
git remote add origin https://github.com/TU-USUARIO/simplify-cnc.git
git branch -M main
git push -u origin main
```

### **Paso 3: Desplegar en Railway**

1. En Railway, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona `simplify-cnc`
4. Railway detectará automáticamente que es una app Flask
5. Haz clic en **"Deploy"**

### **Paso 4: Configurar Variables de Entorno**

1. En Railway, ve a tu proyecto
2. Haz clic en **"Variables"**
3. Agrega estas variables:
   - `PORT`: `5000`
   - `FLASK_ENV`: `production`

### **Paso 5: Obtener tu URL**

1. Ve a **"Settings"** en Railway
2. En **"Domains"**, haz clic en **"Generate Domain"**
3. Tu app estará en: `https://simplify-cnc-production.up.railway.app`

---

## 🎯 **Opción 2: Render.com (Alternativa)**

### **Paso 1: Crear cuenta en Render**

1. Ve a [https://render.com](https://render.com)
2. Haz clic en **"Get Started"**
3. Inicia sesión con tu cuenta de GitHub

### **Paso 2: Subir código a GitHub**

(Mismo proceso que Railway - Paso 2)

### **Paso 3: Crear Web Service**

1. En Render, haz clic en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio `simplify-cnc`
4. Configura:
   - **Name**: `simplify-cnc`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`
   - **Plan**: `Free`

5. Haz clic en **"Create Web Service"**

### **Paso 4: Esperar el despliegue**

- Render tardará 3-5 minutos en construir y desplegar
- Tu URL será: `https://simplify-cnc.onrender.com`

---

## ✅ **Verificar que Funciona**

1. Abre la URL que te dieron (Railway o Render)
2. Deberías ver la pantalla de inicio de Simplify.cnc
3. Prueba hacer login con:
   - **Propietario**: `propietario123`
   - **Taller**: `taller123`

---

## 🔧 **Actualizar la Aplicación**

Cuando hagas cambios en el código:

```bash
cd /ruta/a/calculadora-limpia
git add -A
git commit -m "Descripción de los cambios"
git push
```

Railway o Render detectarán el cambio y **desplegarán automáticamente** la nueva versión.

---

## 💰 **Costos**

### **Railway.app**
- ✅ **Gratis**: 500 horas/mes (suficiente para uso normal)
- ✅ **$5/mes**: Uso ilimitado

### **Render.com**
- ✅ **Gratis**: Aplicación se "duerme" después de 15 min de inactividad
- ✅ **$7/mes**: Aplicación siempre activa

---

## 🆘 **Problemas Comunes**

### **"Application failed to respond"**
- Espera 2-3 minutos, la app está iniciando
- Verifica que las variables de entorno estén configuradas

### **"Build failed"**
- Verifica que `requirements.txt` esté en la raíz del proyecto
- Asegúrate de que `runtime.txt` especifique Python 3.11

### **"Database error"**
- La base de datos SQLite se creará automáticamente
- Los datos se perderán si la app se reinicia (normal en plan gratuito)

---

## 📞 **Soporte**

Si tienes problemas:
1. Revisa los logs en Railway/Render
2. Verifica que todos los archivos estén en GitHub
3. Asegúrate de que las variables de entorno estén configuradas

---

## 🎉 **¡Listo!**

Tu aplicación Simplify.cnc ahora está en línea 24/7 y accesible desde cualquier dispositivo con internet.

**URL de ejemplo:**
- Railway: `https://simplify-cnc-production.up.railway.app`
- Render: `https://simplify-cnc.onrender.com`

¡Disfruta de tu calculadora de costos en la nube! 🚀

