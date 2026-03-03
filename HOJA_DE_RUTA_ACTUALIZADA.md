# HOJA DE RUTA - Simplify.cnc

**Última actualización:** 15 de Febrero de 2026  
**Estado actual:** FASE 1 COMPLETADA ✅ | Iniciando FASE 2

---

## 📋 CORRECCIONES INMEDIATAS

### ✅ FASE 1: Correcciones Básicas (COMPLETADA 100%)

#### ✅ 1.1 Botón "Dar de Alta Producto" desde Calculadora
- ✅ Agregar botón "💾 Guardar en Catálogo" en el resultado del cálculo
- ✅ Al hacer clic, abrir modal con datos precargados:
  - Nombre del producto (editable)
  - Precio calculado (readonly)
  - Descripción (editable)
  - Datos de cálculo guardados (materiales, empleados, máquinas)
- ✅ Guardar producto en catálogo con todos los datos

#### ✅ 1.2 Unidad de Medida en Materiales
- ✅ Agregar selector de unidad al crear/editar material
- ✅ Opciones: m², ml, Gr, U (Unidad)
- ✅ Mostrar unidad en la lista de materiales
- ✅ Validar que la unidad se guarde correctamente

#### ✅ 1.3 Corrección de Costos Base
- ✅ Revisar funcionalidad del panel de Costos Base
- ✅ Permitir editar las 600 horas mensuales
- ✅ Permitir agregar/editar/eliminar costos base
- ✅ Verificar que se guarden correctamente

#### ✅ 1.4 Recalculo Automático de Productos
- ✅ Cuando cambia el precio de un material usado en un producto del catálogo
- ✅ Cuando cambia la tarifa de un empleado usado en un producto
- ✅ Cuando cambia el costo de una máquina usada en un producto
- ✅ Recalcular automáticamente el precio del producto
- ✅ Mostrar notificación de productos actualizados

**📦 BACKUP:** PROYECTO_02_simplify_cnc_fase1_completa.tar.gz

---

## 📊 FASE 2: Sistema de KPIs Básicos (EN PROGRESO)

### 2.1 KPI: Horas Trabajadas vs Horas de Planta
- [ ] Calcular suma total de horas de empleados en todos los presupuestos aprobados
- [ ] Comparar con 600 horas de planta configuradas
- [ ] Mostrar:
  - Total horas trabajadas
  - Total horas de planta (600h)
  - Porcentaje de utilización
  - Diferencia (positiva o negativa)
- [ ] Gráfico de barras comparativo

### 2.2 KPI: Composición de Presupuestos
Para cada presupuesto aprobado, mostrar desglose:
- [ ] Costo en materiales ($)
- [ ] Depreciación de máquina ($)
- [ ] Dinero destinado a costos fijos ($)
- [ ] Dinero destinado a empleados ($)
- [ ] Ganancia ($)
- [ ] Gráfico de torta con porcentajes

---

## 💰 FASE 3: Sistema de Acumulados Mensuales

### 3.1 Configuración de Períodos Mensuales
- [ ] Definir período: del 28 de un mes al 27 del siguiente
- [ ] Calcular automáticamente el período actual
- [ ] Permitir navegar entre períodos anteriores

### 3.2 Acumulado de Materiales
- [ ] Sumar costo de materiales de todos los presupuestos aprobados del período
- [ ] Mostrar: "Dinero para reponer material: $X"
- [ ] Comparar con presupuesto de materiales (si existe)

### 3.3 Acumulado de Depreciación de Máquinas
- [ ] Sumar depreciación de máquinas de todos los presupuestos aprobados
- [ ] Mostrar: "Dinero para mantenimiento/compra de máquinas: $X"

### 3.4 Acumulado de Sueldos
- [ ] Sumar dinero generado para empleados en presupuestos aprobados
- [ ] Permitir cargar "Sueldos pagados realmente" del mes
- [ ] Comparar:
  - Generado para sueldos: $X
  - Pagado realmente: $Y
  - Diferencia: $Z (positivo = sobró, negativo = faltó)
- [ ] Mostrar si se usó ganancia para cubrir sueldos

### 3.5 Acumulado de Costos Fijos
- [ ] Sumar dinero generado para costos fijos en presupuestos
- [ ] Calcular total de costos fijos mensuales configurados
- [ ] Comparar:
  - Generado para costos fijos: $X
  - Costos fijos reales: $Y
  - Diferencia: $Z
- [ ] Mostrar si se usó ganancia para cubrir costos fijos

### 3.6 Cálculo de Ganancias Reales
- [ ] Ganancia base = suma de ganancias de presupuestos aprobados
- [ ] Ajustar por diferencia de sueldos (+ o -)
- [ ] Ajustar por diferencia de costos fijos (+ o -)
- [ ] Mostrar: "Ganancia Real del Período: $X"

