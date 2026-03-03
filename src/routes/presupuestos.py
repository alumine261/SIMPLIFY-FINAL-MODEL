from flask import Blueprint, jsonify, request, send_file
from src.models.user import db
from src.models.presupuesto import Presupuesto
from src.models.cliente import Cliente
from src.services.pdf_service import generar_pdf_presupuesto
from datetime import datetime

presupuestos_bp = Blueprint('presupuestos', __name__)

def generar_numero_presupuesto():
    """Genera el siguiente número de presupuesto secuencial.
    Se resetea a 0001 cuando el año cambia (el ciclo cierra el 28/12 de cada año)."""
    hoy = datetime.now()
    # El ciclo anual va del 29/12 de un año al 28/12 del siguiente.
    # Si estamos antes del 28/12 del año actual, el ciclo empezó el 29/12 del año anterior.
    # Si estamos después del 28/12, el ciclo empezó el 29/12 de este año.
    if hoy.month == 12 and hoy.day >= 29:
        inicio_ciclo = datetime(hoy.year, 12, 29)
    else:
        inicio_ciclo = datetime(hoy.year - 1, 12, 29)

    # Buscar el último presupuesto dentro del ciclo actual
    ultimo = Presupuesto.query.filter(
        Presupuesto.created_at >= inicio_ciclo
    ).order_by(Presupuesto.id.desc()).first()

    if ultimo and ultimo.numero:
        try:
            # El número puede tener formato AAAA-NNNN o solo NNNN
            parte_num = ultimo.numero.split('-')[-1]
            ultimo_num = int(parte_num)
            siguiente = ultimo_num + 1
        except:
            siguiente = 1
    else:
        siguiente = 1  # Primer presupuesto del ciclo

    # Formato: Año-Número, ej: 2026-0001
    return f"{hoy.year}-{str(siguiente).zfill(4)}"

