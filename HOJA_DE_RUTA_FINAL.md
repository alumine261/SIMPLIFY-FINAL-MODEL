# 🗺️ HOJA DE RUTA COMPLETA - Simplify.cnc

**Fecha de actualización:** 20 de febrero de 2026  
**Progreso total:** 5/18 items (28%)

---

## ✅ **FASE 1: CORRECCIONES BÁSICAS (5/5 - 100% COMPLETADA)**

### ✅ 1.1 Botón "Guardar en Catálogo" desde Calculadora
- ✅ Botón "💾 Guardar en Catálogo" visible después del cálculo
- ✅ Modal con nombre, precio, descripción
- ✅ Guarda datos de cálculo en JSON para recalculo futuro
- ✅ Productos aparecen en catálogo

### ✅ 1.2 Unidad de Medida en Materiales
- ✅ Selector con opciones: m², ml, Gr, U
- ✅ Funciona en crear/editar materiales
- ✅ Base de datos actualizada
- ✅ Visualización en tabla

### ✅ 1.3 Corrección de Costos Base
- ✅ API completa funcionando
- ✅ Modal específico para editar costos base individuales
- ✅ Edición de horas mensuales (600)
- ✅ Guardado exitoso
- ✅ Bugs corregidos (modelo duplicado, cache, etc.)

### ✅ 1.4 Recalculo Automático de Productos
- ✅ Productos se actualizan cuando cambian precios de materiales
- ✅ Productos se actualizan cuando cambian tarifas de empleados
- ✅ Productos se actualizan cuando cambian costos de máquinas
- ✅ API devuelve cantidad de productos recalculados
- ✅ **PROBADO:** Funciona para materiales (2 productos), empleados (1 producto), máquinas (1 producto)

### ✅ 1.5 Corrección de Eliminación de Costos Fijos
- ✅ Eliminación permanente (hard delete)
- ✅ Actualización inmediata en interfaz

**📦 BACKUP:** `PROYECTO_02_FASE1_COMPLETA_20260220_011639.tar.gz` (57 MB)

---

## 🔄 **FASE 2: GENERACIÓN DE PDF DE PRESUPUESTOS PARA CLIENTES (0/3 - SIGUIENTE)**

**Prioridad:** ALTA - Sin esto no se pueden enviar presupuestos a clientes

### 2.1 Diseño de PDF Profesional
- [ ] Logo de Simplify.cnc
- [ ] Datos del cliente (nombre, contacto)
- [ ] Número de presupuesto y fecha
- [ ] Tabla de productos/servicios con precios unitarios
- [ ] Subtotal, IVA (opcional), Total
- [ ] Condiciones de pago y validez del presupuesto
- [ ] Pie de página con datos de contacto

### 2.2 Funcionalidad de Generación
- [ ] Botón "📄 Generar PDF" en cada presupuesto
- [ ] API backend usando ReportLab o WeasyPrint
- [ ] Descarga automática del PDF
- [ ] Nombre de archivo: `Presupuesto_[NumeroPresupuesto]_[Cliente].pdf`

### 2.3 Opciones Adicionales
- [ ] Previsualización del PDF antes de descargar
- [ ] Opción de envío por email (opcional para futuro)
- [ ] Plantilla personalizable (logo, colores, footer)

**Nota importante:** El PDF para clientes **NO incluye** desglose de costos internos (materiales, depreciación, sueldos, ganancias). Solo muestra productos/servicios con precios finales.

---

## 🔄 **FASE 3: KPIs BÁSICOS (0/2)**

### 3.1 KPI: Horas Trabajadas vs Horas de Planta
- [ ] Calcular suma total de horas de empleados en presupuestos aprobados
- [ ] Comparar con 600 horas de planta configuradas
- [ ] Mostrar: "Horas Trabajadas: X / Horas de Planta: 600"
- [ ] Indicador visual: verde si X < 600, rojo si X > 600
- [ ] Mostrar porcentaje de utilización: (X/600) * 100%

### 3.2 KPI: Composición de Presupuestos
- [ ] Total de presupuestos creados
- [ ] Presupuestos aprobados (cantidad y %)
- [ ] Presupuestos rechazados (cantidad y %)
- [ ] Presupuestos en borrador (cantidad y %)
- [ ] Gráfico de torta con distribución

---

## 🔄 **FASE 4: ACUMULADOS MENSUALES (0/2)**

### 4.1 Acumulado de Ventas Mensuales
- [ ] Selector de mes (del 28 al 27 del mes siguiente)
- [ ] Suma de todos los presupuestos aprobados del período
- [ ] Mostrar: "Facturado en [Mes]: $X"
- [ ] Comparativa con mes anterior

### 4.2 Acumulado de Costos y Ganancia Real
- [ ] Suma de costos de presupuestos aprobados del mes
- [ ] Suma de costos fijos mensuales
- [ ] Cálculo: Ganancia Real = Facturado - Costos Totales
- [ ] Mostrar desglose: facturado, costos variables, costos fijos, ganancia real
- [ ] Indicador visual: verde si ganancia > 0, rojo si ganancia < 0

---

## 🔄 **FASE 5: DASHBOARD MENSUAL (0/2)**

### 5.1 Resumen Mensual
- [ ] Selector de mes/año
- [ ] Mostrar: Presupuestos, Facturado, Costos, Ganancia Real
- [ ] Gráfico de evolución (últimos 6 meses)
- [ ] Tarjetas con KPIs principales

### 5.2 Comparativa de Meses
- [ ] Tabla comparativa últimos 3-6 meses
- [ ] Gráfico de líneas de evolución
- [ ] Indicadores de crecimiento/decrecimiento

---

## 🔄 **FASE 6: KPI PRODUCTOS (0/2)**

### 6.1 Productos Más Vendidos
- [ ] Top 10 productos más vendidos
- [ ] Cantidad vendida y porcentaje del total
- [ ] Gráfico de barras horizontal
- [ ] Filtro por período (mes/trimestre/año)

### 6.2 Productos por Mes
- [ ] Productos vendidos por mes (28 a 27)
- [ ] Cantidad y porcentaje
- [ ] Gráfico de torta
- [ ] Detalle de ingresos por producto

---

## 🔄 **FASE 7: GESTIÓN AVANZADA (0/2)**

### 7.1 Eliminar Presupuestos
- [ ] Lógica según estado:
  - Borrador: eliminación permanente
  - Aprobado: marcar como anulado (mantener en historial)
  - Rechazado: eliminación permanente
- [ ] Actualizar KPIs automáticamente después de eliminar

### 7.2 Historial de Cambios
- [ ] Log de auditoría de cambios en presupuestos
- [ ] Registro de eliminaciones y anulaciones
- [ ] Filtro por fecha y usuario
- [ ] Exportar historial a Excel

---

## 📦 **BACKUPS CREADOS**

| Backup | Fecha | Contenido | Tamaño |
|--------|-------|-----------|--------|
| PROYECTO_00 | - | Sistema base inicial | - |
| PROYECTO_01 | - | FASE 1 parcial (items 1.1 y 1.2) | - |
| **PROYECTO_02_FASE1_COMPLETA** | **20/02/2026** | **FASE 1 completa (5/5 items)** | **57 MB** |

---

## 🎯 **PRÓXIMO PASO**

**FASE 2: Generación de PDF de Presupuestos para Clientes**

Esta es la funcionalidad más crítica porque sin ella no podés enviar presupuestos profesionales a tus clientes. 

**¿Arrancamos con FASE 2?**
