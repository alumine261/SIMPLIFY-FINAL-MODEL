from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.producto_catalogo import ProductoCatalogo
import json

catalogo_bp = Blueprint('catalogo', __name__)


def recalcular_producto(producto):
    """
    Recalcula el precio y componentes de un producto usando las tarifas actuales
    de empleados, materiales y máquinas. Actualiza datos_calculo y precio.
    """
    if not producto.datos_calculo:
        return

    try:
        datos = json.loads(producto.datos_calculo)
    except Exception:
        return

    from src.models.calculadora import CostosBase, CotizacionDolar
    from datetime import date

    # Obtener cotización del dólar actual
    hoy = date.today()
    cotizacion = CotizacionDolar.query.filter_by(fecha=hoy).first()
    valor_dolar = cotizacion.promedio if cotizacion else 1395.0

    # Calcular costo de materiales con precios actuales
    costo_materiales = 0.0
    materiales_config = datos.get('materiales', [])
    if materiales_config:
        from src.models.materiales import Material
        for mat_item in materiales_config:
            mat_id = mat_item.get('id')
            cantidad_raw = mat_item.get('cantidad', 1)
            try:
                cantidad = float(cantidad_raw) if not isinstance(cantidad_raw, str) or not cantidad_raw.startswith('=') else float(eval(cantidad_raw[1:]))
            except (ValueError, TypeError, SyntaxError):
                cantidad = 1.0
            if mat_id:
                try:
                    material = Material.query.get(int(mat_id))
                    if material:
                        costo_materiales += (material.precio_por_m2 or 0) * cantidad
                except Exception:
                    pass

    # Calcular costo de mano de obra con tarifas actuales
    costo_mano_obra = 0.0
    desglose_empleados = []
    empleados_config = datos.get('empleados', [])
    if empleados_config:
        from src.models.empleado import Empleado
        for emp_item in empleados_config:
            emp_id = emp_item.get('id')
            horas_raw = emp_item.get('horas', 0)
            try:
                horas = float(horas_raw) if not isinstance(horas_raw, str) or not horas_raw.startswith('=') else float(eval(horas_raw[1:]))
            except (ValueError, TypeError, SyntaxError):
                horas = 0.0
            if emp_id:
                try:
                    empleado = Empleado.query.get(int(emp_id))
                    if empleado:
                        tarifa_actual = empleado.tarifa_por_hora or 0
                        costo_emp = tarifa_actual * horas
                        costo_mano_obra += costo_emp
                        desglose_empleados.append({
                            'id': emp_id,
                            'nombre': empleado.nombre,
                            'horas': horas,
                            'tarifa_hora': tarifa_actual,
                            'costo_total': costo_emp
                        })
                except Exception:
                    pass

    # Calcular costo de máquinas con tarifas actuales
    costo_maquinas = 0.0
    desglose_maquinas = []
    maquinas_config = datos.get('maquinas', [])
    if maquinas_config:
        from src.models.calculadora import Maquinas
        for maq_item in maquinas_config:
            maq_id = maq_item.get('id')
            horas_raw_m = maq_item.get('horas', 0)
            try:
                horas = float(horas_raw_m) if not isinstance(horas_raw_m, str) or not horas_raw_m.startswith('=') else float(eval(horas_raw_m[1:]))
            except (ValueError, TypeError, SyntaxError):
                horas = 0.0
            if maq_id:
                try:
                    maquina = Maquinas.query.get(int(maq_id))
                    if maquina:
                        costo_hora = maquina.calcular_costo_por_hora()
                        costo_maq = costo_hora * horas
                        costo_maquinas += costo_maq
                        desglose_maquinas.append({
                            'id': maq_id,
                            'nombre': maquina.nombre,
                            'horas': horas,
                            'costo_hora': costo_hora,
                            'costo_total': costo_maq
                        })
                except Exception:
                    pass

    # Calcular costos indirectos con valores actuales de CostosBase
    costos_indirectos = 0.0
    horas_totales = sum(float(e.get('horas', 0)) for e in empleados_config)
    costos_base = CostosBase.query.first()
    if costos_base and horas_totales > 0:
        try:
            costos_indirectos = costos_base.calcular_costos_indirectos(horas_totales, valor_dolar)
        except Exception:
            pass

    # Calcular totales
    costo_total = costo_materiales + costo_mano_obra + costo_maquinas + costos_indirectos
    factor_ganancia = float(datos.get('factor_ganancia', 2.0))
    ganancia = costo_total * (factor_ganancia - 1)
    precio_final = costo_total * factor_ganancia

    # Actualizar resultado en datos_calculo
    datos['resultado'] = {
        'costo_materiales': round(costo_materiales, 2),
        'costo_mano_obra': round(costo_mano_obra, 2),
        'costo_maquinas': round(costo_maquinas, 2),
        'costos_indirectos': round(costos_indirectos, 2),
        'costo_total': round(costo_total, 2),
        'factor_ganancia': factor_ganancia,
        'ganancia': round(ganancia, 2),
        'precio_final': round(precio_final, 2),
        'horas_totales': horas_totales,
        'cotizacion_dolar': valor_dolar,
        'desglose_empleados': desglose_empleados,
        'desglose_maquinas': desglose_maquinas,
        'fecha_calculo': str(hoy)
    }

    # Actualizar precio y datos en el modelo
    producto.precio = round(precio_final, 2)
    producto.costo = round(costo_total, 2)
    producto.datos_calculo = json.dumps(datos)