@presupuestos_bp.route('/api/presupuestos', methods=['GET'])
def get_presupuestos():
    """Obtener todos los presupuestos"""
    try:
        presupuestos = Presupuesto.query.order_by(Presupuesto.created_at.desc()).all()
        return jsonify({
            'success': True,
            'presupuestos': [p.to_dict() for p in presupuestos]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@presupuestos_bp.route('/api/presupuestos/<int:id>', methods=['GET'])
def get_presupuesto(id):
    """Obtener un presupuesto por ID"""
    try:
        presupuesto = Presupuesto.query.get_or_404(id)
        return jsonify({
            'success': True,
            'presupuesto': presupuesto.to_dict()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@presupuestos_bp.route('/api/presupuestos', methods=['POST'])
def crear_presupuesto():
    """Crear nuevo presupuesto"""
    try:
        data = request.get_json()
        
        # Generar número de presupuesto
        numero = generar_numero_presupuesto()
        
        presupuesto = Presupuesto(
            numero=numero,
            cliente_id=data.get('cliente_id'),
            vendedor=data.get('vendedor', 'Leandro Perez Tello'),
            items=data.get('items'),
            subtotal=data.get('subtotal', 0),
            descuento_total=data.get('descuento_total', 0),
            total=data.get('total'),
            estado='borrador'
        )
        
        db.session.add(presupuesto)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'presupuesto': presupuesto.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@presupuestos_bp.route('/api/presupuestos/<int:id>', methods=['PUT'])
def actualizar_presupuesto(id):
    """Actualizar presupuesto existente"""
    try:
        presupuesto = Presupuesto.query.get_or_404(id)
        data = request.get_json()
        
        presupuesto.cliente_id = data.get('cliente_id', presupuesto.cliente_id)
        presupuesto.vendedor = data.get('vendedor', presupuesto.vendedor)
        presupuesto.items = data.get('items', presupuesto.items)
        presupuesto.subtotal = data.get('subtotal', presupuesto.subtotal)
        presupuesto.descuento_total = data.get('descuento_total', presupuesto.descuento_total)
        presupuesto.total = data.get('total', presupuesto.total)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'presupuesto': presupuesto.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@presupuestos_bp.route('/api/presupuestos/<int:id>/aprobar', methods=['POST'])
def aprobar_presupuesto(id):
    """Aprobar presupuesto y guardar snapshot de componentes X,Y,Z,T,G"""
    try:
        import json
        from src.models.producto_catalogo import ProductoCatalogo
        
        presupuesto = Presupuesto.query.get_or_404(id)
        
        # Guardar snapshot de componentes al momento de aprobar
        if presupuesto.items:
            items = json.loads(presupuesto.items)
            items_actualizados = False
            
            for item in items:
                # Solo guardar snapshot si no existe ya
                if item.get('snapshot_x') is None and item.get('producto_id'):
                    try:
                        producto = ProductoCatalogo.query.get(int(item['producto_id']))
                        if producto and producto.datos_calculo:
                            datos = json.loads(producto.datos_calculo)
                            resultado = datos.get('resultado', {})
                            precio_catalogo = resultado.get('precio_final', 0) or 0
                            precio_unit = float(item.get('precio_unitario', 0))
                            descuento_pct = float(item.get('descuento', 0))
                            precio_neto = precio_unit * (1 - descuento_pct / 100)
                            
                            # Factor de escala: ajustar componentes al precio real del presupuesto
                            factor = (precio_neto / precio_catalogo) if precio_catalogo else 1
                            
                            item['snapshot_x'] = round((resultado.get('costo_materiales', 0) or 0) * factor, 4)
                            item['snapshot_y'] = round((resultado.get('costo_mano_obra', 0) or 0) * factor, 4)
                            item['snapshot_z'] = round((resultado.get('costo_maquinas', 0) or 0) * factor, 4)
                            item['snapshot_t'] = round((resultado.get('costos_indirectos', 0) or 0) * factor, 4)
                            item['snapshot_g'] = round((resultado.get('ganancia', 0) or 0) * factor, 4)
                            items_actualizados = True
                    except Exception:
                        pass
            
            if items_actualizados:
                presupuesto.items = json.dumps(items)
        
        presupuesto.estado = 'aprobado'
        presupuesto.fecha_aprobacion = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'presupuesto': presupuesto.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@presupuestos_bp.route('/api/presupuestos/<int:id>/rechazar', methods=['POST'])
def rechazar_presupuesto(id):
    """Rechazar presupuesto"""
    try:
        presupuesto = Presupuesto.query.get_or_404(id)
        presupuesto.estado = 'rechazado'
        presupuesto.fecha_rechazo = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'presupuesto': presupuesto.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@presupuestos_bp.route('/api/presupuestos/<int:id>', methods=['DELETE'])
def eliminar_presupuesto(id):
    """Eliminar presupuesto"""
    try:
        presupuesto = Presupuesto.query.get_or_404(id)
        db.session.delete(presupuesto)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Presupuesto eliminado correctamente'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@presupuestos_bp.route('/api/presupuestos/<int:id>/pdf', methods=['GET'])
def generar_pdf(id):
    """Generar PDF del presupuesto para enviar al cliente"""
    try:
        from src.models.producto_catalogo import ProductoCatalogo
        import json
        
        presupuesto = Presupuesto.query.get_or_404(id)
        cliente = Cliente.query.get_or_404(presupuesto.cliente_id)
        
        # Resolver nombres de productos ANTES de generar el PDF
        items = json.loads(presupuesto.items)
        for item in items:
            # Si no tiene descripción, buscar por producto_id
            if ('descripcion' not in item or not item['descripcion']) and 'producto_id' in item:
                try:
                    producto_id = int(item['producto_id'])
                    producto = ProductoCatalogo.query.get(producto_id)
                    if producto and producto.nombre:
                        item['descripcion'] = producto.nombre
                except:
                    pass
        
        # Actualizar items con descripciones resueltas
        presupuesto.items = json.dumps(items)
        
        # Generar PDF
        pdf_buffer = generar_pdf_presupuesto(presupuesto, cliente)
        
        # Nombre del archivo
        filename = f"Presupuesto_{presupuesto.numero}_{cliente.nombre.replace(' ', '_')}.pdf"
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@presupuestos_bp.route('/api/presupuestos/kpi', methods=['GET'])
def get_kpi_presupuestos():
    """Obtener KPI de presupuestos generados vs aprobados"""
    try:
        total = Presupuesto.query.count()
        aprobados = Presupuesto.query.filter_by(estado='aprobado').count()
        rechazados = Presupuesto.query.filter_by(estado='rechazado').count()
        borradores = Presupuesto.query.filter_by(estado='borrador').count()
        
        # Calcular porcentaje de aprobación
        tasa_aprobacion = (aprobados / total * 100) if total > 0 else 0
        tasa_rechazo = (rechazados / total * 100) if total > 0 else 0
        
        return jsonify({
            'success': True,
            'kpi': {
                'total_generados': total,
                'aprobados': aprobados,
                'rechazados': rechazados,
                'borradores': borradores,
                'tasa_aprobacion': round(tasa_aprobacion, 1),
                'tasa_rechazo': round(tasa_rechazo, 1)
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
