from flask import Blueprint, request, jsonify
from src.models.calculadora import db, CostosBase, Maquinas, CotizacionDolar
from src.models.empleado import Empleado

calculadora_multiple_maquinas_bp = Blueprint('calculadora_multiple_maquinas', __name__)

@calculadora_multiple_maquinas_bp.route('/calcular-precio-multiple-maquinas', methods=['POST'])
def calcular_precio_multiple_maquinas():
    """Calcula el precio con múltiples empleados y múltiples máquinas"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data or 'costo_material' not in data:
            return jsonify({
                'success': False,
                'error': 'Costo de material es requerido'
            }), 400
        
        if 'empleados' not in data or not data['empleados']:
            return jsonify({
                'success': False,
                'error': 'Debe incluir al menos un empleado'
            }), 400
            
        if 'maquinas' not in data or not data['maquinas']:
            return jsonify({
                'success': False,
                'error': 'Debe incluir al menos una máquina'
            }), 400
        
        # Obtener datos base
        costos_base = CostosBase.query.first()
        if not costos_base:
            return jsonify({
                'success': False,
                'error': 'No se encontraron costos base configurados'
            }), 500
        
        # Obtener cotización del dólar (opcional, usar valor por defecto si no existe)
        cotizacion_dolar = CotizacionDolar.query.order_by(CotizacionDolar.fecha.desc()).first()
        valor_dolar = cotizacion_dolar.promedio if cotizacion_dolar else 1000  # Valor por defecto
        
        # Calcular costo de material
        costo_material = float(data['costo_material'])
        
        # Calcular costo de mano de obra (múltiples empleados)
        costo_mano_obra = 0
        desglose_empleados = []
        
        for empleado_data in data['empleados']:
            if empleado_data.get('tipo_empleado') and empleado_data.get('horas_trabajo'):
                empleado_id = int(empleado_data['tipo_empleado'])
                horas = float(empleado_data['horas_trabajo'])
                
                # Buscar empleado por ID
                empleado = Empleado.query.filter_by(id=empleado_id, activo=True).first()
                if empleado:
                    tarifa = empleado.tarifa_por_hora
                    costo_empleado = tarifa * horas
                    costo_mano_obra += costo_empleado
                    
                    desglose_empleados.append({
                        'nombre': empleado.nombre,
                        'tipo': empleado.tipo,
                        'horas': horas,
                        'tarifa_por_hora': tarifa,
                        'costo_total': costo_empleado
                    })
        
        # Calcular costo de máquinas (múltiples máquinas)
        costo_maquinas = 0
        desglose_maquinas = []
        
        for maquina_data in data['maquinas']:
            if maquina_data.get('tipo_maquina') and maquina_data.get('horas_maquina'):
                maquina_id = int(maquina_data['tipo_maquina'])
                horas = float(maquina_data['horas_maquina'])
                
                # Buscar la máquina en la base de datos por ID
                maquina = Maquinas.query.filter_by(id=maquina_id, activa=True).first()
                if maquina:
                    costo_por_hora = maquina.calcular_costo_por_hora()
                    costo_maquina = costo_por_hora * horas
                    costo_maquinas += costo_maquina
                    
                    desglose_maquinas.append({
                        'nombre': maquina.nombre,
                        'horas': horas,
                        'costo_por_hora': costo_por_hora,
                        'costo_total': costo_maquina
                    })
        
        # Calcular horas de empleados (solo estas se usan para costos indirectos)
        # Las máquinas ya tienen sus costos incluidos en su tarifa por hora
        horas_empleados = sum(float(emp.get('horas_trabajo', 0)) for emp in data['empleados'] if emp.get('horas_trabajo'))
        horas_maquinas = sum(float(maq.get('horas_maquina', 0)) for maq in data['maquinas'] if maq.get('horas_maquina'))
        
        # Calcular costos indirectos SOLO sobre horas de empleados
        costos_indirectos = costos_base.calcular_costos_indirectos(horas_empleados, valor_dolar)
        
        # Guardar horas totales para referencia (máximo entre empleados y máquinas)
        horas_totales = max(horas_empleados, horas_maquinas)
        
        # Calcular subtotal
        subtotal = costo_material + costo_mano_obra + costo_maquinas + costos_indirectos
        
        # Aplicar factor de ganancia
        factor_ganancia = float(data.get('factor_ganancia', 2.0))
        ganancia = subtotal * (factor_ganancia - 1)
        precio_final = subtotal + ganancia
        
        # Preparar respuesta con estructura compatible con el frontend
        resultado = {
            'precio_final': round(precio_final, 2),
            'costo_materiales': round(costo_material, 2),
            'costo_mano_obra': round(costo_mano_obra, 2),
            'costo_maquinas': round(costo_maquinas, 2),
            'costos_indirectos': round(costos_indirectos, 2),
            'costo_total': round(subtotal, 2),
            'ganancia': round(ganancia, 2),
            'factor_ganancia': factor_ganancia,
            'horas_totales': horas_totales,
            'cotizacion_dolar': valor_dolar,
            'desglose_empleados': desglose_empleados,
            'desglose_maquinas': desglose_maquinas,
            'fecha_calculo': cotizacion_dolar.fecha.isoformat() if cotizacion_dolar else None
        }
        
        return jsonify(resultado)
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': f'Error en los datos numéricos: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error en el cálculo: {str(e)}'
        }), 500
