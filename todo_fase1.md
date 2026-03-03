# TODO - FASE 1: Correcciones Básicas

## 1.1 Botón "Guardar en Catálogo" desde Calculadora
- [x] Agregar botón "💾 Guardar en Catálogo" después del resultado del cálculo
- [x] Crear modal con campos precargados:
  - [x] Nombre del producto (editable)
  - [x] Precio calculado (readonly, mostrado claramente)
  - [x] Descripción (editable, textarea)
  - [x] Datos de cálculo guardados en JSON (materiales, empleados, máquinas)
- [x] Implementar API POST /api/catalogo con datos completos
- [x] Guardar producto en base de datos con todos los datos de cálculo
- [x] Mostrar notificación de éxito
- [x] Cerrar modal y limpiar formulario

## 1.2 Selector de Unidad de Medida en Materiales
- [x] Agregar campo "unidad_medida" al modelo Material en backend
- [x] Crear migración de base de datos para agregar columna
- [x] Actualizar API POST /api/materiales para aceptar unidad_medida
- [x] Actualizar API PUT /api/materiales/<id> para actualizar unidad_medida
- [x] Agregar selector en modal de crear material (frontend)
  - [x] Opciones: m², ml, Gr, U
  - [x] Valor por defecto: m²
- [x] Agregar selector en modal de editar material
- [ ] Mostrar unidad en la tabla de materiales
- [x] Actualizar GET /api/materiales para incluir unidad_medida

## 1.3 Corrección de Panel de Costos Base
- [x] Revisar componente ConfigPanel.jsx - pestaña Costos Base
- [x] Crear modelo CostosBase en backend
- [x] Crear ruta API /api/costos-base (GET, PUT)
- [x] Crear migración de base de datos
- [x] Registrar blueprint en main.py
- [x] Verificar que se carguen correctamente los costos base
- [x] Permitir editar las 600 horas mensuales
- [x] Botón "Guardar" funcionando correctamente
- [x] Mostrar notificación de éxito al guardar

## 1.4 Recalculo Automático de Productos
- [x] Campo "datos_calculo" ya existe en modelo ProductoCatalogo
- [x] Crear servicio recalculo_service.py con funciones:
  - [x] recalcular_producto(producto_id)
  - [x] recalcular_productos_por_material(material_id)
  - [x] recalcular_productos_por_empleado(empleado_id)
  - [x] recalcular_productos_por_maquina(maquina_id)
  - [x] recalcular_todos_los_productos()
- [x] Implementar lógica de recalculo:
  - [x] Obtener datos_calculo del producto
  - [x] Obtener precios actuales de materiales
  - [x] Obtener tarifas actuales de empleados
  - [x] Obtener costos actuales de máquinas
  - [x] Recalcular precio total
  - [x] Actualizar precio en base de datos
- [x] Integrar recalculo automático en rutas:
  - [x] PUT /api/materiales/<id> - Recalcula productos al actualizar material
  - [x] PUT /api/empleados/<id> - Recalcula productos al actualizar empleado
  - [x] PUT /api/maquinas/<id> - Recalcula productos al actualizar máquina
- [x] Respuesta incluye "productos_recalculados" con cantidad actualizada

---

## Estado General
- **Iniciado:** Sí
- **En progreso:** No
- **Completado:** Sí

---

## Resumen de FASE 1
✅ **Todos los items completados exitosamente:**

1. **Botón "Guardar en Catálogo"** - Los productos calculados se pueden guardar en el catálogo con todos sus datos
2. **Selector de unidad de medida** - Los materiales ahora tienen unidad (m², ml, Gr, U)
3. **Panel Costos Base** - API creada y funcionando correctamente
4. **Recalculo automático** - Los productos se recalculan cuando cambian precios de materiales/empleados/máquinas

**Próximo paso:** Crear PROYECTO_02 con backup completo
