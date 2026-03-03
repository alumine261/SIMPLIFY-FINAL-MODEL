from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.taller import TrabajoPendiente, TareaEmpleado, MetricaEmpleadoPeriodo, MetricaEmpleadoAnual
from src.models.empleado import Empleado
from src.models.presupuesto import Presupuesto
from src.models.kpi import PeriodoKPI
from datetime import datetime, date
import json

taller_bp = Blueprint('taller', __name__)


def get_periodo_activo():
    """Obtiene el período KPI activo actual"""
    return PeriodoKPI.query.filter_by(cerrado=False).order_by(PeriodoKPI.id.desc()).first()


def actualizar_metrica_empleado(empleado_id, periodo_id, valor_delta, tarea_completada=False, trabajo_tarde=False):
    """Actualiza o crea la métrica de un empleado en el período actual"""
    metrica = MetricaEmpleadoPeriodo.query.filter_by(
        empleado_id=empleado_id,
        periodo_id=periodo_id
    ).first()

    if not metrica:
        metrica = MetricaEmpleadoPeriodo(
            empleado_id=empleado_id,
            periodo_id=periodo_id,
            valor_producido=0,
            tareas_completadas=0,
            trabajos_entregados_tarde=0
        )
        db.session.add(metrica)

    metrica.valor_producido += valor_delta
    if tarea_completada:
        metrica.tareas_completadas += 1
    if trabajo_tarde:
        metrica.trabajos_entregados_tarde += 1

    db.session.commit()
    return metrica


# --- TRABAJOS ----------------------------------------------------------------

@taller_bp.route('/api/taller/trabajos', methods=['GET'])
def listar_trabajos():
    """Lista todos los trabajos pendientes/en progreso"""
    try:
        estado = request.args.get('estado')
        empleado_id = request.args.get('empleado_id', type=int)

        query = TrabajoPendiente.query

        if estado:
            query = query.filter_by(estado=estado)

        trabajos = query.order_by(TrabajoPendiente.created_at.desc()).all()

        # Si se filtra por empleado, solo devolver trabajos que tengan tareas de ese empleado
        if empleado_id:
            trabajos = [t for t in trabajos if any(ta.empleado_id == empleado_id for ta in t.tareas)]

        return jsonify([t.to_dict() for t in trabajos])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@taller_bp.route('/api/taller/trabajos', methods=['POST'])
