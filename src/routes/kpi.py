from flask import Blueprint, jsonify, request, send_file
from src.models.user import db
from src.models.kpi import PeriodoKPI, ResumenAnualKPI
from src.models.presupuesto import Presupuesto
from src.models.producto_catalogo import ProductoCatalogo
from src.models.costo_fijo import CostoFijo
from src.services.kpi_pdf_service import generar_pdf_kpi
from datetime import date, datetime, timedelta
import json

kpi_bp = Blueprint('kpi', __name__)


def calcular_fecha_periodo(hoy=None):
    """Calcula las fechas de inicio y cierre del período actual (28 al 27)"""
    if hoy is None:
        hoy = date.today()
    
    if hoy.day >= 28:
        # Estamos en los días 28-31: el período inicia hoy (día 28) y cierra el 27 del mes siguiente
        inicio = date(hoy.year, hoy.month, 28)
        if hoy.month == 12:
            cierre = date(hoy.year + 1, 1, 27)
        else:
            cierre = date(hoy.year, hoy.month + 1, 27)
    else:
        # Estamos en los días 1-27: el período inició el 28 del mes anterior
        if hoy.month == 1:
            inicio = date(hoy.year - 1, 12, 28)
        else:
            inicio = date(hoy.year, hoy.month - 1, 28)
        cierre = date(hoy.year, hoy.month, 27)
    
    return inicio, cierre


def nombre_periodo(inicio, cierre):
    """Genera el nombre del período, ej: 'Ene-Feb 2026'"""
    meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
             'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    if inicio.month == cierre.month:
        return f"{meses[inicio.month - 1]} {inicio.year}"
    return f"{meses[inicio.month - 1]}-{meses[cierre.month - 1]} {cierre.year}"