@catalogo_bp.route('/api/catalogo', methods=['GET'])
def get_productos():
    """Obtener todos los productos del catálogo con precios recalculados"""
    try:
        productos = ProductoCatalogo.query.filter_by(activo=True).all()
        for producto in productos:
            recalcular_producto(producto)
        db.session.commit()
        return jsonify({
            'success': True,
            'productos': [producto.to_dict() for producto in productos]
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@catalogo_bp.route('/api/catalogo/<int:id>', methods=['GET'])
def get_producto(id):
    """Obtener un producto por ID con precio recalculado"""
    try:
        producto = ProductoCatalogo.query.get_or_404(id)
        recalcular_producto(producto)
        db.session.commit()
        return jsonify({
            'success': True,
            'producto': producto.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@catalogo_bp.route('/api/catalogo', methods=['POST'])
def crear_producto():
    """Crear nuevo producto en el catálogo"""
    try:
        data = request.get_json()

        datos_calculo_raw = data.get('datos_calculo')
        if datos_calculo_raw is not None and not isinstance(datos_calculo_raw, str):
            datos_calculo_raw = json.dumps(datos_calculo_raw)

        producto = ProductoCatalogo(
            nombre=data.get('nombre'),
            descripcion=data.get('descripcion'),
            categoria=data.get('categoria'),
            precio=data.get('precio'),
            costo=data.get('costo'),
            datos_calculo=datos_calculo_raw
        )

        db.session.add(producto)
        db.session.commit()

        return jsonify({
            'success': True,
            'producto': producto.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@catalogo_bp.route('/api/catalogo/<int:id>', methods=['PUT'])
def actualizar_producto(id):
    """Actualizar producto existente"""
    try:
        producto = ProductoCatalogo.query.get_or_404(id)
        data = request.get_json()

        producto.nombre = data.get('nombre', producto.nombre)
        producto.descripcion = data.get('descripcion', producto.descripcion)
        producto.categoria = data.get('categoria', producto.categoria)
        producto.precio = data.get('precio', producto.precio)
        producto.costo = data.get('costo', producto.costo)
        dc_nuevo = data.get('datos_calculo', producto.datos_calculo)
        if dc_nuevo is not None and not isinstance(dc_nuevo, str):
            dc_nuevo = json.dumps(dc_nuevo)
        producto.datos_calculo = dc_nuevo

        db.session.commit()

        return jsonify({
            'success': True,
            'producto': producto.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@catalogo_bp.route('/api/catalogo/<int:id>', methods=['DELETE'])
def eliminar_producto(id):
    """Eliminar producto (soft delete)"""
    try:
        producto = ProductoCatalogo.query.get_or_404(id)
        producto.activo = False
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Producto eliminado correctamente'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@catalogo_bp.route('/api/catalogo/recalcular', methods=['POST'])
def recalcular_todos():
    """Forzar recálculo de todos los productos del catálogo"""
    try:
        productos = ProductoCatalogo.query.filter_by(activo=True).all()
        for producto in productos:
            recalcular_producto(producto)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'{len(productos)} productos recalculados',
            'productos': [p.to_dict() for p in productos]
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