def crear_trabajo():
    """Crea un trabajo a partir de un item de presupuesto aprobado"""
    try:
        data = request.get_json()
        presupuesto_id = data.get('presupuesto_id')
        producto_nombre = data.get('producto_nombre')
        cantidad = data.get('cantidad', 1)
        fecha_entrega_str = data.get('fecha_entrega')
        valor_sueldo = data.get('valor_sueldo', 0)
        tareas_data = data.get('tareas', [])

        fecha_entrega = None
        if fecha_entrega_str:
            fecha_entrega = date.fromisoformat(fecha_entrega_str)

        trabajo = TrabajoPendiente(
            presupuesto_id=presupuesto_id,
            producto_nombre=producto_nombre,
            cantidad=cantidad,
            fecha_entrega=fecha_entrega,
            valor_sueldo=valor_sueldo,
            estado='pendiente'
        )
        db.session.add(trabajo)
        db.session.flush()  # Para obtener el ID

        # Crear las tareas asignadas
        for tarea_data in tareas_data:
            empleado_id = tarea_data.get('empleado_id')
            nombre_tarea = tarea_data.get('nombre_tarea', 'Tarea')
            horas_estimadas = tarea_data.get('horas_estimadas', 0)
            valor_sueldo_tarea = tarea_data.get('valor_sueldo_tarea', 0)
            compartida_con = tarea_data.get('compartida_con', '')

            tarea = TareaEmpleado(
                trabajo_id=trabajo.id,
                empleado_id=empleado_id,
                nombre_tarea=nombre_tarea,
                horas_estimadas=horas_estimadas,
                valor_sueldo_tarea=valor_sueldo_tarea,
                compartida_con=compartida_con,
                completada=False
            )
            db.session.add(tarea)

        db.session.commit()
        return jsonify(trabajo.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@taller_bp.route('/api/taller/trabajos/<int:trabajo_id>', methods=['GET'])
def obtener_trabajo(trabajo_id):
    try:
        trabajo = TrabajoPendiente.query.get(trabajo_id)
        if not trabajo:
            return jsonify({'error': 'Trabajo no encontrado'}), 404
        return jsonify(trabajo.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@taller_bp.route('/api/taller/trabajos/<int:trabajo_id>', methods=['PUT'])
def actualizar_trabajo(trabajo_id):
    """Actualiza fecha de entrega o estado de un trabajo"""
    try:
        trabajo = TrabajoPendiente.query.get(trabajo_id)
        if not trabajo:
            return jsonify({'error': 'Trabajo no encontrado'}), 404

        data = request.get_json()
        if 'fecha_entrega' in data and data['fecha_entrega']:
            trabajo.fecha_entrega = date.fromisoformat(data['fecha_entrega'])
        if 'estado' in data:
            trabajo.estado = data['estado']

        db.session.commit()
        return jsonify(trabajo.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@taller_bp.route('/api/taller/trabajos/<int:trabajo_id>', methods=['DELETE'])
def eliminar_trabajo(trabajo_id):
    try:
        trabajo = TrabajoPendiente.query.get(trabajo_id)
        if not trabajo:
            return jsonify({'error': 'Trabajo no encontrado'}), 404
        db.session.delete(trabajo)
        db.session.commit()
        return jsonify({'mensaje': 'Trabajo eliminado'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# --- TAREAS -------------------------------------------------------------------

@taller_bp.route('/api/taller/tareas/<int:tarea_id>/completar', methods=['POST'])
def completar_tarea(tarea_id):
    """Marca una tarea como completada por el empleado"""
    try:
        tarea = TareaEmpleado.query.get(tarea_id)
        if not tarea:
            return jsonify({'error': 'Tarea no encontrada'}), 404

        if tarea.completada:
            return jsonify({'error': 'La tarea ya fue completada'}), 400

        tarea.completada = True
        tarea.fecha_completada = datetime.utcnow()

        # Actualizar métrica del empleado en el período activo
        periodo = get_periodo_activo()
        if periodo:
            actualizar_metrica_empleado(
                empleado_id=tarea.empleado_id,
                periodo_id=periodo.id,
                valor_delta=tarea.valor_sueldo_tarea,
                tarea_completada=True
            )

        # Verificar si todas las tareas del trabajo están completadas
        trabajo = tarea.trabajo
        todas_completadas = all(t.completada for t in trabajo.tareas)
        if todas_completadas:
            # Verificar si se entregó tarde
            ahora = date.today()
            if trabajo.fecha_entrega and ahora > trabajo.fecha_entrega:
                trabajo.estado = 'tarde'
                # Registrar entrega tarde para todos los empleados del trabajo
                if periodo:
                    for t in trabajo.tareas:
                        metrica = MetricaEmpleadoPeriodo.query.filter_by(
                            empleado_id=t.empleado_id,
                            periodo_id=periodo.id
                        ).first()
                        if metrica:
                            metrica.trabajos_entregados_tarde += 1
            else:
                trabajo.estado = 'entregado'
            trabajo.fecha_entrega_real = datetime.utcnow()

        db.session.commit()
        return jsonify({
            'tarea': tarea.to_dict(),
            'trabajo': trabajo.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@taller_bp.route('/api/taller/tareas/<int:tarea_id>/descompletar', methods=['POST'])
def descompletar_tarea(tarea_id):
    """Deshace la completación de una tarea (solo propietario)"""
    try:
        tarea = TareaEmpleado.query.get(tarea_id)
        if not tarea:
            return jsonify({'error': 'Tarea no encontrada'}), 404

        if not tarea.completada:
            return jsonify({'error': 'La tarea no estaba completada'}), 400

        # Restar de la métrica
        periodo = get_periodo_activo()
        if periodo:
            actualizar_metrica_empleado(
                empleado_id=tarea.empleado_id,
                periodo_id=periodo.id,
                valor_delta=-tarea.valor_sueldo_tarea,
                tarea_completada=False
            )

        tarea.completada = False
        tarea.fecha_completada = None

        # Revertir estado del trabajo
        trabajo = tarea.trabajo
        if trabajo.estado in ('entregado', 'tarde'):
            trabajo.estado = 'en_progreso'
            trabajo.fecha_entrega_real = None

        db.session.commit()
        return jsonify({'tarea': tarea.to_dict(), 'trabajo': trabajo.to_dict()})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# --- MÉTRICAS -----------------------------------------------------------------

@taller_bp.route('/api/taller/metricas', methods=['GET'])
def obtener_metricas():
    """Obtiene métricas del período activo para todos los empleados"""
    try:
        periodo = get_periodo_activo()
        if not periodo:
            return jsonify({'error': 'No hay período activo'}), 404

        empleados = Empleado.query.filter_by(activo=True).all()
        resultado = []

        for emp in empleados:
            metrica = MetricaEmpleadoPeriodo.query.filter_by(
                empleado_id=emp.id,
                periodo_id=periodo.id
            ).first()

            if metrica:
                data = metrica.to_dict()
            else:
                data = {
                    'empleado_id': emp.id,
                    'empleado_nombre': emp.nombre,
                    'periodo_id': periodo.id,
                    'valor_producido': 0,
                    'sueldo_real_pagado': None,
                    'tareas_completadas': 0,
                    'trabajos_entregados_tarde': 0,
                    'ratio_produccion': None,
                    'estado_color': 'gris',
                    'recompensa_ganada': False,
                    'cerrado': False
                }

            # Calcular porcentaje de barra (meta: $300.000)
            META_SUELDO = 300000
            porcentaje_barra = min(100, round((data['valor_producido'] / META_SUELDO) * 100, 1))
            data['porcentaje_barra'] = porcentaje_barra
            data['meta_sueldo'] = META_SUELDO

            resultado.append(data)

        return jsonify({
            'periodo': periodo.to_dict() if hasattr(periodo, 'to_dict') else {'id': periodo.id},
            'metricas': resultado
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@taller_bp.route('/api/taller/metricas/empleado/<int:empleado_id>', methods=['GET'])
def obtener_metrica_empleado(empleado_id):
    """Obtiene métricas del período activo para un empleado específico"""
    try:
        periodo = get_periodo_activo()
        if not periodo:
            return jsonify({'error': 'No hay período activo'}), 404

        empleado = Empleado.query.get(empleado_id)
        if not empleado:
            return jsonify({'error': 'Empleado no encontrado'}), 404

        metrica = MetricaEmpleadoPeriodo.query.filter_by(
            empleado_id=empleado_id,
            periodo_id=periodo.id
        ).first()

        META_SUELDO = 300000

        if metrica:
            data = metrica.to_dict()
        else:
            data = {
                'empleado_id': empleado_id,
                'empleado_nombre': empleado.nombre,
                'periodo_id': periodo.id,
                'valor_producido': 0,
                'sueldo_real_pagado': None,
                'tareas_completadas': 0,
                'trabajos_entregados_tarde': 0,
                'ratio_produccion': None,
                'estado_color': 'gris',
                'recompensa_ganada': False,
                'cerrado': False
            }

        porcentaje_barra = min(100, round((data['valor_producido'] / META_SUELDO) * 100, 1))
        data['porcentaje_barra'] = porcentaje_barra
        data['meta_sueldo'] = META_SUELDO

        # Tareas pendientes del empleado
        tareas_pendientes = TareaEmpleado.query.filter_by(
            empleado_id=empleado_id,
            completada=False
        ).all()
        data['tareas_pendientes'] = [t.to_dict() for t in tareas_pendientes]

        # Tareas completadas del empleado en el período
        tareas_completadas = TareaEmpleado.query.filter_by(
            empleado_id=empleado_id,
            completada=True
        ).all()
        data['tareas_completadas_lista'] = [t.to_dict() for t in tareas_completadas]

        return jsonify(data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@taller_bp.route('/api/taller/metricas/empleado/<int:empleado_id>/sueldo', methods=['POST'])
def cargar_sueldo_empleado(empleado_id):
    """Carga el sueldo real pagado a un empleado en el período activo"""
    try:
        data = request.get_json()
        sueldo_real = data.get('sueldo_real')

        if sueldo_real is None or sueldo_real < 0:
            return jsonify({'error': 'Sueldo inválido'}), 400

        periodo = get_periodo_activo()
        if not periodo:
            return jsonify({'error': 'No hay período activo'}), 404

        metrica = MetricaEmpleadoPeriodo.query.filter_by(
            empleado_id=empleado_id,
            periodo_id=periodo.id
        ).first()

        if not metrica:
            metrica = MetricaEmpleadoPeriodo(
                empleado_id=empleado_id,
                periodo_id=periodo.id,
                valor_producido=0,
                tareas_completadas=0,
                trabajos_entregados_tarde=0
            )
            db.session.add(metrica)

        metrica.sueldo_real_pagado = sueldo_real

        # Verificar recompensa (ratio >= 1.5 y menos de 5 trabajos tarde)
        if metrica.ratio_produccion and metrica.ratio_produccion >= 1.5 and metrica.trabajos_entregados_tarde < 5:
            metrica.recompensa_ganada = True

        db.session.commit()
        return jsonify(metrica.to_dict())

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@taller_bp.route('/api/taller/metricas/cerrar-periodo', methods=['POST'])
def cerrar_periodo_taller():
    """Cierra el período de métricas de empleados y acumula al anual"""
    try:
        periodo = get_periodo_activo()
        if not periodo:
            return jsonify({'error': 'No hay período activo'}), 404

        metricas = MetricaEmpleadoPeriodo.query.filter_by(periodo_id=periodo.id).all()
        anio = datetime.utcnow().year

        for metrica in metricas:
            # Verificar recompensa final
            if metrica.ratio_produccion and metrica.ratio_produccion >= 1.5 and metrica.trabajos_entregados_tarde < 5:
                metrica.recompensa_ganada = True

            metrica.cerrado = True

            # Acumular al anual
            anual = MetricaEmpleadoAnual.query.filter_by(
                empleado_id=metrica.empleado_id,
                anio=anio
            ).first()

            if not anual:
                anual = MetricaEmpleadoAnual(
                    empleado_id=metrica.empleado_id,
                    anio=anio,
                    valor_producido_total=0,
                    sueldo_real_total=0,
                    tareas_completadas_total=0,
                    periodos_incluidos='[]',
                    recompensas_ganadas=0
                )
                db.session.add(anual)

            anual.valor_producido_total += metrica.valor_producido
            if metrica.sueldo_real_pagado:
                anual.sueldo_real_total += metrica.sueldo_real_pagado
            anual.tareas_completadas_total += metrica.tareas_completadas
            if metrica.recompensa_ganada:
                anual.recompensas_ganadas += 1

            periodos = json.loads(anual.periodos_incluidos)
            if periodo.id not in periodos:
                periodos.append(periodo.id)
            anual.periodos_incluidos = json.dumps(periodos)

        db.session.commit()
        return jsonify({'mensaje': 'Período de taller cerrado correctamente'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@taller_bp.route('/api/taller/metricas/anual', methods=['GET'])
def obtener_metricas_anuales():
    """Obtiene métricas anuales de todos los empleados"""
    try:
        anio = request.args.get('anio', datetime.utcnow().year, type=int)
        anuales = MetricaEmpleadoAnual.query.filter_by(anio=anio).all()
        return jsonify([a.to_dict() for a in anuales])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- PRESUPUESTOS APROBADOS PARA ASIGNAR -------------------------------------

@taller_bp.route('/api/taller/presupuestos-aprobados', methods=['GET'])
def presupuestos_aprobados():
    """Lista presupuestos aprobados con sus items para asignar al taller"""
    try:
        presupuestos = Presupuesto.query.filter_by(estado='aprobado').order_by(Presupuesto.created_at.desc()).all()
        resultado = []

        from src.models.producto_catalogo import ProductoCatalogo
        for p in presupuestos:
            items = json.loads(p.items) if p.items else []
            # Verificar si ya tiene trabajos asignados
            trabajos_existentes = TrabajoPendiente.query.filter_by(presupuesto_id=p.id).all()
            trabajos_ids = [t.id for t in trabajos_existentes]

            # Obtener nombre del cliente
            cliente_nombre = ''
            empresa = ''
            if p.cliente_id:
                from src.models.cliente import Cliente
                cliente = Cliente.query.get(p.cliente_id)
                if cliente:
                    cliente_nombre = cliente.nombre
                    empresa = getattr(cliente, 'empresa', '')

            # Resolver nombre_producto para cada item y verificar si ya tiene trabajo asignado
            items_enriquecidos = []
            for item in items:
                item_enriquecido = dict(item)
                if 'producto_id' in item and not item.get('nombre_producto'):
                    try:
                        prod_id = int(item['producto_id'])
                        producto = ProductoCatalogo.query.get(prod_id)
                        if producto:
                            item_enriquecido['nombre_producto'] = producto.nombre
                            # Incluir datos_calculo para obtener tareas predefinidas
                            if producto.datos_calculo:
                                dc = json.loads(producto.datos_calculo) if isinstance(producto.datos_calculo, str) else producto.datos_calculo
                                item_enriquecido['empleados_catalogo'] = dc.get('empleados', [])
                    except Exception:
                        pass
                if not item_enriquecido.get('nombre_producto'):
                    item_enriquecido['nombre_producto'] = item.get('descripcion') or f'Producto #{item.get("producto_id", "?")}'
                # Verificar si este item específico ya tiene trabajo asignado
                nombre_prod = item_enriquecido.get('nombre_producto', '')
                trabajo_del_item = None
                for t in trabajos_existentes:
                    if t.producto_nombre == nombre_prod:
                        trabajo_del_item = t
                        break
                if trabajo_del_item:
                    item_enriquecido['trabajo_asignado'] = True
                    item_enriquecido['trabajo_id'] = trabajo_del_item.id
                    item_enriquecido['trabajo_estado'] = trabajo_del_item.estado
                else:
                    item_enriquecido['trabajo_asignado'] = False
                    item_enriquecido['trabajo_id'] = None
                    item_enriquecido['trabajo_estado'] = None
                items_enriquecidos.append(item_enriquecido)

            resultado.append({
                'id': p.id,
                'numero': p.numero,
                'cliente': cliente_nombre,
                'empresa': empresa,
                'fecha': p.created_at.isoformat() if p.created_at else None,
                'items': items_enriquecidos,
                'trabajos_asignados': len(trabajos_existentes),
                'trabajos_ids': trabajos_ids
            })

        return jsonify(resultado)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- CATÁLOGO - NOMBRES DE TAREAS --------------------------------------------

@taller_bp.route('/api/taller/catalogo/<int:producto_id>/tareas', methods=['GET'])
def obtener_tareas_producto(producto_id):
    """Obtiene las tareas definidas para un producto del catálogo"""
    try:
        from src.models.producto_catalogo import ProductoCatalogo
        producto = ProductoCatalogo.query.get(producto_id)
        if not producto:
            return jsonify({'error': 'Producto no encontrado'}), 404

        dc = json.loads(producto.datos_calculo) if producto.datos_calculo else {}
        empleados = dc.get('empleados', [])

        tareas = []
        for i, emp in enumerate(empleados):
            tareas.append({
                'indice': i,
                'empleado_slot': f'Empleado {i+1}',
                'horas': emp.get('horas', 0),
                'nombre_tarea': emp.get('nombre_tarea', f'Tarea {i+1}')
            })

        return jsonify({'producto_id': producto_id, 'nombre': producto.nombre, 'tareas': tareas})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@taller_bp.route('/api/taller/catalogo/<int:producto_id>/tareas', methods=['PUT'])
def actualizar_tareas_producto(producto_id):
    """Actualiza los nombres de tareas de un producto del catálogo"""
    try:
        from src.models.producto_catalogo import ProductoCatalogo
        producto = ProductoCatalogo.query.get(producto_id)
        if not producto:
            return jsonify({'error': 'Producto no encontrado'}), 404

        data = request.get_json()
        nombres_tareas = data.get('nombres_tareas', [])  # lista de strings

        dc = json.loads(producto.datos_calculo) if producto.datos_calculo else {}
        empleados = dc.get('empleados', [])

        for i, nombre in enumerate(nombres_tareas):
            if i < len(empleados):
                empleados[i]['nombre_tarea'] = nombre

        dc['empleados'] = empleados
        producto.datos_calculo = json.dumps(dc)
        db.session.commit()

        return jsonify({'mensaje': 'Nombres de tareas actualizados', 'producto_id': producto_id})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# --- ENDPOINT PARA VISTA DE EMPLEADO -----------------------------------------

@taller_bp.route('/api/taller/empleado/<int:empleado_id>/tareas', methods=['GET'])
def tareas_del_empleado(empleado_id):
    """Devuelve las tareas pendientes y completadas de un empleado específico"""
    try:
        # Obtener todas las tareas de este empleado
        tareas = TareaEmpleado.query.filter_by(empleado_id=empleado_id).all()

        resultado = []
        for tarea in tareas:
            trabajo = TrabajoPendiente.query.get(tarea.trabajo_id)
            if not trabajo:
                continue
            resultado.append({
                'id': tarea.id,
                'trabajo_id': tarea.trabajo_id,
                'producto_nombre': trabajo.producto_nombre,
                'trabajo_nombre': trabajo.producto_nombre,  # alias para compatibilidad con TallerEmpleado
                'cantidad': trabajo.cantidad,
                'fecha_entrega': trabajo.fecha_entrega.isoformat() if trabajo.fecha_entrega else None,
                'estado_trabajo': trabajo.estado,
                'nombre_tarea': tarea.nombre_tarea,
                'horas_estimadas': tarea.horas_estimadas,
                'valor_sueldo_tarea': tarea.valor_sueldo_tarea,
                'compartida_con': tarea.compartida_con,
                'completada': tarea.completada,
                'fecha_completada': tarea.fecha_completada.isoformat() if tarea.fecha_completada else None
            })

        return jsonify(resultado)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- PDF DE MÉTRICAS ---------------------------------------------------------

# --- HISTÓRICO DE PERÍODOS CON MÉTRICAS ------------------------------------
@taller_bp.route('/api/taller/metricas/historico', methods=['GET'])
def obtener_metricas_historico():
    """Devuelve todos los períodos con sus métricas por empleado"""
    try:
        from src.models.kpi import PeriodoKPI
        periodos = PeriodoKPI.query.order_by(PeriodoKPI.id.desc()).all()
        resultado = []
        for periodo in periodos:
            metricas_periodo = MetricaEmpleadoPeriodo.query.filter_by(periodo_id=periodo.id).all()
            empleados_data = []
            for met in metricas_periodo:
                d = met.to_dict()
                empleados_data.append(d)
            resultado.append({
                'periodo_id': periodo.id,
                'periodo_nombre': periodo.nombre,
                'fecha_inicio': periodo.fecha_inicio.isoformat(),
                'fecha_cierre': periodo.fecha_cierre.isoformat(),
                'cerrado': periodo.cerrado,
                'metricas': empleados_data
            })
        return jsonify(resultado)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- PDF DE MÉTRICAS -------------------------------------------------------
@taller_bp.route('/api/taller/metricas/pdf', methods=['GET'])
def generar_pdf_metricas():
    """Genera un PDF con los períodos históricos y el acumulado anual"""
    try:
        from fpdf import FPDF
        from src.models.kpi import PeriodoKPI

        anio = datetime.utcnow().year

        # Obtener todos los períodos con sus métricas
        periodos_todos = PeriodoKPI.query.order_by(PeriodoKPI.id.asc()).all()
        empleados = Empleado.query.filter_by(activo=True).order_by(Empleado.nombre).all()

        # Métricas anuales
        metricas_anuales = MetricaEmpleadoAnual.query.filter_by(anio=anio).all()

        # Colores
        AZUL_OSCURO = (30, 58, 138)
        AZUL_CLARO = (219, 234, 254)

        def color_fila(estado_color):
            mapa = {
                'recompensa': (245, 243, 255),
                'verde': (240, 253, 244),
                'rojo': (254, 242, 242),
                'amarillo': (255, 251, 235),
            }
            return mapa.get(estado_color, (249, 250, 251))

        estado_labels = {
            'recompensa': 'RECOMPENSA',
            'verde': 'VERDE',
            'amarillo': 'AMARILLO',
            'rojo': 'ROJO',
            'gris': 'SIN SUELDO'
        }

        # Anchos de columna (suma = 190 para márgenes de 10 a cada lado)
        col_w = [36, 30, 30, 26, 22, 22, 24]
        col_w2 = [36, 34, 34, 28, 28, 30]
        MARGIN = 10

        pdf = FPDF()
        pdf.set_margins(MARGIN, MARGIN, MARGIN)
        pdf.set_auto_page_break(auto=True, margin=18)

        # ── PÁGINA 1: HEADER + PERÍODOS ──────────────────────────────────────
        pdf.add_page()

        # Header
        pdf.set_fill_color(*AZUL_OSCURO)
        pdf.rect(0, 0, 210, 38, 'F')
        pdf.set_text_color(255, 255, 255)
        pdf.set_font('Helvetica', 'B', 20)
        pdf.set_xy(MARGIN, 8)
        pdf.cell(0, 10, 'SIMPLIFY.CNC', ln=False)
        pdf.set_font('Helvetica', '', 11)
        pdf.set_xy(MARGIN, 21)
        pdf.cell(0, 7, 'Informe de Metricas del Taller', ln=True)
        pdf.set_text_color(180, 210, 255)
        pdf.set_font('Helvetica', '', 8)
        pdf.set_xy(MARGIN, 30)
        pdf.cell(0, 5, f'Generado: {datetime.utcnow().strftime("%d/%m/%Y %H:%M")}  |  Ano {anio}', ln=True)

        pdf.set_y(45)
        pdf.set_text_color(0, 0, 0)

        # ── SECCIONES POR PERÍODO ────────────────────────────────────────────
        if not periodos_todos:
            pdf.set_font('Helvetica', 'I', 10)
            pdf.set_fill_color(249, 250, 251)
            pdf.cell(0, 10, '  No hay periodos registrados aun.', ln=True, fill=True)
        else:
            for periodo in periodos_todos:
                # Título del período
                pdf.set_fill_color(*AZUL_OSCURO)
                pdf.set_text_color(255, 255, 255)
                pdf.set_font('Helvetica', 'B', 11)
                estado_txt = ' [CERRADO]' if periodo.cerrado else ' [EN CURSO]'
                pdf.cell(0, 9, f'  Periodo: {periodo.nombre}{estado_txt}', ln=True, fill=True)
                pdf.ln(2)

                # Obtener métricas de este período
                metricas_p = MetricaEmpleadoPeriodo.query.filter_by(periodo_id=periodo.id).all()
                met_por_emp = {m.empleado_id: m.to_dict() for m in metricas_p}

                # Header de tabla
                pdf.set_text_color(0, 0, 0)
                pdf.set_fill_color(*AZUL_CLARO)
                pdf.set_font('Helvetica', 'B', 8)
                headers = ['Empleado', 'Producido', 'Sueldo Pagado', 'Ratio', 'Tareas', 'Tarde', 'Estado']
                for i, h in enumerate(headers):
                    pdf.cell(col_w[i], 7, h, border=1, fill=True, align='C')
                pdf.ln()

                # Filas por empleado
                pdf.set_font('Helvetica', '', 8)
                for emp in empleados:
                    met = met_por_emp.get(emp.id)
                    if met:
                        color_estado = met.get('estado_color', 'gris')
                        pdf.set_fill_color(*color_fila(color_estado))
                        producido = f"${met.get('valor_producido', 0):,.0f}".replace(',', '.')
                        sueldo_val = met.get('sueldo_real_pagado')
                        sueldo = f"${sueldo_val:,.0f}".replace(',', '.') if sueldo_val else 'No cargado'
                        ratio_val = met.get('ratio_produccion')
                        ratio = f"{ratio_val:.2f}x" if ratio_val is not None else '-'
                        tareas = str(met.get('tareas_completadas', 0))
                        tarde = str(met.get('trabajos_entregados_tarde', 0))
                        estado = estado_labels.get(color_estado, color_estado.upper())
                    else:
                        pdf.set_fill_color(249, 250, 251)
                        producido = '$0'
                        sueldo = 'No cargado'
                        ratio = '-'
                        tareas = '0'
                        tarde = '0'
                        estado = 'SIN SUELDO'

                    row = [emp.nombre, producido, sueldo, ratio, tareas, tarde, estado]
                    for i, val in enumerate(row):
                        pdf.cell(col_w[i], 6, val, border=1, fill=True, align='C' if i > 0 else 'L')
                    pdf.ln()

                pdf.ln(5)

        # ── ACUMULADO ANUAL ──────────────────────────────────────────────────
        pdf.set_fill_color(*AZUL_OSCURO)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(0, 9, f'  Acumulado Anual {anio}', ln=True, fill=True)
        pdf.ln(2)
        pdf.set_text_color(0, 0, 0)

        if not metricas_anuales:
            pdf.set_font('Helvetica', 'I', 9)
            pdf.set_fill_color(249, 250, 251)
            pdf.cell(0, 9, '  El acumulado anual se genera al cerrar cada periodo mensual.', ln=True, fill=True)
        else:
            pdf.set_fill_color(*AZUL_CLARO)
            pdf.set_font('Helvetica', 'B', 8)
            headers2 = ['Empleado', 'Producido Total', 'Sueldo Total', 'Ratio Anual', 'Tareas', 'Recompensas']
            for i, h in enumerate(headers2):
                pdf.cell(col_w2[i], 7, h, border=1, fill=True, align='C')
            pdf.ln()
            pdf.set_font('Helvetica', '', 8)
            for anual in metricas_anuales:
                ratio_anual = anual.ratio_anual
                if ratio_anual is None:
                    pdf.set_fill_color(249, 250, 251)
                elif ratio_anual >= 1.5:
                    pdf.set_fill_color(245, 243, 255)
                elif ratio_anual > 1:
                    pdf.set_fill_color(240, 253, 244)
                elif ratio_anual == 1:
                    pdf.set_fill_color(255, 251, 235)
                else:
                    pdf.set_fill_color(254, 242, 242)
                nombre = anual.empleado_nombre
                producido = f"${anual.valor_producido_total:,.0f}".replace(',', '.')
                sueldo = f"${anual.sueldo_real_total:,.0f}".replace(',', '.')
                ratio = f"{ratio_anual:.2f}x" if ratio_anual is not None else '-'
                tareas = str(anual.tareas_completadas_total)
                recomp = str(anual.recompensas_ganadas) if anual.recompensas_ganadas > 0 else '-'
                row = [nombre, producido, sueldo, ratio, tareas, recomp]
                for i, val in enumerate(row):
                    pdf.cell(col_w2[i], 6, val, border=1, fill=True, align='C' if i > 0 else 'L')
                pdf.ln()

        pdf.ln(6)

        # ── LEYENDA ──────────────────────────────────────────────────────────
        pdf.set_fill_color(248, 250, 252)
        pdf.set_font('Helvetica', 'B', 8)
        pdf.cell(0, 7, '  Leyenda de estados:', ln=True, fill=True)
        pdf.set_font('Helvetica', '', 8)
        leyenda = [
            ('SIN SUELDO', 'No se cargo el sueldo real del periodo'),
            ('ROJO', 'Produjo menos de lo que cobro (ratio < 1)'),
            ('AMARILLO', 'Produjo igual a lo que cobro (ratio = 1)'),
            ('VERDE', 'Produjo mas de lo que cobro (ratio > 1)'),
            ('RECOMPENSA', 'Ratio >= 1.5x con menos de 5 trabajos tarde (1 jornada de 6hs)'),
        ]
        for estado, desc in leyenda:
            pdf.set_fill_color(248, 250, 252)
            pdf.cell(32, 5, f'  {estado}:', fill=True)
            pdf.cell(0, 5, desc, ln=True, fill=True)

        # ── FOOTER ───────────────────────────────────────────────────────────
        pdf.set_y(-18)
        pdf.set_fill_color(*AZUL_OSCURO)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font('Helvetica', '', 7)
        pdf.cell(0, 10,
            f'  Simplify.CNC - Informe generado el {datetime.utcnow().strftime("%d/%m/%Y a las %H:%M")}  |  Documento interno - No distribuir',
            fill=True, align='C')

        # Generar bytes
        pdf_bytes = pdf.output(dest='S').encode('latin-1')

        from flask import Response
        nombre_archivo = f'metricas_taller_{anio}.pdf'
        return Response(
            pdf_bytes,
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename="{nombre_archivo}"',
                'Content-Length': str(len(pdf_bytes))
            }
        )
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500
