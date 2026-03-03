# HOJA DE RUTA REVISADA - Simplify.cnc

**Última actualización:** 16 de Febrero de 2026  
**Estado actual:** FASE 1 COMPLETADA ✅

---

## 📋 FASE 1: Correcciones Básicas ✅ COMPLETADA

### ✅ 1.1 Botón "Guardar en Catálogo" desde Calculadora
- ✅ Botón "💾 Guardar en Catálogo" visible después del cálculo
- ✅ Modal con nombre, precio, descripción
- ✅ Guarda datos de cálculo en JSON para recalculo futuro

### ✅ 1.2 Unidad de Medida en Materiales
- ✅ Selector con opciones: m², ml, Gr, U
- ✅ Funciona en crear/editar materiales
- ✅ Base de datos actualizada

### ✅ 1.3 Corrección de Costos Base
- ✅ API completa funcionando
- ✅ Edición de horas mensuales (600)
- ⚠️ **PENDIENTE:** Corrección de bugs en edición de costos fijos (cache del navegador)

### ✅ 1.4 Recalculo Automático de Productos
- ✅ Productos se actualizan cuando cambian precios de materiales
- ✅ Productos se actualizan cuando cambian tarifas de empleados
- ✅ Productos se actualizan cuando cambian costos de máquinas

**📦 BACKUP:** PROYECTO_02

---

## 📄 FASE 2: Generación de PDF de Presupuestos para Clientes (NUEVA - CRÍTICA)

### 2.1 Diseño de PDF Profesional
- [ ] Crear plantilla de PDF con logo de Simplify.cnc
- [ ] Incluir datos del cliente (nombre, contacto)
- [ ] Incluir número de presupuesto y fecha
- [ ] Tabla de items con:
  - Descripción del producto/servicio
  - Cantidad
  - Precio unitario
  - Subtotal
- [ ] Subtotal, IVA (opcional), Total
- [ ] Condiciones de pago y validez del presupuesto
- [ ] Datos de contacto del taller

### 2.2 Funcionalidad de Generación
- [ ] Botón "📄 Generar PDF" en cada presupuesto
- [ ] API backend para generar PDF (usando ReportLab o WeasyPrint)
- [ ] Descarga automática del PDF
- [ ] Guardar PDF en servidor (opcional)

### 2.3 Opciones Adicionales
- [ ] Botón "📧 Enviar por Email" (opcional, requiere configuración SMTP)
- [ ] Previsualización del PDF antes de descargar
- [ ] Opción de incluir/excluir desglose de costos

---

## 📊 FASE 3: Sistema de KPIs Básicos

### 3.1 KPI: Horas Trabajadas vs Horas de Planta
- [ ] Calcular suma total de horas de empleados en todos los presupuestos aprobados
- [ ] Comparar con 600 horas de planta configuradas
- [ ] Mostrar:
  - Total horas trabajadas
  - Total horas de planta (600h)
  - Porcentaje de utilización
  - Diferencia (positiva o negativa)
- [ ] Gráfico de barras comparativo

### 3.2 KPI: Composición de Presupuestos
Para cada presupuesto aprobado, mostrar desglose:
- [ ] Costo en materiales ($)
- [ ] Depreciación de máquina ($)
- [ ] Dinero destinado a costos fijos ($)
- [ ] Dinero destinado a empleados ($)
- [ ] Ganancia ($)
- [ ] Gráfico de torta con porcentajes

---

## 💰 FASE 4: Sistema de Acumulados Mensuales

### 4.1 Configuración de Períodos Mensuales
- [ ] Definir período: del 28 de un mes al 27 del siguiente
- [ ] Calcular automáticamente el período actual
- [ ] Permitir navegar entre períodos anteriores

### 4.2 Acumulado de Materiales
- [ ] Sumar costo de materiales de todos los presupuestos aprobados del período
- [ ] Mostrar: "Dinero para reponer material: $X"

