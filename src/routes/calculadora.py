from flask import Blueprint, request, jsonify
from src.models.calculadora import db, CostosBase, Maquinas, ProductosFijos, CotizacionDolar
from datetime import datetime, date
import requests

calculadora_bp = Blueprint('calculadora', __name__)

@calculadora_bp.route('/cotizacion-dolar', methods=['GET'])
def obtener_cotizacion_dolar():
    """Obtiene la cotización actual del dólar blue"""
    try:
        # Buscar cotización de hoy
        hoy = date.today()
        cotizacion_hoy = CotizacionDolar.query.filter_by(fecha=hoy).first()
        
        if cotizacion_hoy:
            return jsonify({
                'success': True,
                'data': cotizacion_hoy.to_dict(),
                'desde_cache': True
            })
        
        # Si no existe, obtener de DolarHoy
        response = requests.get('https://dolarapi.com/v1/dolares/blue', timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            compra = float(data['compra'])
            venta = float(data['venta'])
            promedio = (compra + venta) / 2
            
            # Guardar en base de datos
            nueva_cotizacion = CotizacionDolar(
                fecha=hoy,
                compra=compra,
                venta=venta,
                promedio=promedio
            )
            
            db.session.add(nueva_cotizacion)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'data': nueva_cotizacion.to_dict(),
                'desde_cache': False
            })
        else:
            # Si falla la API, usar última cotización disponible
            ultima_cotizacion = CotizacionDolar.query.order_by(CotizacionDolar.fecha.desc()).first()
            if ultima_cotizacion:
                return jsonify({
                    'success': True,
                    'data': ultima_cotizacion.to_dict(),
                    'desde_cache': True,
                    'warning': 'Usando última cotización disponible'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'No se pudo obtener cotización del dólar'
                }), 500
                
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener cotización: {str(e)}'
        }), 500

@calculadora_bp.route('/costos-base', methods=['GET'])
def obtener_costos_base():
    """Obtiene los costos base del sistema"""
    try:
        costos = CostosBase.query.first()
        if not costos:
            return jsonify({
                'success': False,
                'error': 'No se encontraron costos base'
            }), 404
            
        return jsonify({
            'success': True,
            'data': costos.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener costos base: {str(e)}'
        }), 500

@calculadora_bp.route('/costos-base', methods=['PUT'])
def actualizar_costos_base():
    """Actualiza los costos base del sistema"""
    try:
        data = request.get_json()
        costos = CostosBase.query.first()
        
        if not costos:
            costos = CostosBase()
            db.session.add(costos)
        
        # Actualizar costos fijos (estructura anidada o directa)
        if 'costos_fijos' in data:
            cf = data['costos_fijos']
            costos.luz = cf.get('luz', costos.luz)
            costos.gas = cf.get('gas', costos.gas)
            costos.internet = cf.get('internet', costos.internet)
            costos.telefono = cf.get('telefono', costos.telefono)
            costos.alquiler = cf.get('alquiler', costos.alquiler)
            costos.impuestos_fijos = cf.get('impuestos_fijos', costos.impuestos_fijos)
            costos.manus = cf.get('manus', costos.manus)
        else:
            # Aceptar valores directos
            if 'luz' in data: costos.luz = data['luz']
            if 'gas' in data: costos.gas = data['gas']
            if 'internet' in data: costos.internet = data['internet']
            if 'telefono' in data: costos.telefono = data['telefono']
            if 'alquiler' in data: costos.alquiler = data['alquiler']
            if 'impuestos_fijos' in data: costos.impuestos_fijos = data['impuestos_fijos']
            if 'manus' in data: costos.manus = data['manus']
        
        # Actualizar mantenimiento (estructura anidada o directa)
        if 'mantenimiento' in data:
            m = data['mantenimiento']
            costos.mantenimiento_basico = m.get('basico', costos.mantenimiento_basico)
            costos.reserva_reparaciones = m.get('reserva_reparaciones', costos.reserva_reparaciones)
        else:
            if 'mantenimiento_basico' in data: costos.mantenimiento_basico = data['mantenimiento_basico']
            if 'reserva_reparaciones' in data: costos.reserva_reparaciones = data['reserva_reparaciones']
        
        # Actualizar horas mensuales
        if 'horas_mensuales' in data: costos.horas_mensuales = data['horas_mensuales']
        
        # Actualizar tarifas
        if 'tarifas_mano_obra' in data:
            t = data['tarifas_mano_obra']
            costos.tarifa_tatiana = t.get('tatiana', costos.tarifa_tatiana)
            costos.tarifa_tatiana_pintura = t.get('tatiana_pintura', costos.tarifa_tatiana_pintura)
            costos.tarifa_ana = t.get('ana', costos.tarifa_ana)
            costos.tarifa_daniel = t.get('daniel', costos.tarifa_daniel)
            costos.tarifa_dueno = t.get('dueno', costos.tarifa_dueno)
        
        costos.fecha_actualizacion = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': costos.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al actualizar costos base: {str(e)}'
        }), 500

