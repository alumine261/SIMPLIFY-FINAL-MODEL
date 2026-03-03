from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from src.models.calculadora import db, ProductosFijos
import os
import json
from datetime import datetime

productos_fijos_bp = Blueprint('productos_fijos', __name__)

# Configuración para subida de archivos
UPLOAD_FOLDER = 'src/static/uploads/productos'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def ensure_upload_folder():
    """Asegura que el directorio de uploads existe"""
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@productos_fijos_bp.route('/productos-fijos', methods=['GET'])
def listar_productos_fijos():
    """Lista todos los productos fijos"""
    try:
        productos = ProductosFijos.query.filter_by(activo=True).order_by(ProductosFijos.fecha_creacion.desc()).all()
        
        productos_data = []
        for producto in productos:
            producto_dict = {
                'id': producto.id,
                'nombre': producto.nombre,
                'descripcion': producto.descripcion,
                'categoria': producto.categoria,
                'precio_base': producto.precio_base,
                'precio_actualizado': producto.calcular_precio_actualizado(),
                'foto_url': f'/static/uploads/productos/{producto.foto_filename}' if producto.foto_filename else None,
                'notas': producto.notas,
                'fecha_creacion': producto.fecha_creacion.isoformat(),
                'fecha_actualizacion': producto.fecha_actualizacion.isoformat() if producto.fecha_actualizacion else None
            }
            productos_data.append(producto_dict)
        
        return jsonify({
            'success': True,
            'data': productos_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al listar productos fijos: {str(e)}'
        }), 500

@productos_fijos_bp.route('/productos-fijos', methods=['POST'])
def crear_producto_fijo():
    """Crea un nuevo producto fijo"""
    try:
        ensure_upload_folder()
        
        # Obtener datos del formulario
        nombre = request.form.get('nombre')
        descripcion = request.form.get('descripcion', '')
        categoria = request.form.get('categoria', '')
        notas = request.form.get('notas', '')
        precio_calculado = request.form.get('precio_calculado')
        desglose_calculo = request.form.get('desglose_calculo')
        datos_originales = request.form.get('datos_originales')
        
        # Validar datos requeridos
        if not nombre or not precio_calculado:
            return jsonify({
                'success': False,
                'error': 'Nombre y precio calculado son requeridos'
            }), 400
        
        # Manejar archivo de foto
        foto_filename = None
        if 'foto' in request.files:
            file = request.files['foto']
            if file and file.filename != '' and allowed_file(file.filename):
                # Generar nombre único para el archivo
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = secure_filename(file.filename)
                name, ext = os.path.splitext(filename)
                foto_filename = f"{timestamp}_{name}{ext}"
                
                # Guardar archivo
                file_path = os.path.join(UPLOAD_FOLDER, foto_filename)
                file.save(file_path)
        
        # Crear nuevo producto fijo
        nuevo_producto = ProductosFijos(
            nombre=nombre,
            descripcion=descripcion,
            categoria=categoria,
            precio_base=float(precio_calculado),
            foto_filename=foto_filename,
            notas=notas,
            desglose_calculo=desglose_calculo,
            datos_originales=datos_originales
        )
        
        db.session.add(nuevo_producto)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': nuevo_producto.id,
                'nombre': nuevo_producto.nombre,
                'precio_base': nuevo_producto.precio_base,
                'foto_url': f'/static/uploads/productos/{foto_filename}' if foto_filename else None
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al crear producto fijo: {str(e)}'
        }), 500

