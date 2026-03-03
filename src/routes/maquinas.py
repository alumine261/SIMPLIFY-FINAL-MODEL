from flask import Blueprint, request, jsonify
from src.models.calculadora import Maquinas, db
from src.services.recalculo_service import recalcular_productos_por_maquina
from datetime import datetime

maquinas_bp = Blueprint('maquinas', __name__)

@maquinas_bp.route('/api/maquinas', methods=['GET'])
def obtener_maquinas():
    """Obtener todas las máquinas activas"""
    try:
        maquinas = Maquinas.query.filter_by(activa=True).all()
        return jsonify([maquina.to_dict() for maquina in maquinas])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maquinas_bp.route('/api/maquinas/<int:maquina_id>', methods=['GET'])
def obtener_maquina(maquina_id):
    """Obtener una máquina específica"""
    try:
        maquina = Maquinas.query.get_or_404(maquina_id)
        return jsonify(maquina.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maquinas_bp.route('/api/maquinas', methods=['POST'])
def crear_maquina():
    """Crear una nueva máquina (solo propietarios)"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        campos_requeridos = ['nombre', 'costo_inicial', 'vida_util_meses', 'horas_semanales']
        for campo in campos_requeridos:
            if campo not in data:
                return jsonify({'error': f'El campo {campo} es requerido'}), 400
        
        # Parsear fecha de compra
        fecha_compra = data.get('fecha_compra')
        if fecha_compra:
            try:
                fecha_compra = datetime.fromisoformat(fecha_compra.replace('Z', '+00:00'))
            except:
                fecha_compra = datetime.utcnow()
        else:
            fecha_compra = datetime.utcnow()
        
        nueva_maquina = Maquinas(
            nombre=data['nombre'],
            costo_inicial=float(data['costo_inicial']),
            vida_util_meses=int(data['vida_util_meses']),
            horas_semanales=float(data['horas_semanales']),
            fecha_compra=fecha_compra,
            costo_mantenimiento_mensual=float(data.get('costo_mantenimiento_mensual', 0)),
            activa=True
        )
        
        db.session.add(nueva_maquina)
        db.session.commit()
        
        return jsonify(nueva_maquina.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@maquinas_bp.route('/api/maquinas/<int:maquina_id>', methods=['PUT'])
def actualizar_maquina(maquina_id):
    """Actualizar una máquina existente (solo propietarios)"""
    try:
        maquina = Maquinas.query.get_or_404(maquina_id)
        data = request.get_json()
        
        # Actualizar campos si están presentes
        if 'nombre' in data:
            maquina.nombre = data['nombre']
        if 'costo_inicial' in data:
            maquina.costo_inicial = float(data['costo_inicial'])
        if 'vida_util_meses' in data:
            maquina.vida_util_meses = int(data['vida_util_meses'])
        if 'horas_semanales' in data:
            maquina.horas_semanales = float(data['horas_semanales'])
        if 'costo_mantenimiento_mensual' in data:
            maquina.costo_mantenimiento_mensual = float(data['costo_mantenimiento_mensual'])
        if 'fecha_compra' in data:
            try:
                maquina.fecha_compra = datetime.fromisoformat(data['fecha_compra'].replace('Z', '+00:00'))
            except:
                pass
        if 'activa' in data:
            maquina.activa = bool(data['activa'])
        
        db.session.commit()
        
        # Recalcular productos que usan esta máquina
        productos_actualizados = recalcular_productos_por_maquina(maquina_id)
        
        response = maquina.to_dict()
        response['productos_recalculados'] = len(productos_actualizados)
        
        return jsonify(response)
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@maquinas_bp.route('/api/maquinas/<int:maquina_id>', methods=['DELETE'])
def eliminar_maquina(maquina_id):
    """Eliminar (desactivar) una máquina (solo propietarios)"""
    try:
        maquina = Maquinas.query.get_or_404(maquina_id)
        maquina.activa = False
        db.session.commit()
        
        return jsonify({'mensaje': 'Máquina desactivada correctamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
