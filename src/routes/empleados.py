from flask import Blueprint, request, jsonify
from src.models.empleado import Empleado, db
from src.services.recalculo_service import recalcular_productos_por_empleado

empleados_bp = Blueprint('empleados', __name__)

def migrar_empleados_fijos():
    """Migrar empleados fijos de CostosBase a la tabla Empleados si no existen"""
    try:
        # Verificar si ya existen empleados en la nueva tabla
        if Empleado.query.count() > 0:
            return
        
        costos_base = CostosBase.query.first()
        if not costos_base:
            return
        
        # Crear empleados fijos
        empleados_fijos = [
            Empleado(nombre='Tatiana', tipo='operario', tarifa_por_hora=costos_base.tarifa_tatiana),
            Empleado(nombre='Tatiana (Pintura)', tipo='operario_especializado', tarifa_por_hora=costos_base.tarifa_tatiana_pintura),
            Empleado(nombre='Ana', tipo='operario', tarifa_por_hora=costos_base.tarifa_ana),
            Empleado(nombre='Daniel', tipo='operario', tarifa_por_hora=costos_base.tarifa_daniel),
            Empleado(nombre='Dueño', tipo='propietario', tarifa_por_hora=costos_base.tarifa_dueno)
        ]
        
        for empleado in empleados_fijos:
            db.session.add(empleado)
        
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error migrando empleados: {e}")

@empleados_bp.route('/api/empleados', methods=['GET'])
def obtener_empleados():
    """Obtener todos los empleados activos"""
    try:
        # Intentar migrar empleados fijos si es necesario
        migrar_empleados_fijos()
        
        empleados = Empleado.query.filter_by(activo=True).all()
        return jsonify([emp.to_dict() for emp in empleados])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@empleados_bp.route('/api/empleados/<int:empleado_id>', methods=['GET'])
def obtener_empleado(empleado_id):
    """Obtener un empleado específico"""
    try:
        empleado = Empleado.query.get(empleado_id)
        if not empleado:
            return jsonify({'error': 'Empleado no encontrado'}), 404
        
        return jsonify(empleado.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@empleados_bp.route('/api/empleados', methods=['POST'])
def crear_empleado():
    """Crear un nuevo empleado"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data.get('nombre'):
            return jsonify({'error': 'El nombre es requerido'}), 400
        
        if not data.get('tipo'):
            return jsonify({'error': 'El tipo es requerido'}), 400
        
        if not data.get('tarifa_por_hora') or float(data.get('tarifa_por_hora', 0)) <= 0:
            return jsonify({'error': 'La tarifa debe ser mayor a 0'}), 400
        
        # Validar tipo de empleado
        tipos_validos = ['operario', 'operario_especializado', 'propietario']
        if data.get('tipo') not in tipos_validos:
            return jsonify({'error': f'El tipo debe ser uno de: {", ".join(tipos_validos)}'}), 400
        
        # Crear nuevo empleado
        nuevo_empleado = Empleado(
            nombre=data['nombre'],
            tipo=data['tipo'],
            tarifa_por_hora=float(data['tarifa_por_hora'])
        )
        
        db.session.add(nuevo_empleado)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Empleado creado correctamente',
            'empleado': nuevo_empleado.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@empleados_bp.route('/api/empleados/<int:empleado_id>', methods=['PUT'])
def actualizar_empleado(empleado_id):
    """Actualizar un empleado"""
    try:
        empleado = Empleado.query.get(empleado_id)
        if not empleado:
            return jsonify({'error': 'Empleado no encontrado'}), 404
        
        data = request.get_json()
        
        # Actualizar campos si se proporcionan
        if 'nombre' in data:
            empleado.nombre = data['nombre']
        
        if 'tipo' in data:
            tipos_validos = ['operario', 'operario_especializado', 'propietario']
            if data['tipo'] not in tipos_validos:
                return jsonify({'error': f'El tipo debe ser uno de: {", ".join(tipos_validos)}'}), 400
            empleado.tipo = data['tipo']
        
        if 'tarifa_por_hora' in data:
            nueva_tarifa = float(data['tarifa_por_hora'])
            if nueva_tarifa <= 0:
                return jsonify({'error': 'La tarifa debe ser mayor a 0'}), 400
            empleado.tarifa_por_hora = nueva_tarifa
        
        db.session.commit()
        
        # Recalcular productos que usan este empleado
        productos_actualizados = recalcular_productos_por_empleado(empleado_id)
        
        return jsonify({
            'mensaje': 'Empleado actualizado correctamente',
            'empleado': empleado.to_dict(),
            'productos_recalculados': len(productos_actualizados)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@empleados_bp.route('/api/empleados/<int:empleado_id>', methods=['DELETE'])
def eliminar_empleado(empleado_id):
    """Desactivar un empleado (soft delete)"""
    try:
        empleado = Empleado.query.get(empleado_id)
        if not empleado:
            return jsonify({'error': 'Empleado no encontrado'}), 404
        
        empleado.activo = False
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Empleado desactivado correctamente'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
