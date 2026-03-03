from flask import Blueprint, request, jsonify
import sqlite3
import json
from datetime import datetime

cotizaciones_bp = Blueprint('cotizaciones', __name__)

def init_cotizaciones_db():
    """Inicializar la tabla de cotizaciones"""
    conn = sqlite3.connect('calculadora.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cotizaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            cliente TEXT NOT NULL,
            descripcion TEXT,
            costo_material REAL NOT NULL,
            empleados TEXT NOT NULL,
            maquinas TEXT NOT NULL,
            factor_ganancia REAL NOT NULL,
            precio_final REAL NOT NULL,
            desglose TEXT NOT NULL,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

@cotizaciones_bp.route('/api/guardar-cotizacion', methods=['POST'])
def guardar_cotizacion():
    """Guardar una nueva cotización"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['fecha', 'cliente', 'costo_material', 'empleados', 'maquinas', 'factor_ganancia', 'precio_final', 'desglose']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Campo requerido: {field}'}), 400
        
        # Conectar a la base de datos
        conn = sqlite3.connect('calculadora.db')
        cursor = conn.cursor()
        
        # Insertar cotización
        cursor.execute('''
            INSERT INTO cotizaciones 
            (fecha, cliente, descripcion, costo_material, empleados, maquinas, factor_ganancia, precio_final, desglose)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['fecha'],
            data['cliente'],
            data.get('descripcion', ''),
            data['costo_material'],
            json.dumps(data['empleados']),
            json.dumps(data['maquinas']),
            data['factor_ganancia'],
            data['precio_final'],
            json.dumps(data['desglose'])
        ))
        
        cotizacion_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Cotización guardada exitosamente',
            'cotizacion_id': cotizacion_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@cotizaciones_bp.route('/api/cotizaciones', methods=['GET'])
def listar_cotizaciones():
    """Listar todas las cotizaciones"""
    try:
        conn = sqlite3.connect('calculadora.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, fecha, cliente, descripcion, precio_final, fecha_creacion
            FROM cotizaciones
            ORDER BY fecha_creacion DESC
        ''')
        
        cotizaciones = []
        for row in cursor.fetchall():
            cotizaciones.append({
                'id': row[0],
                'fecha': row[1],
                'cliente': row[2],
                'descripcion': row[3],
                'precio_final': row[4],
                'fecha_creacion': row[5]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': cotizaciones
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@cotizaciones_bp.route('/api/cotizaciones/<int:cotizacion_id>', methods=['GET'])
def obtener_cotizacion(cotizacion_id):
    """Obtener una cotización específica"""
    try:
        conn = sqlite3.connect('calculadora.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM cotizaciones WHERE id = ?
        ''', (cotizacion_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'success': False, 'error': 'Cotización no encontrada'}), 404
        
        cotizacion = {
            'id': row[0],
            'fecha': row[1],
            'cliente': row[2],
            'descripcion': row[3],
            'costo_material': row[4],
            'empleados': json.loads(row[5]),
            'maquinas': json.loads(row[6]),
            'factor_ganancia': row[7],
            'precio_final': row[8],
            'desglose': json.loads(row[9]),
            'fecha_creacion': row[10]
        }
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': cotizacion
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@cotizaciones_bp.route('/api/cotizaciones/<int:cotizacion_id>', methods=['DELETE'])
def eliminar_cotizacion(cotizacion_id):
    """Eliminar una cotización"""
    try:
        conn = sqlite3.connect('calculadora.db')
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM cotizaciones WHERE id = ?', (cotizacion_id,))
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Cotización no encontrada'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Cotización eliminada exitosamente'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
