"""
Servicio para recalcular automáticamente los precios de productos del catálogo
cuando cambian los precios de materiales, empleados o máquinas.
"""
import json
from src.models.producto_catalogo import ProductoCatalogo, db
from src.models.materiales import Material
from src.models.empleado import Empleado
from src.models.calculadora import Maquinas

def recalcular_producto(producto_id):
    """
    Recalcula el precio de un producto basándose en sus datos_calculo
    y los precios actuales de materiales, empleados y máquinas.
    
    Returns:
        dict: {
            'success': bool,
            'producto_id': int,
            'precio_anterior': float,
            'precio_nuevo': float,
            'cambio_porcentual': float
        }
    """
    try:
        producto = ProductoCatalogo.query.get(producto_id)
        if not producto or not producto.datos_calculo:
            return {'success': False, 'error': 'Producto no encontrado o sin datos de cálculo'}
        
        datos = json.loads(producto.datos_calculo)
        precio_anterior = producto.precio
        
        # Calcular costos de materiales
        costo_materiales = 0
        if 'materiales' in datos:
            for mat_data in datos['materiales']:
                material = Material.query.get(int(mat_data['id']))
                if material:
                    # Usar precio actual del material
                    cantidad = float(mat_data['cantidad'])
                    costo_materiales += material.precio_por_m2 * cantidad
        
        # Calcular costos de empleados
        costo_empleados = 0
        if 'empleados' in datos:
            for emp_data in datos['empleados']:
                empleado = Empleado.query.get(int(emp_data['id']))
                if empleado:
                    # Usar tarifa actual del empleado
                    horas = float(emp_data['horas'])
                    costo_empleados += empleado.tarifa_por_hora * horas
        
        # Calcular costos de máquinas
        costo_maquinas = 0
        if 'maquinas' in datos:
            for maq_data in datos['maquinas']:
                maquina = Maquinas.query.get(int(maq_data['id']))
                if maquina:
                    # Usar costo actual de la máquina
                    horas = float(maq_data['horas'])
                    costo_maquinas += maquina.calcular_costo_por_hora() * horas
        
        # Calcular costos indirectos (si están guardados en datos_calculo)
        costos_indirectos = datos.get('costos_indirectos', 0)
        
        # Calcular costo total
        costo_total = costo_materiales + costo_empleados + costo_maquinas + costos_indirectos
        
        # Aplicar factor de ganancia
        factor_ganancia = datos.get('factor_ganancia', 2.0)
        precio_nuevo = costo_total * factor_ganancia
        
        # Actualizar producto
        producto.precio = precio_nuevo
        producto.costo = costo_total
        db.session.commit()
        
        # Calcular cambio porcentual
        cambio_porcentual = 0
        if precio_anterior > 0:
            cambio_porcentual = ((precio_nuevo - precio_anterior) / precio_anterior) * 100
        
        return {
            'success': True,
            'producto_id': producto_id,
            'nombre': producto.nombre,
            'precio_anterior': precio_anterior,
            'precio_nuevo': precio_nuevo,
            'cambio_porcentual': cambio_porcentual
        }
    
    except Exception as e:
        db.session.rollback()
        return {'success': False, 'error': str(e)}

def recalcular_productos_por_material(material_id):
    """
    Recalcula todos los productos que usan un material específico.
    
    Returns:
        list: Lista de resultados de recalculo
    """
    productos = ProductoCatalogo.query.filter(ProductoCatalogo.activo == True).all()
    resultados = []
    
    for producto in productos:
        if not producto.datos_calculo:
            continue
        
        datos = json.loads(producto.datos_calculo)
        materiales = datos.get('materiales', [])
        
        # Verificar si el producto usa este material (comparar como string e int)
        if any(str(mat['id']) == str(material_id) for mat in materiales):
            resultado = recalcular_producto(producto.id)
            if resultado['success']:
                resultados.append(resultado)
    
    return resultados

def recalcular_productos_por_empleado(empleado_id):
    """
    Recalcula todos los productos que usan un empleado específico.
    
    Returns:
        list: Lista de resultados de recalculo
    """
    productos = ProductoCatalogo.query.filter(ProductoCatalogo.activo == True).all()
    resultados = []
    
    for producto in productos:
        if not producto.datos_calculo:
            continue
        
        datos = json.loads(producto.datos_calculo)
        empleados = datos.get('empleados', [])
        
        # Verificar si el producto usa este empleado (comparar como string e int)
        if any(str(emp['id']) == str(empleado_id) for emp in empleados):
            resultado = recalcular_producto(producto.id)
            if resultado['success']:
                resultados.append(resultado)
    
    return resultados

def recalcular_productos_por_maquina(maquina_id):
    """
    Recalcula todos los productos que usan una máquina específica.
    
    Returns:
        list: Lista de resultados de recalculo
    """
    productos = ProductoCatalogo.query.filter(ProductoCatalogo.activo == True).all()
    resultados = []
    
    for producto in productos:
        if not producto.datos_calculo:
            continue
        
        datos = json.loads(producto.datos_calculo)
        maquinas = datos.get('maquinas', [])
        
        # Verificar si el producto usa esta máquina (comparar como string e int)
        if any(str(maq['id']) == str(maquina_id) for maq in maquinas):
            resultado = recalcular_producto(producto.id)
            if resultado['success']:
                resultados.append(resultado)
    
    return resultados

def recalcular_todos_los_productos():
    """
    Recalcula todos los productos activos del catálogo.
    
    Returns:
        list: Lista de resultados de recalculo
    """
    productos = ProductoCatalogo.query.filter(ProductoCatalogo.activo == True).all()
    resultados = []
    
    for producto in productos:
        if not producto.datos_calculo:
            continue
        
        resultado = recalcular_producto(producto.id)
        if resultado['success']:
            resultados.append(resultado)
    
    return resultados