@calculadora_bp.route('/maquinas', methods=['GET'])
def obtener_maquinas():
    """Obtiene todas las máquinas activas"""
    try:
        maquinas = Maquinas.query.filter_by(activa=True).all()
        return jsonify({
            'success': True,
            'data': [maquina.to_dict() for maquina in maquinas]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener máquinas: {str(e)}'
        }), 500

@calculadora_bp.route('/calcular-precio', methods=['POST'])
def calcular_precio():
    """Calcula el precio de un producto basado en los parámetros dados"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['costo_material', 'horas_trabajo', 'tipo_empleado', 'horas_maquina', 'tipo_maquina']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido faltante: {field}'
                }), 400
        
        # Obtener cotización del dólar
        cotizacion_response = obtener_cotizacion_dolar()
        if cotizacion_response[1] != 200:  # Si hay error en la cotización
            cotizacion_data = cotizacion_response[0].get_json()
            if not cotizacion_data.get('success'):
                return jsonify({
                    'success': False,
                    'error': 'No se pudo obtener cotización del dólar'
                }), 500
        
        cotizacion_dolar = cotizacion_response[0].get_json()['data']['promedio']
        
        # Obtener costos base
        costos = CostosBase.query.first()
        if not costos:
            return jsonify({
                'success': False,
                'error': 'No se encontraron costos base'
            }), 500
        
        # Obtener máquina
        maquina = Maquinas.query.filter_by(nombre=data['tipo_maquina'], activa=True).first()
        if not maquina:
            return jsonify({
                'success': False,
                'error': f'Máquina no encontrada: {data["tipo_maquina"]}'
            }), 400
        
        # Calcular componentes del costo
        costo_material = float(data['costo_material'])
        horas_trabajo = float(data['horas_trabajo'])
        horas_maquina = float(data['horas_maquina'])
        
        # Obtener tarifa del empleado
        tarifas = {
            'tatiana': costos.tarifa_tatiana,
            'tatiana_pintura': costos.tarifa_tatiana_pintura,
            'ana': costos.tarifa_ana,
            'daniel': costos.tarifa_daniel,
            'dueno': costos.tarifa_dueno
        }
        
        if data['tipo_empleado'] not in tarifas:
            return jsonify({
                'success': False,
                'error': f'Tipo de empleado no válido: {data["tipo_empleado"]}'
            }), 400
        
        tarifa_empleado = tarifas[data['tipo_empleado']]
        
        # Calcular costos
        costo_mano_obra = horas_trabajo * tarifa_empleado
        costo_maquina = horas_maquina * maquina.calcular_costo_por_hora()
        
        # Calcular costos indirectos (costos fijos distribuidos)
        # Costos fijos de la tabla CostosBase
        costos_fijos_base = (
            costos.luz + costos.gas + costos.internet + costos.telefono + 
            costos.alquiler + costos.impuestos_fijos + costos.manus
        )
        
        # Sumar costos fijos adicionales de la tabla costos_fijos
        from src.models.costo_fijo import CostoFijo
        costos_fijos_adicionales = db.session.query(db.func.sum(CostoFijo.monto_mensual)).filter(
            CostoFijo.activo == True
        ).scalar() or 0
        
        # Total de costos fijos mensuales
        costos_fijos_totales = costos_fijos_base + costos_fijos_adicionales
        
        # Horas totales mensuales (330h empleados + 300h dueño según documento)
        horas_totales_mensuales = 630
        costo_indirecto_por_hora = costos_fijos_totales / horas_totales_mensuales
        costos_indirectos = horas_trabajo * costo_indirecto_por_hora
        
        # Costo real total
        costo_real = costo_material + costo_mano_obra + costo_maquina + costos_indirectos
        
        # Factor de ganancia (por defecto 2.0, pero puede ser personalizado)
        factor_ganancia = float(data.get('factor_ganancia', 2.0))
        precio_final = costo_real * factor_ganancia
        
        # Desglose detallado
        desglose = {
            'costo_material': costo_material,
            'costo_mano_obra': costo_mano_obra,
            'costo_maquina': costo_maquina,
            'costos_indirectos': costos_indirectos,
            'costo_real_total': costo_real,
            'factor_ganancia': factor_ganancia,
            'precio_final': precio_final,
            'detalles': {
                'tarifa_empleado': tarifa_empleado,
                'costo_maquina_por_hora': maquina.calcular_costo_por_hora(),
                'costo_indirecto_por_hora': costo_indirecto_por_hora,
                'cotizacion_dolar': cotizacion_dolar,
                'costos_fijos_base': costos_fijos_base,
                'costos_fijos_adicionales': costos_fijos_adicionales,
                'costos_fijos_totales': costos_fijos_totales,
                'horas_totales_mensuales': horas_totales_mensuales
            }
        }
        
        return jsonify({
            'success': True,
            'data': desglose
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al calcular precio: {str(e)}'
        }), 500

@calculadora_bp.route('/productos-fijos', methods=['GET'])
def obtener_productos_fijos():
    """Obtiene todos los productos fijos activos"""
    try:
        productos = ProductosFijos.query.filter_by(activo=True).all()
        return jsonify({
            'success': True,
            'data': [producto.to_dict() for producto in productos]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener productos fijos: {str(e)}'
        }), 500

@calculadora_bp.route('/productos-fijos', methods=['POST'])
def crear_producto_fijo():
    """Crea un nuevo producto fijo"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['nombre', 'costo_material', 'horas_trabajo', 'tipo_empleado', 'horas_maquina', 'tipo_maquina']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido faltante: {field}'
                }), 400
        
        # Calcular precio del producto
        calculo_response = calcular_precio()
        if calculo_response[1] != 200:
            return calculo_response
        
        calculo_data = calculo_response[0].get_json()['data']
        
        # Crear producto fijo
        producto = ProductosFijos(
            nombre=data['nombre'],
            descripcion=data.get('descripcion', ''),
            imagen_url=data.get('imagen_url', ''),
            costo_material=float(data['costo_material']),
            horas_trabajo=float(data['horas_trabajo']),
            tipo_empleado=data['tipo_empleado'],
            horas_maquina=float(data['horas_maquina']),
            tipo_maquina=data['tipo_maquina'],
            costo_real=calculo_data['costo_real_total'],
            precio_sugerido=calculo_data['precio_final'],
            factor_ganancia=float(data.get('factor_ganancia', 2.0)),
            precio_actual_cobrado=data.get('precio_actual_cobrado')
        )
        
        db.session.add(producto)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': producto.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al crear producto fijo: {str(e)}'
        }), 500

