# TODO - FASE 2: Generación de PDF de Presupuestos

## Backend
- [x] Agregar campo `numero_presupuesto` al modelo de presupuestos
- [x] Implementar lógica de numeración automática secuencial (0001, 0002, etc.)
- [x] Instalar librería ReportLab para generación de PDF
- [x] Crear servicio de generación de PDF con diseño profesional
- [x] Crear ruta API `/api/presupuestos/:id/pdf` para generar PDF
- [x] Incluir logo de Simplify.cnc en el PDF
- [x] Incluir datos del cliente en el PDF
- [x] Incluir tabla de productos con precios
- [x] Incluir totales y condiciones de pago
- [x] Migración de base de datos para agregar campo numero_presupuesto
- [x] Rediseñar PDF con paleta blanco/negro/azul celeste
- [x] Agregar logo de Simplify al PDF
- [x] Agregar slogan "Con SIMPLIFY es posible"
- [x] Actualizar datos de contacto (teléfono 3816082833, email, dirección Av. Colón 498)
- [x] Actualizar condiciones de pago (50% seña, efectivo/transferencia, fecha confirmada al dar de alta)
- [x] Cambiar validez a 7 días
- [x] Mejorar diseño profesional similar a referencia

## Frontend
- [x] Agregar botón "📄 Generar PDF" en cada presupuesto
- [x] Implementar descarga automática del PDF
- [x] Mostrar número de presupuesto en la lista de presupuestos
- [x] Mostrar número de presupuesto en el detalle del presupuesto

## Ajustes de diseño solicitados (primera ronda)
- [x] Logo a la izquierda a la misma altura que los datos de contacto
- [x] Datos de contacto a la derecha
- [x] Slogan más cerca del logo
- [x] Agregar etiquetas "Cel:" y "Mail:" en datos de contacto
- [x] Verificar origen de nombres de productos en la tabla (correcto: viene de items.descripcion)
- [x] Alinear signo "$" y valor a la misma altura que "TOTAL:"
- [x] Cambiar "CONDICIONES DE PAGO" por "FORMA DE PAGO"
- [x] Asegurar que todo entre en una sola página (márgenes reducidos)

## Correcciones adicionales (segunda ronda)
- [x] Corregir nombres de productos en descripción del PDF (busca por producto_id si no hay descripcion)
- [x] Mover slogan debajo del logo (no centrado en la página)
- [x] Alinear datos de contacto a la altura del logo (VALIGN TOP)
- [x] Agregar "Dirección:" antes de Av. Colón 498
- [x] Alinear "PRESUPUESTO" a la izquierda (no centrado)
- [x] Agregar pie de página con datos personales (Leandro Horacio Pérez Tello, CUIT: 20-38184952-0)
- [x] Cambiar azul celeste (#00BFFF) por azul potente (#1E3A8A)

## Ajustes finales del PDF
- [x] Bajar datos de contacto a la altura del logo (VALIGN TOP aplicado)
- [x] Acercar slogan al logo (BOTTOMPADDING reducido a 1)
- [x] Cambiar letras del encabezado de tabla a blanco (TEXTCOLOR BLANCO)
- [x] Mejorar búsqueda de nombres de productos (busca por ProductosFijos.nombre)
- [x] Separar pie de página en dos líneas (nombre en una, CUIT en otra con <br/>)

## Pruebas
- [x] Crear presupuesto y verificar numeración automática
- [x] Generar PDF y verificar diseño
- [x] Verificar que numeración sea secuencial
- [x] Probar con múltiples productos en un presupuesto
- [x] Probar nuevo diseño de PDF con logo y colores corporativos (47 KB, 1 página)
- [x] Probar PDF ajustado con feedback del usuario (47 KB, 1 página)
- [x] Probar PDF final con todas las correcciones (47 KB, 1 página, azul potente)
- [x] Probar PDF definitivo con ajustes finales (48 KB, 1 página)


## Correcciones finales pendientes (detectadas en PDF real)
- [ ] Alinear datos de contacto a la MISMA altura que el logo (actualmente están arriba)
- [ ] Reducir drásticamente el espacio entre logo y slogan (actualmente hay mucho espacio)
- [ ] Corregir búsqueda de nombres de productos (sigue mostrando "Producto ID 3" en lugar del nombre real)