### 4.3 Acumulado de Depreciación de Máquinas
- [ ] Sumar depreciación de máquinas de todos los presupuestos aprobados
- [ ] Mostrar: "Dinero para mantenimiento/compra de máquinas: $X"

### 4.4 Acumulado de Sueldos
- [ ] Sumar dinero generado para empleados en presupuestos aprobados
- [ ] Permitir cargar "Sueldos pagados realmente" del mes
- [ ] Comparar:
  - Generado para sueldos: $X
  - Pagado realmente: $Y
  - Diferencia: $Z (positivo = sobró, negativo = faltó)
- [ ] Mostrar si se usó ganancia para cubrir sueldos

### 4.5 Acumulado de Costos Fijos
- [ ] Sumar dinero generado para costos fijos en presupuestos
- [ ] Calcular total de costos fijos mensuales configurados
- [ ] Comparar:
  - Generado para costos fijos: $X
  - Costos fijos reales: $Y
  - Diferencia: $Z
- [ ] Mostrar si se usó ganancia para cubrir costos fijos

### 4.6 Cálculo de Ganancias Reales
- [ ] Ganancia base = suma de ganancias de presupuestos aprobados
- [ ] Ajustar por diferencia de sueldos (+ o -)
- [ ] Ajustar por diferencia de costos fijos (+ o -)
- [ ] Mostrar: "Ganancia Real del Período: $X"

---

## 📈 FASE 5: Dashboard de Ganancias Mensuales

### 5.1 Resumen Mensual (28 a 27)
- [ ] Selector de mes/año
- [ ] Mostrar para el período seleccionado:
  - Total presupuestos aprobados
  - Total facturado
  - Materiales usados
  - Depreciación de máquinas
  - Sueldos generados vs pagados
  - Costos fijos generados vs reales
  - **Ganancia Real del Mes**
- [ ] Gráfico de evolución mensual (últimos 6 meses)

### 5.2 Comparativa de Meses
- [ ] Tabla comparativa de últimos 3-6 meses
- [ ] Columnas: Mes, Facturado, Costos, Ganancia Real
- [ ] Gráfico de líneas de evolución

---

## 🏆 FASE 6: KPI de Productos

### 6.1 Productos Más Vendidos
- [ ] Contar cuántas veces aparece cada producto del catálogo en presupuestos aprobados
- [ ] Mostrar:
  - Top 10 productos más vendidos
  - Cantidad de veces vendido
  - Porcentaje sobre el total
- [ ] Gráfico de barras

### 6.2 Productos por Mes
- [ ] Para cada mes (28 a 27):
  - Listar productos vendidos
  - Cantidad de cada uno
  - Porcentaje sobre total del mes
- [ ] Gráfico de torta por mes

---

## 🗑️ FASE 7: Gestión Avanzada de Presupuestos

### 7.1 Eliminar Presupuestos
- [ ] Verificar qué pasa al eliminar un presupuesto:
  - Si está en Borrador: eliminar sin afectar KPIs
  - Si está Aprobado: preguntar confirmación (afectará KPIs)
  - Si está Rechazado: eliminar sin afectar KPIs
- [ ] Actualizar KPIs automáticamente al eliminar

### 7.2 Historial de Cambios
- [ ] Registrar cuando se elimina un presupuesto aprobado
- [ ] Mostrar en log de auditoría

---

## 🎯 PRIORIDADES REVISADAS

### ✅ PRIORIDAD CRÍTICA (COMPLETADA)
1. ✅ Botón "Guardar en Catálogo" desde calculadora
2. ✅ Unidad de medida en materiales
3. ✅ Corrección de Costos Base (con bugs menores pendientes)
4. ✅ Recalculo automático de productos

### 🔥 PRIORIDAD ALTA (HACER AHORA)
5. **📄 Generación de PDF de Presupuestos para Clientes** ← NUEVO Y CRÍTICO
   - Sin esto, no se pueden enviar presupuestos a clientes
   - Funcionalidad esencial para el negocio