def recalcular_periodo(periodo):
    """Recalcula todos los valores de un período a partir de los presupuestos aprobados"""
    inicio_dt = datetime.combine(periodo.fecha_inicio, datetime.min.time())
    cierre_dt = datetime.combine(periodo.fecha_cierre, datetime.max.time())

    presupuestos = Presupuesto.query.filter(
        Presupuesto.estado == 'aprobado',
        Presupuesto.fecha_aprobacion >= inicio_dt,
        Presupuesto.fecha_aprobacion <= cierre_dt
    ).all()

    # Todos los presupuestos creados O aprobados en el período
    from sqlalchemy import or_
    todos_presupuestos = Presupuesto.query.filter(
        or_(
            (Presupuesto.created_at >= inicio_dt) & (Presupuesto.created_at <= cierre_dt),
            (Presupuesto.fecha_aprobacion >= inicio_dt) & (Presupuesto.fecha_aprobacion <= cierre_dt)
        )
    ).all()

    total_vendido = 0
    total_materiales = 0
    total_sueldos = 0
    total_maquinas = 0
    total_costos_indirectos = 0
    total_ganancia = 0

    for pres in presupuestos:
        if not pres.items:
            continue
        items = json.loads(pres.items)
        for item in items:
            cantidad = float(item.get('cantidad', 1))
            precio_unit = float(item.get('precio_unitario', 0))
            descuento_pct = float(item.get('descuento', 0))
            precio_neto = precio_unit * (1 - descuento_pct / 100)

            # Usar snapshot guardado en el item (valores al momento de crear el presupuesto)
            # Si no existe snapshot, intentar obtener del catálogo actual como fallback
            snap_x = item.get('snapshot_x')
            snap_y = item.get('snapshot_y')
            snap_z = item.get('snapshot_z')
            snap_t = item.get('snapshot_t')
            snap_g = item.get('snapshot_g')

            if snap_x is None:  # No tiene snapshot, usar catálogo actual como fallback
                producto_id = item.get('producto_id')
                if not producto_id:
                    continue
                try:
                    producto = ProductoCatalogo.query.get(int(producto_id))
                except Exception:
                    continue
                if not producto or not producto.datos_calculo:
                    # Si no hay catálogo, distribuir proporcionalmente desde precio_unitario
                    total_vendido += precio_neto * cantidad
                    continue
                datos = json.loads(producto.datos_calculo)
                resultado = datos.get('resultado', {})
                precio_catalogo = resultado.get('precio_final', precio_unit) or precio_unit
                # Calcular factor de escala para ajustar al precio real del presupuesto
                factor = (precio_neto / precio_catalogo) if precio_catalogo else 1
                snap_x = (resultado.get('costo_materiales', 0) or 0) * factor
                snap_y = (resultado.get('costo_mano_obra', 0) or 0) * factor
                snap_z = (resultado.get('costo_maquinas', 0) or 0) * factor
                snap_t = (resultado.get('costos_indirectos', 0) or 0) * factor
                snap_g = (resultado.get('ganancia', 0) or 0) * factor

            # Acumular usando precio_unitario real del presupuesto (no precio_final del catálogo)
            total_vendido += precio_neto * cantidad
            total_materiales += float(snap_x) * cantidad
            total_sueldos += float(snap_y) * cantidad
            total_maquinas += float(snap_z) * cantidad
            total_costos_indirectos += float(snap_t) * cantidad
            total_ganancia += float(snap_g) * cantidad

    # Costos indirectos reales = suma de todos los costos fijos de CostosBase
    from src.models.calculadora import CostosBase
    costos_base = CostosBase.query.first()
    if costos_base:
        costos_indirectos_reales = (
            (costos_base.luz or 0) +
            (costos_base.gas or 0) +
            (costos_base.internet or 0) +
            (costos_base.telefono or 0) +
            (costos_base.alquiler or 0) +
            (costos_base.impuestos_fijos or 0) +
            (costos_base.manus or 0) +
            (costos_base.mantenimiento_basico or 0) +
            (costos_base.reserva_reparaciones or 0)
        )
        # Sumar costos fijos adicionales si existen
        costos_adicionales = CostoFijo.query.filter_by(activo=True).all()
        costos_indirectos_reales += sum(c.monto_mensual for c in costos_adicionales)
    else:
        costos_indirectos_reales = 0.0

    periodo.total_vendido = round(total_vendido, 2)
    periodo.total_materiales = round(total_materiales, 2)
    periodo.total_sueldos_presupuestados = round(total_sueldos, 2)
    periodo.total_maquinas = round(total_maquinas, 2)
    periodo.total_costos_indirectos_presupuestados = round(total_costos_indirectos, 2)
    periodo.total_ganancia_presupuestada = round(total_ganancia, 2)
    periodo.costos_indirectos_reales = round(costos_indirectos_reales, 2)

    periodo.cantidad_presupuestos_aprobados = len(presupuestos)
    periodo.cantidad_presupuestos_generados = len(todos_presupuestos)
    periodo.cantidad_presupuestos_rechazados = sum(
        1 for p in todos_presupuestos if p.estado == 'rechazado'
    )


