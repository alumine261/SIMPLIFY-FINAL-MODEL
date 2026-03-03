from flask import Blueprint, request, jsonify
from src.models.calculadora import CostosBase
from src.models.user import db
import json

costos_base_bp = Blueprint('costos_base', __name__)

@costos_base_bp.route('/api/costos-base', methods=['GET'])
def get_costos_base():
    """Obtener costos base (siempre hay un solo registro)"""
    try:
        costos = CostosBase.query.first()
        if not costos:
            # Crear registro por defecto si no existe
            costos = CostosBase(
                horas_mensuales=600.0,
                costos_fijos=json.dumps({
                    'luz': 0,
                    'gas': 0,
                    'internet': 0,
                    'telefono': 0,
                    'alquiler': 0,
                    'impuestos_fijos': 0,
                    'manus': 0
                }),
                mantenimiento=json.dumps({
                    'basico': 0,
                    'reserva_reparaciones': 0
                })
            )
            db.session.add(costos)
            db.session.commit()
        
        return jsonify(costos.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@costos_base_bp.route('/api/costos-base', methods=['PUT'])
def update_costos_base():
    """Actualizar costos base"""
    try:
        data = request.get_json()
        costos = CostosBase.query.first()
        
        if not costos:
            # Crear si no existe
            costos = CostosBase()
            db.session.add(costos)
        
        # Actualizar horas mensuales
        if 'horas_mensuales' in data:
            costos.horas_mensuales = float(data['horas_mensuales'])
        
        # Actualizar costos fijos
        if 'costos_fijos' in data:
            costos.costos_fijos = json.dumps(data['costos_fijos'])
        
        # Actualizar mantenimiento
        if 'mantenimiento' in data:
            costos.mantenimiento = json.dumps(data['mantenimiento'])
        
        db.session.commit()
        return jsonify(costos.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@costos_base_bp.route('/api/costos-base/costo-fijo/<campo>', methods=['PUT'])
def update_costo_fijo(campo):
    """Actualizar un costo fijo específico"""
    try:
        data = request.get_json()
        valor = data.get('valor', 0)
        
        costos = CostosBase.query.first()
        if not costos:
            costos = CostosBase()
            db.session.add(costos)
        
        # Actualizar el campo específico directamente en la columna
        if hasattr(costos, campo):
            setattr(costos, campo, float(valor))
        else:
            return jsonify({'error': f'Campo {campo} no existe'}), 400
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Costo actualizado correctamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@costos_base_bp.route('/api/costos-base/mantenimiento/<campo>', methods=['PUT'])
def update_mantenimiento(campo):
    """Actualizar un costo de mantenimiento específico"""
    try:
        data = request.get_json()
        valor = data.get('valor', 0)
        
        costos = CostosBase.query.first()
        if not costos:
            costos = CostosBase()
            db.session.add(costos)
        
        # Mapear nombres de campos del frontend a nombres de columnas
        campo_map = {
            'basico': 'mantenimiento_basico',
            'reserva_reparaciones': 'reserva_reparaciones'
        }
        
        campo_db = campo_map.get(campo, campo)
        
        # Actualizar el campo específico directamente en la columna
        if hasattr(costos, campo_db):
            setattr(costos, campo_db, float(valor))
        else:
            return jsonify({'error': f'Campo {campo} no existe'}), 400
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Costo actualizado correctamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