@productos_fijos_bp.route('/productos-fijos/<int:producto_id>', methods=['GET'])
def obtener_producto_fijo(producto_id):
    """Obtiene un producto fijo específico"""
    try:
        producto = ProductosFijos.query.filter_by(id=producto_id, activo=True).first()
        
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto fijo no encontrado'
            }), 404
        
        producto_data = {
            'id': producto.id,
            'nombre': producto.nombre,
            'descripcion': producto.descripcion,
            'categoria': producto.categoria,
            'precio_base': producto.precio_base,
            'precio_actualizado': producto.calcular_precio_actualizado(),
            'foto_url': f'/static/uploads/productos/{producto.foto_filename}' if producto.foto_filename else None,
            'notas': producto.notas,
            'desglose_calculo': json.loads(producto.desglose_calculo) if producto.desglose_calculo else None,
            'datos_originales': json.loads(producto.datos_originales) if producto.datos_originales else None,
            'fecha_creacion': producto.fecha_creacion.isoformat(),
            'fecha_actualizacion': producto.fecha_actualizacion.isoformat() if producto.fecha_actualizacion else None
        }
        
        return jsonify({
            'success': True,
            'data': producto_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener producto fijo: {str(e)}'
        }), 500

@productos_fijos_bp.route('/productos-fijos/<int:producto_id>', methods=['PUT'])
def actualizar_producto_fijo(producto_id):
    """Actualiza un producto fijo existente"""
    try:
        producto = ProductosFijos.query.filter_by(id=producto_id, activo=True).first()
        
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto fijo no encontrado'
            }), 404
        
        # Obtener datos del formulario
        nombre = request.form.get('nombre')
        descripcion = request.form.get('descripcion')
        categoria = request.form.get('categoria')
        notas = request.form.get('notas')
        
        # Actualizar campos si se proporcionan
        if nombre:
            producto.nombre = nombre
        if descripcion is not None:
            producto.descripcion = descripcion
        if categoria is not None:
            producto.categoria = categoria
        if notas is not None:
            producto.notas = notas
        
        # Manejar nueva foto si se proporciona
        if 'foto' in request.files:
            file = request.files['foto']
            if file and file.filename != '' and allowed_file(file.filename):
                ensure_upload_folder()
                
                # Eliminar foto anterior si existe
                if producto.foto_filename:
                    old_file_path = os.path.join(UPLOAD_FOLDER, producto.foto_filename)
                    if os.path.exists(old_file_path):
                        os.remove(old_file_path)
                
                # Guardar nueva foto
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = secure_filename(file.filename)
                name, ext = os.path.splitext(filename)
                foto_filename = f"{timestamp}_{name}{ext}"
                
                file_path = os.path.join(UPLOAD_FOLDER, foto_filename)
                file.save(file_path)
                producto.foto_filename = foto_filename
        
        producto.fecha_actualizacion = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': producto.id,
                'nombre': producto.nombre,
                'precio_actualizado': producto.calcular_precio_actualizado()
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al actualizar producto fijo: {str(e)}'
        }), 500

@productos_fijos_bp.route('/productos-fijos/<int:producto_id>', methods=['DELETE'])
def eliminar_producto_fijo(producto_id):
    """Elimina (desactiva) un producto fijo"""
    try:
        producto = ProductosFijos.query.filter_by(id=producto_id, activo=True).first()
        
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto fijo no encontrado'
            }), 404
        
        # Marcar como inactivo en lugar de eliminar
        producto.activo = False
        producto.fecha_actualizacion = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Producto fijo eliminado exitosamente'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al eliminar producto fijo: {str(e)}'
        }), 500

@productos_fijos_bp.route('/productos-fijos/<int:producto_id>/recalcular', methods=['POST'])
def recalcular_producto_fijo(producto_id):
    """Recalcula el precio de un producto fijo con la cotización actual"""
    try:
        producto = ProductosFijos.query.filter_by(id=producto_id, activo=True).first()
        
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto fijo no encontrado'
            }), 404
        
        precio_actualizado = producto.calcular_precio_actualizado()
        
        return jsonify({
            'success': True,
            'data': {
                'id': producto.id,
                'nombre': producto.nombre,
                'precio_base': producto.precio_base,
                'precio_actualizado': precio_actualizado,
                'diferencia': precio_actualizado - producto.precio_base,
                'porcentaje_cambio': ((precio_actualizado - producto.precio_base) / producto.precio_base) * 100 if producto.precio_base > 0 else 0
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al recalcular producto fijo: {str(e)}'
        }), 500

