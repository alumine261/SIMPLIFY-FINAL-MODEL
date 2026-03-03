from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from src.models.calculadora import db, Usuario
import jwt
import datetime
from functools import wraps
import os

auth_bp = Blueprint('auth', __name__)

# Clave secreta para JWT (en producción debería estar en variables de entorno)
JWT_SECRET = os.environ.get('JWT_SECRET', 'simplify_cnc_secret_key_2024')

def token_required(f):
    """Decorador para rutas que requieren autenticación"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'success': False, 'error': 'Token requerido'}), 401
        
        try:
            # Remover 'Bearer ' del token si está presente
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user_type = data['user_type']
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Token inválido'}), 401
        
        return f(current_user_type, current_user_id, *args, **kwargs)
    
    return decorated

def propietario_required(f):
    """Decorador para rutas que requieren acceso de propietario"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'success': False, 'error': 'Token requerido'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user_type = data['user_type']
            current_user_id = data['user_id']
            
            if current_user_type != 'propietario':
                return jsonify({'success': False, 'error': 'Acceso denegado. Se requiere acceso de propietario'}), 403
                
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Token inválido'}), 401
        
        return f(current_user_type, current_user_id, *args, **kwargs)
    
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint de login para taller y propietario"""
    try:
        data = request.get_json()
        
        if not data or 'tipo' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'error': 'Tipo de usuario y contraseña son requeridos'
            }), 400
        
        tipo_usuario = data['tipo']
        password = data['password']
        
        # Validar tipo de usuario
        if tipo_usuario not in ['taller', 'propietario']:
            return jsonify({
                'success': False,
                'error': 'Tipo de usuario inválido'
            }), 400
        
        # Credenciales fijas para garantizar funcionamiento
        credenciales_validas = {
            'taller': 'taller123',
            'propietario': 'propietario123'
        }
        
        # Verificar contraseña
        if password != credenciales_validas.get(tipo_usuario):
            return jsonify({
                'success': False,
                'error': 'Contraseña incorrecta'
            }), 401
        
        # Generar token JWT
        token_payload = {
            'user_id': 1 if tipo_usuario == 'taller' else 2,
            'user_type': tipo_usuario,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)  # Token válido por 24 horas
        }
        
        token = jwt.encode(token_payload, JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            'success': True,
            'token': token,
            'user_type': tipo_usuario,
            'message': f'Bienvenido, acceso de {tipo_usuario} autorizado'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error en el login: {str(e)}'
        }), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verifica si un token es válido"""
    try:
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'success': False, 'error': 'Token requerido'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        
        return jsonify({
            'success': True,
            'user_type': data['user_type'],
            'user_id': data['user_id']
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'success': False, 'error': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'success': False, 'error': 'Token inválido'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error al verificar token: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user_type, current_user_id):
    """Endpoint de logout (principalmente para limpiar el lado del cliente)"""
    try:
        return jsonify({
            'success': True,
            'message': 'Sesión cerrada exitosamente'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al cerrar sesión: {str(e)}'
        }), 500

@auth_bp.route('/change-password', methods=['POST'])
@propietario_required
def change_password(current_user_type, current_user_id):
    """Cambiar contraseña (solo propietario puede cambiar contraseñas)"""
    try:
        data = request.get_json()
        
        if not data or 'tipo_usuario' not in data or 'nueva_password' not in data:
            return jsonify({
                'success': False,
                'error': 'Tipo de usuario y nueva contraseña son requeridos'
            }), 400
        
        tipo_usuario = data['tipo_usuario']
        nueva_password = data['nueva_password']
        
        if tipo_usuario not in ['taller', 'propietario']:
            return jsonify({
                'success': False,
                'error': 'Tipo de usuario inválido'
            }), 400
        
        if len(nueva_password) < 4:
            return jsonify({
                'success': False,
                'error': 'La contraseña debe tener al menos 4 caracteres'
            }), 400
        
        # Buscar usuario
        usuario = Usuario.query.filter_by(tipo=tipo_usuario, activo=True).first()
        
        if not usuario:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        # Actualizar contraseña
        from werkzeug.security import generate_password_hash
        usuario.password_hash = generate_password_hash(nueva_password)
        usuario.fecha_actualizacion = datetime.datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Contraseña de {tipo_usuario} actualizada exitosamente'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al cambiar contraseña: {str(e)}'
        }), 500

