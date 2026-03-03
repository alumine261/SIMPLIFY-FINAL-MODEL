from flask import Blueprint, request, jsonify
from src.models.materiales import Material, db
from src.services.recalculo_service import recalcular_productos_por_material

materiales_bp = Blueprint('materiales', __name__)

@materiales_bp.route('/api/materiales', methods=['GET'])
def obtener_materiales():
    """Obtener todos los materiales activos"""
    try:
        materiales = Material.query.filter_by(activo=True).all()
        return jsonify([material.to_dict() for material in materiales])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materiales_bp.route('/api/materiales/<int:material_id>', methods=['GET'])
def obtener_material(material_id):
    """Obtener un material específico"""
    try:
        material = Material.query.get_or_404(material_id)
        return jsonify(material.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materiales_bp.route('/api/materiales', methods=['POST'])
def crear_material():
    """Crear un nuevo material (solo propietarios)"""
    try:
        data = request.get_json()
        
        nuevo_material = Material(
            nombre=data['nombre'],
            descripcion=data.get('descripcion', ''),
            precio_por_m2=float(data['precio_por_m2']),
            espesor=data.get('espesor', ''),
            color=data.get('color', ''),
            categoria=data.get('categoria', '')
        )
        
        db.session.add(nuevo_material)
        db.session.commit()
        
        return jsonify(nuevo_material.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materiales_bp.route('/api/materiales/<int:material_id>', methods=['PUT'])
def actualizar_material(material_id):
    """Actualizar un material existente (solo propietarios)"""
    try:
        material = Material.query.get_or_404(material_id)
        data = request.get_json()
        
        material.nombre = data.get('nombre', material.nombre)
        material.descripcion = data.get('descripcion', material.descripcion)
        material.precio_por_m2 = float(data.get('precio_por_m2', material.precio_por_m2))
        material.espesor = data.get('espesor', material.espesor)
        material.color = data.get('color', material.color)
        material.categoria = data.get('categoria', material.categoria)
        material.activo = data.get('activo', material.activo)
        
        db.session.commit()
        
        # Recalcular productos que usan este material
        productos_actualizados = recalcular_productos_por_material(material_id)
        
        response = material.to_dict()
        response['productos_recalculados'] = len(productos_actualizados)
        
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materiales_bp.route('/api/materiales/<int:material_id>', methods=['DELETE'])
def eliminar_material(material_id):
    """Eliminar (desactivar) un material (solo propietarios)"""
    try:
        material = Material.query.get_or_404(material_id)
        material.activo = False
        db.session.commit()
        
        return jsonify({'mensaje': 'Material desactivado correctamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materiales_bp.route('/api/calcular-costo-material', methods=['POST'])
def calcular_costo_material():
    """Calcular el costo total del material basado en material y dimensiones"""
    try:
        data = request.get_json()
        material_id = data['material_id']
        ancho = float(data['ancho'])  # en metros
        alto = float(data['alto'])    # en metros
        cantidad = int(data.get('cantidad', 1))
        
        material = Material.query.get_or_404(material_id)
        
        area_total = ancho * alto * cantidad
        costo_total = area_total * material.precio_por_m2
        
        return jsonify({
            'material': material.to_dict(),
            'ancho': ancho,
            'alto': alto,
            'cantidad': cantidad,
            'area_total': area_total,
            'costo_total': costo_total,
            'precio_por_m2': material.precio_por_m2
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
