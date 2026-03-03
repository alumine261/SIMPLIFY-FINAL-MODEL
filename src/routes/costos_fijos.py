from flask import Blueprint, request, jsonify
from src.models.calculadora import db
from src.models.costo_fijo import CostoFijo
from datetime import datetime

costos_fijos_bp = Blueprint('costos_fijos', __name__)

@costos_fijos_bp.route('/costos-fijos', methods=['GET'])
def obtener_costos_fijos():
    """Obtiene todos los costos fijos"""
    try:
        costos = CostoFijo.query.all()
        return jsonify([costo.to_dict() for costo in costos])
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener costos fijos: {str(e)}'
        }), 500

@costos_fijos_bp.route('/costos-fijos/<int:id>', methods=['GET'])
def obtener_costo_fijo(id):
    """Obtiene un costo fijo específico"""
    try:
        costo = CostoFijo.query.get(id)
        if not costo:
            return jsonify({
                'success': False,
                'error': 'Costo fijo no encontrado'
            }), 404
        return jsonify(costo.to_dict())
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener costo fijo: {str(e)}'
        }), 500

@costos_fijos_bp.route('/costos-fijos', methods=['POST'])
def crear_costo_fijo():
    """Crea un nuevo costo fijo"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data.get('nombre'):
            return jsonify({
                'success': False,
                'error': 'El nombre es requerido'
            }), 400
        
        if not data.get('categoria'):
            return jsonify({
                'success': False,
                'error': 'La categoría es requerida'
            }), 400
        
        if 'monto_mensual' not in data:
            return jsonify({
                'success': False,
                'error': 'El monto mensual es requerido'
            }), 400
        
        # Crear nuevo costo fijo
        nuevo_costo = CostoFijo(
            nombre=data['nombre'],
            categoria=data['categoria'],
            monto_mensual=float(data['monto_mensual']),
            descripcion=data.get('descripcion', ''),
            activo=data.get('activo', True)
        )
        
        db.session.add(nuevo_costo)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': nuevo_costo.to_dict(),
            'message': 'Costo fijo creado exitosamente'
        }), 201
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': f'Error en los datos numéricos: {str(e)}'
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al crear costo fijo: {str(e)}'
        }), 500

@costos_fijos_bp.route('/costos-fijos/<int:id>', methods=['PUT'])
def actualizar_costo_fijo(id):
    """Actualiza un costo fijo existente"""
    try:
        costo = CostoFijo.query.get(id)
        if not costo:
            return jsonify({
                'success': False,
                'error': 'Costo fijo no encontrado'
            }), 404
        
        data = request.get_json()
        
        # Actualizar campos
        if 'nombre' in data:
            costo.nombre = data['nombre']
        if 'categoria' in data:
            costo.categoria = data['categoria']
        if 'monto_mensual' in data:
            costo.monto_mensual = float(data['monto_mensual'])
        if 'descripcion' in data:
            costo.descripcion = data['descripcion']
        if 'activo' in data:
            costo.activo = data['activo']
        
        costo.fecha_actualizacion = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': costo.to_dict(),
            'message': 'Costo fijo actualizado exitosamente'
        })
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': f'Error en los datos numéricos: {str(e)}'
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al actualizar costo fijo: {str(e)}'
        }), 500

@costos_fijos_bp.route('/costos-fijos/<int:id>', methods=['DELETE'])
def eliminar_costo_fijo(id):
    """Elimina permanentemente un costo fijo (hard delete)"""
    try:
        costo = CostoFijo.query.get(id)
        if not costo:
            return jsonify({
                'success': False,
                'error': 'Costo fijo no encontrado'
            }), 404
        
        # Eliminación permanente
        db.session.delete(costo)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Costo fijo eliminado exitosamente'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al eliminar costo fijo: {str(e)}'
        }), 500

@costos_fijos_bp.route('/costos-fijos/total', methods=['GET'])
def obtener_total_costos_fijos():
    """Obtiene el total de costos fijos activos"""
    try:
        costos_activos = CostoFijo.query.filter_by(activo=True).all()
        total = sum(costo.monto_mensual for costo in costos_activos)
        
        return jsonify({
            'success': True,
            'total': total,
            'cantidad': len(costos_activos)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al calcular total: {str(e)}'
        }), 500

