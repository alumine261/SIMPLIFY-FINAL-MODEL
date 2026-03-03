from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.cliente import Cliente
import secrets
import string

clientes_bp = Blueprint('clientes', __name__)

def generar_codigo_seguimiento():
    """Genera un código único de 8 caracteres para seguimiento"""
    caracteres = string.ascii_uppercase + string.digits
    while True:
        codigo = ''.join(secrets.choice(caracteres) for _ in range(8))
        # Verificar que no exista
        if not Cliente.query.filter_by(codigo_seguimiento=codigo).first():
            return codigo

@clientes_bp.route('/api/clientes', methods=['GET'])
def get_clientes():
    """Obtener todos los clientes"""
    try:
        clientes = Cliente.query.all()
        return jsonify({
            'success': True,
            'clientes': [cliente.to_dict() for cliente in clientes]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@clientes_bp.route('/api/clientes/<int:id>', methods=['GET'])
def get_cliente(id):
    """Obtener un cliente por ID"""
    try:
        cliente = Cliente.query.get_or_404(id)
        return jsonify({
            'success': True,
            'cliente': cliente.to_dict()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@clientes_bp.route('/api/clientes', methods=['POST'])
def crear_cliente():
    """Crear nuevo cliente"""
    try:
        data = request.get_json()
        
        # Generar código de seguimiento
        codigo = generar_codigo_seguimiento()
        
        cliente = Cliente(
            nombre=data.get('nombre'),
            empresa=data.get('empresa'),
            telefono=data.get('telefono'),
            email=data.get('email'),
            direccion=data.get('direccion'),
            codigo_seguimiento=codigo
        )
        
        db.session.add(cliente)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'cliente': cliente.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@clientes_bp.route('/api/clientes/<int:id>', methods=['PUT'])
def actualizar_cliente(id):
    """Actualizar cliente existente"""
    try:
        cliente = Cliente.query.get_or_404(id)
        data = request.get_json()
        
        cliente.nombre = data.get('nombre', cliente.nombre)
        cliente.empresa = data.get('empresa', cliente.empresa)
        cliente.telefono = data.get('telefono', cliente.telefono)
        cliente.email = data.get('email', cliente.email)
        cliente.direccion = data.get('direccion', cliente.direccion)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'cliente': cliente.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@clientes_bp.route('/api/clientes/<int:id>', methods=['DELETE'])
def eliminar_cliente(id):
    """Eliminar cliente"""
    try:
        cliente = Cliente.query.get_or_404(id)
        db.session.delete(cliente)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Cliente eliminado correctamente'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
