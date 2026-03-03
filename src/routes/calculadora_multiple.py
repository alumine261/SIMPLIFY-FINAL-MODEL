from flask import Blueprint, request, jsonify
from src.models.calculadora import db, CostosBase, Maquinas, CotizacionDolar
from src.routes.calculadora import obtener_cotizacion_dolar
from datetime import datetime, date

calculadora_multiple_bp = Blueprint('calculadora_multiple', __name__)

@calculadora_multiple_bp.route('/calcular-precio-multiple', methods=['POST'])
def calcular_precio_multiple():
    """Calcula el precio de un producto con múltiples empleados"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['costo_material', 'empleados', 'horas_maquina', 'tipo_maquina']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido faltante: {field}'
                }), 400
        
        # Validar que hay al menos un empleado
        if not data['empleados'] or len(data['empleados']) == 0:
            return jsonify({
                'success': False,
                'error': 'Debe incluir al menos un empleado'
            }), 400
        
        # Obtener cotización del dólar
        cotizacion_response = obtener_cotizacion_dolar()
        if cotizacion_response[1] != 200:
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
        horas_maquina = float(data['horas_maquina'])
        
        # Obtener tarifas de empleados
        tarifas = {
            'tatiana': costos.tarifa_tatiana,
            'tatiana_pintura': costos.tarifa_tatiana_pintura,
            'ana': costos.tarifa_ana,
            'daniel': costos.tarifa_daniel,
            'dueno': costos.tarifa_dueno
        }
        
        # Calcular mano de obra total y desglose por empleado
        costo_mano_obra_total = 0
        total_horas_trabajo = 0
        desglose_empleados = []
        
        for empleado in data['empleados']:
            tipo_empleado = empleado['tipo_empleado']
            horas_trabajo = float(empleado['horas_trabajo'])
            
            if tipo_empleado not in tarifas:
                return jsonify({
                    'success': False,
                    'error': f'Tipo de empleado no válido: {tipo_empleado}'
                }), 400
            
            tarifa_empleado = tarifas[tipo_empleado]
            subtotal_empleado = horas_trabajo * tarifa_empleado
            
            costo_mano_obra_total += subtotal_empleado
            total_horas_trabajo += horas_trabajo
            
            # Agregar al desglose
            nombres_empleados = {
                'tatiana': 'Tatiana',
                'tatiana_pintura': 'Tatiana (Pintura)',
                'ana': 'Ana',
                'daniel': 'Daniel',
                'dueno': 'Dueño'
            }
            
            desglose_empleados.append({
                'nombre': nombres_empleados.get(tipo_empleado, tipo_empleado),
                'horas': horas_trabajo,
                'tarifa': tarifa_empleado,
                'subtotal': subtotal_empleado
            })
        
        # Calcular costo de máquina
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
        costos_indirectos = total_horas_trabajo * costo_indirecto_por_hora
        
        # Costo real total
        costo_real = costo_material + costo_mano_obra_total + costo_maquina + costos_indirectos
        
        # Factor de ganancia (por defecto 2.0, pero puede ser personalizado)
        factor_ganancia = float(data.get('factor_ganancia', 2.0))
        precio_final = costo_real * factor_ganancia
        
        # Desglose detallado
        desglose = {
            'costo_material': costo_material,
            'costo_mano_obra': costo_mano_obra_total,
            'costo_maquina': costo_maquina,
            'costos_indirectos': costos_indirectos,
            'costo_real_total': costo_real,
            'factor_ganancia': factor_ganancia,
            'precio_final': precio_final,
            'desglose_empleados': desglose_empleados,
            'detalles': {
                'total_horas_trabajo': total_horas_trabajo,
                'costo_maquina_por_hora': maquina.calcular_costo_por_hora(),
                'costo_indirecto_por_hora': costo_indirecto_por_hora,
                'cotizacion_dolar': cotizacion_dolar,
                'costos_fijos_totales': costos_fijos_totales,
                'horas_totales_mensuales': horas_totales_mensuales,
                'maquina_utilizada': data['tipo_maquina'],
                'cantidad_empleados': len(data['empleados'])
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