---

## 📈 FASE 4: Dashboard de Ganancias Mensuales

### 4.1 Resumen Mensual (28 a 27)
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

### 4.2 Comparativa de Meses
- [ ] Tabla comparativa de últimos 3-6 meses
- [ ] Columnas: Mes, Facturado, Costos, Ganancia Real
- [ ] Gráfico de líneas de evolución

---

## 🏆 FASE 5: KPI de Productos

### 5.1 Productos Más Vendidos
- [ ] Contar cuántas veces aparece cada producto del catálogo en presupuestos aprobados
- [ ] Mostrar:
  - Top 10 productos más vendidos
  - Cantidad de veces vendido
  - Porcentaje sobre el total
- [ ] Gráfico de barras

### 5.2 Productos por Mes
- [ ] Para cada mes (28 a 27):
  - Listar productos vendidos
  - Cantidad de cada uno
  - Porcentaje sobre total del mes
- [ ] Gráfico de torta por mes

---

## 🗑️ FASE 6: Gestión de Presupuestos

### 6.1 Eliminar Presupuestos
- [ ] Verificar qué pasa al eliminar un presupuesto:
  - Si está en Borrador: eliminar sin afectar KPIs
  - Si está Aprobado: preguntar confirmación (afectará KPIs)
  - Si está Rechazado: eliminar sin afectar KPIs
- [ ] Actualizar KPIs automáticamente al eliminar

### 6.2 Historial de Cambios
- [ ] Registrar cuando se elimina un presupuesto aprobado
- [ ] Mostrar en log de auditoría

---

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN

### ✅ PRIORIDAD ALTA (COMPLETADA)
1. ✅ Botón "Guardar en Catálogo" desde calculadora
2. ✅ Unidad de medida en materiales
3. ✅ Corrección de Costos Base
4. ✅ Recalculo automático de productos

### 🔄 PRIORIDAD MEDIA (EN PROGRESO)
5. [ ] KPI: Horas Trabajadas vs Horas de Planta
6. [ ] KPI: Composición de Presupuestos
7. [ ] Sistema de Acumulados Mensuales (completo)

### ⏳ PRIORIDAD BAJA (PENDIENTE)
8. [ ] Dashboard de Ganancias Mensuales
9. [ ] KPI de Productos Más Vendidos
10. [ ] Gestión avanzada de eliminación de presupuestos

---

## 📝 NOTAS IMPORTANTES

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

Ejemplo:
- Ganancia Base: $100,000
- Generado para sueldos: $50,000 | Pagado: $45,000 → Diferencia: +$5,000
- Generado para costos fijos: $20,000 | Real: $25,000 → Diferencia: -$5,000
- **Ganancia Real = $100,000 + $5,000 - $5,000 = $100,000**

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### ✅ Fase 1: Correcciones Básicas (4/4 - 100%)
- ✅ 1.1 Botón "Guardar en Catálogo"
- ✅ 1.2 Unidad de Medida en Materiales
- ✅ 1.3 Corrección Costos Base
- ✅ 1.4 Recalculo Automático

### 🔄 Fase 2: KPIs Básicos (0/2 - 0%)
- [ ] 2.1 Horas Trabajadas vs Planta
- [ ] 2.2 Composición de Presupuestos

### ⏳ Fase 3: Acumulados Mensuales (0/6 - 0%)
- [ ] 3.1 Configuración de Períodos
- [ ] 3.2 Acumulado Materiales
- [ ] 3.3 Acumulado Depreciación
- [ ] 3.4 Acumulado Sueldos
- [ ] 3.5 Acumulado Costos Fijos
- [ ] 3.6 Ganancias Reales

### ⏳ Fase 4: Dashboard Mensual (0/2 - 0%)
- [ ] 4.1 Resumen Mensual
- [ ] 4.2 Comparativa de Meses

### ⏳ Fase 5: KPI Productos (0/2 - 0%)
- [ ] 5.1 Productos Más Vendidos
- [ ] 5.2 Productos por Mes

### ⏳ Fase 6: Gestión Avanzada (0/2 - 0%)
- [ ] 6.1 Eliminar Presupuestos
- [ ] 6.2 Historial de Cambios

---

## 📦 BACKUPS CREADOS

- **PROYECTO_00:** Sistema base inicial
- **PROYECTO_01:** FASE 1 parcial (items 1.1 y 1.2)
- **PROYECTO_02:** FASE 1 completa (4/4 items) ✅ ACTUAL

---

**Progreso Total:** 4/18 items completados (22%)  
**Siguiente objetivo:** FASE 2 - KPIs Básicos (2 items)