def get_or_create_periodo_actual():
    """Obtiene o crea el período KPI actual — siempre devuelve el período abierto más reciente"""
    # Primero buscar si hay algún período abierto (no cerrado)
    periodo_abierto = PeriodoKPI.query.filter_by(cerrado=False).order_by(PeriodoKPI.fecha_inicio.asc()).first()
    if periodo_abierto:
        return periodo_abierto
    
    # Si todos están cerrados, crear el período siguiente al último cerrado
    ultimo_cerrado = PeriodoKPI.query.filter_by(cerrado=True).order_by(PeriodoKPI.fecha_cierre.desc()).first()
    if ultimo_cerrado:
        # El nuevo período empieza el día 28 del mes siguiente al cierre
        from datetime import date as date_type
        nueva_inicio = date_type(ultimo_cerrado.fecha_cierre.year, ultimo_cerrado.fecha_cierre.month, 28)
        if nueva_inicio.month == 12:
            nueva_cierre = date_type(nueva_inicio.year + 1, 1, 27)
        else:
            nueva_cierre = date_type(nueva_inicio.year, nueva_inicio.month + 1, 27)
    else:
        # No hay períodos, calcular desde hoy
        nueva_inicio, nueva_cierre = calcular_fecha_periodo()
    
    periodo = PeriodoKPI(
        nombre=nombre_periodo(nueva_inicio, nueva_cierre),
        fecha_inicio=nueva_inicio,
        fecha_cierre=nueva_cierre,
        cerrado=False
    )
    db.session.add(periodo)
    db.session.commit()
    return periodo


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@kpi_bp.route('/kpi/periodo-actual', methods=['GET'])
def get_periodo_actual():
    """Devuelve los KPIs del período actual recalculados en tiempo real"""
    try:
        periodo = get_or_create_periodo_actual()
        recalcular_periodo(periodo)
        db.session.commit()
        return jsonify(periodo.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@kpi_bp.route('/kpi/periodos', methods=['GET'])
def get_periodos():
    """Lista todos los períodos (histórico)"""
    try:
        periodos = PeriodoKPI.query.order_by(PeriodoKPI.fecha_inicio.desc()).all()
        return jsonify([p.to_dict() for p in periodos])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@kpi_bp.route('/kpi/periodo/<int:periodo_id>', methods=['GET'])
def get_periodo(periodo_id):
    """Devuelve un período específico"""
    try:
        periodo = PeriodoKPI.query.get_or_404(periodo_id)
        return jsonify(periodo.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@kpi_bp.route('/kpi/periodo/<int:periodo_id>/sueldo-real', methods=['POST'])
def cargar_sueldo_real(periodo_id):
    """Carga el sueldo real pagado en un período (se hace el día 28)"""
    try:
        data = request.get_json()
        monto = float(data.get('monto', 0))
        periodo = PeriodoKPI.query.get_or_404(periodo_id)
        periodo.sueldo_real_pagado = monto
        db.session.commit()
        return jsonify({'ok': True, 'periodo': periodo.to_dict()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@kpi_bp.route('/kpi/periodo/<int:periodo_id>/cerrar', methods=['POST'])
def cerrar_periodo(periodo_id):
    """
    Cierra el período mensual:
    1. Recalcula todos los valores finales
    2. Suma al resumen anual
    3. Marca el período como cerrado
    """
    try:
        periodo = PeriodoKPI.query.get_or_404(periodo_id)
        if periodo.cerrado:
            return jsonify({'error': 'El período ya está cerrado'}), 400

        # Recalcular valores finales
        recalcular_periodo(periodo)

        # Determinar el año del período
        anio = periodo.fecha_cierre.year

        # Obtener o crear resumen anual
        resumen = ResumenAnualKPI.query.filter_by(anio=anio).first()
        if not resumen:
            resumen = ResumenAnualKPI(anio=anio, periodos_incluidos='[]')
            db.session.add(resumen)

        # Acumular en el resumen anual
        resumen.total_vendido = round((resumen.total_vendido or 0) + periodo.total_vendido, 2)
        resumen.total_materiales = round((resumen.total_materiales or 0) + periodo.total_materiales, 2)
        resumen.total_sueldos_presupuestados = round((resumen.total_sueldos_presupuestados or 0) + periodo.total_sueldos_presupuestados, 2)
        resumen.total_maquinas = round((resumen.total_maquinas or 0) + periodo.total_maquinas, 2)
        resumen.total_costos_indirectos_presupuestados = round((resumen.total_costos_indirectos_presupuestados or 0) + periodo.total_costos_indirectos_presupuestados, 2)
        resumen.total_ganancia_presupuestada = round((resumen.total_ganancia_presupuestada or 0) + periodo.total_ganancia_presupuestada, 2)
        resumen.sueldo_real_pagado = round((resumen.sueldo_real_pagado or 0) + (periodo.sueldo_real_pagado or 0), 2)
        resumen.costos_indirectos_reales = round((resumen.costos_indirectos_reales or 0) + (periodo.costos_indirectos_reales or 0), 2)
        resumen.cantidad_presupuestos_generados = (resumen.cantidad_presupuestos_generados or 0) + periodo.cantidad_presupuestos_generados
        resumen.cantidad_presupuestos_aprobados = (resumen.cantidad_presupuestos_aprobados or 0) + periodo.cantidad_presupuestos_aprobados
        resumen.cantidad_presupuestos_rechazados = (resumen.cantidad_presupuestos_rechazados or 0) + periodo.cantidad_presupuestos_rechazados

        # Registrar período en la lista del resumen anual
        ids = json.loads(resumen.periodos_incluidos or '[]')
        if periodo_id not in ids:
            ids.append(periodo_id)
        resumen.periodos_incluidos = json.dumps(ids)

        # Cerrar el período
        periodo.cerrado = True
        periodo.fecha_cerrado = datetime.utcnow()

        # Crear automáticamente el nuevo período siguiente
        nueva_inicio = periodo.fecha_cierre + timedelta(days=1)  # día 28 del mes siguiente
        # Asegurar que sea exactamente el día 28
        from datetime import date as date_type
        nueva_inicio = date_type(nueva_inicio.year, nueva_inicio.month, 28) if nueva_inicio.day != 28 else nueva_inicio
        if nueva_inicio.month == 12:
            nueva_cierre = date_type(nueva_inicio.year + 1, 1, 27)
        else:
            nueva_cierre = date_type(nueva_inicio.year, nueva_inicio.month + 1, 27)
        
        # Solo crear si no existe ya
        existe_nuevo = PeriodoKPI.query.filter_by(
            fecha_inicio=nueva_inicio,
            fecha_cierre=nueva_cierre
        ).first()
        if not existe_nuevo:
            nuevo_periodo = PeriodoKPI(
                nombre=nombre_periodo(nueva_inicio, nueva_cierre),
                fecha_inicio=nueva_inicio,
                fecha_cierre=nueva_cierre,
                cerrado=False
            )
            db.session.add(nuevo_periodo)

        db.session.commit()
        return jsonify({'ok': True, 'periodo': periodo.to_dict(), 'resumen_anual': resumen.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@kpi_bp.route('/kpi/anual', methods=['GET'])
def get_resumenes_anuales():
    """Lista todos los resúmenes anuales"""
    try:
        resumenes = ResumenAnualKPI.query.order_by(ResumenAnualKPI.anio.desc()).all()
        return jsonify([r.to_dict() for r in resumenes])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@kpi_bp.route('/kpi/anual/<int:anio>', methods=['GET'])
def get_resumen_anual(anio):
    """Devuelve el resumen anual de un año específico"""
    try:
        resumen = ResumenAnualKPI.query.filter_by(anio=anio).first()
        if not resumen:
            return jsonify({'error': f'No hay datos para el año {anio}'}), 404
        return jsonify(resumen.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@kpi_bp.route('/kpi/anual/<int:anio>/cerrar', methods=['POST'])
def cerrar_anual(anio):
    """Cierra el resumen anual y lo resetea para el siguiente año"""
    try:
        resumen = ResumenAnualKPI.query.filter_by(anio=anio).first()
        if not resumen:
            return jsonify({'error': f'No hay datos para el año {anio}'}), 404
        if resumen.cerrado:
            return jsonify({'error': 'El resumen anual ya está cerrado'}), 400
        resumen.cerrado = True
        resumen.fecha_cerrado = datetime.utcnow()
        db.session.commit()
        return jsonify({'ok': True, 'resumen_anual': resumen.to_dict()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@kpi_bp.route('/kpi/periodo/<int:periodo_id>/pdf', methods=['GET'])
def pdf_periodo(periodo_id):
    """Genera y descarga el PDF del KPI mensual"""
    try:
        periodo = PeriodoKPI.query.get_or_404(periodo_id)
        recalcular_periodo(periodo)
        db.session.commit()
        datos = periodo.to_dict()
        pdf_buffer = generar_pdf_kpi(datos, tipo='mensual')
        periodo.pdf_generado = True
        periodo.fecha_pdf = datetime.utcnow()
        db.session.commit()
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'kpi_mensual_{periodo.nombre.replace(" ", "_").replace("-", "_")}.pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@kpi_bp.route('/kpi/anual/<int:anio>/pdf', methods=['GET'])
def pdf_anual(anio):
    """Genera y descarga el PDF del KPI anual"""
    try:
        resumen = ResumenAnualKPI.query.filter_by(anio=anio).first()
        if not resumen:
            return jsonify({'error': f'No hay datos para el año {anio}'}), 404
        datos = resumen.to_dict()
        pdf_buffer = generar_pdf_kpi(datos, tipo='anual')
        resumen.pdf_generado = True
        resumen.fecha_pdf = datetime.utcnow()
        db.session.commit()
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'kpi_anual_{anio}.pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