### 📊 PRIORIDAD MEDIA (HACER DESPUÉS)
6. KPI: Horas Trabajadas vs Horas de Planta
7. KPI: Composición de Presupuestos
8. Sistema de Acumulados Mensuales (completo)

### 📈 PRIORIDAD BAJA (HACER AL FINAL)
9. Dashboard de Ganancias Mensuales
10. KPI de Productos Más Vendidos
11. Gestión avanzada de eliminación de presupuestos

---

## 📝 NOTAS IMPORTANTES

### Sobre la Generación de PDF
- **Dos salidas diferentes:**
  1. **PDF para Clientes:** Presupuesto limpio, profesional, sin desglose de costos internos
  2. **KPIs Internos:** Dashboard con desglose completo de costos, ganancias, etc.

- **Contenido del PDF para Clientes:**
  - Logo y datos del taller
  - Datos del cliente
  - Número de presupuesto y fecha
  - Lista de productos/servicios con precios
  - Total a pagar
  - Condiciones y validez
  - **NO incluir:** Costos de materiales, depreciación, sueldos, ganancias (eso es interno)

### Sobre el Período Mensual (28 a 27)
- El período se calcula automáticamente
- Ejemplo: 28/02/2026 00:00 hasta 27/03/2026 23:59
- Los presupuestos aprobados en ese rango se incluyen en el acumulado

### Sobre el Recalculo de Productos
- Solo se recalculan productos del catálogo
- Los presupuestos ya aprobados NO se recalculan (mantienen precio histórico)
- Se muestra notificación cuando un producto cambia de precio

### Sobre las Ganancias Reales
```
Ganancia Real = Ganancia Base + Diferencia Sueldos + Diferencia Costos Fijos

Donde:
- Diferencia Sueldos = Generado - Pagado (puede ser + o -)
- Diferencia Costos Fijos = Generado - Real (puede ser + o -)
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN ACTUALIZADO

### ✅ Fase 1: Correcciones Básicas (4/4 - 100%)
- ✅ 1.1 Botón "Guardar en Catálogo"
- ✅ 1.2 Unidad de Medida en Materiales
- ✅ 1.3 Corrección Costos Base
- ✅ 1.4 Recalculo Automático

### 📄 Fase 2: PDF de Presupuestos para Clientes (0/3 - 0%) ← SIGUIENTE
- [ ] 2.1 Diseño de PDF Profesional
- [ ] 2.2 Funcionalidad de Generación
- [ ] 2.3 Opciones Adicionales

### 📊 Fase 3: KPIs Básicos (0/2 - 0%)
- [ ] 3.1 Horas Trabajadas vs Planta
- [ ] 3.2 Composición de Presupuestos

### 💰 Fase 4: Acumulados Mensuales (0/6 - 0%)
- [ ] 4.1 Configuración de Períodos
- [ ] 4.2 Acumulado Materiales
- [ ] 4.3 Acumulado Depreciación
- [ ] 4.4 Acumulado Sueldos
- [ ] 4.5 Acumulado Costos Fijos
- [ ] 4.6 Ganancias Reales

### 📈 Fase 5: Dashboard Mensual (0/2 - 0%)
- [ ] 5.1 Resumen Mensual
- [ ] 5.2 Comparativa de Meses

### 🏆 Fase 6: KPI Productos (0/2 - 0%)
- [ ] 6.1 Productos Más Vendidos
- [ ] 6.2 Productos por Mes

### 🗑️ Fase 7: Gestión Avanzada (0/2 - 0%)
- [ ] 7.1 Eliminar Presupuestos
- [ ] 7.2 Historial de Cambios

---

## 📦 BACKUPS CREADOS

- **PROYECTO_00:** Sistema base inicial
- **PROYECTO_01:** FASE 1 parcial (items 1.1 y 1.2)
- **PROYECTO_02:** FASE 1 completa (4/4 items) ✅ ACTUAL

---

**Progreso Total:** 4/21 items completados (19%)  
**Siguiente objetivo:** FASE 2 - Generación de PDF de Presupuestos para Clientes (3 items)
