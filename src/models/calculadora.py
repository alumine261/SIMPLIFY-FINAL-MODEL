from src.models.user import db
from datetime import datetime
import json

class CostosBase(db.Model):
    __tablename__ = 'costos_base'
    
    id = db.Column(db.Integer, primary_key=True)
    # Costos fijos mensuales (en pesos)
    luz = db.Column(db.Float, default=35000)
    gas = db.Column(db.Float, default=6000)
    internet = db.Column(db.Float, default=18000)
    telefono = db.Column(db.Float, default=8000)
    alquiler = db.Column(db.Float, default=250000)
    impuestos_fijos = db.Column(db.Float, default=11600)
    manus = db.Column(db.Float, default=20000)  # USD 19 convertido a pesos
    
    # Mantenimiento
    mantenimiento_basico = db.Column(db.Float, default=30000)
    reserva_reparaciones = db.Column(db.Float, default=83333)
    
    # Tarifas de mano de obra (en pesos por hora)
    tarifa_tatiana = db.Column(db.Float, default=2000)
    tarifa_tatiana_pintura = db.Column(db.Float, default=2400)
    tarifa_ana = db.Column(db.Float, default=2000)
    tarifa_daniel = db.Column(db.Float, default=2100)
    tarifa_dueno = db.Column(db.Float, default=2400)
    
    # Horas mensuales productivas
    horas_mensuales = db.Column(db.Float, default=160)
    
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    def calcular_costos_indirectos(self, horas_trabajo, cotizacion_dolar=None):
        """
        Calcula los costos indirectos basados en las horas de trabajo
        Los costos indirectos son una porción proporcional de los gastos fijos
        """
        # Costos fijos mensuales de la tabla CostosBase
        costos_fijos_base = (
            self.luz + self.gas + self.internet + self.telefono + 
            self.alquiler + self.impuestos_fijos + self.manus + 
            self.mantenimiento_basico + self.reserva_reparaciones
        )
        
        # Sumar costos fijos adicionales de la tabla costos_fijos
        from src.models.costo_fijo import CostoFijo
        costos_fijos_adicionales = db.session.query(db.func.sum(CostoFijo.monto_mensual)).filter(
            CostoFijo.activo == True
        ).scalar() or 0
        
        # Total de costos fijos mensuales
        costos_fijos_mensuales = costos_fijos_base + costos_fijos_adicionales
        
        # Usar horas mensuales configuradas (por defecto 160)
        costo_indirecto_por_hora = costos_fijos_mensuales / self.horas_mensuales
        
        # Calcular costos indirectos proporcionales a las horas trabajadas
        costos_indirectos = costo_indirecto_por_hora * horas_trabajo
        
        return costos_indirectos
    
    def to_dict(self):
        return {
            'id': self.id,
            'costos_fijos': {
                'luz': self.luz,
                'gas': self.gas,
                'internet': self.internet,
                'telefono': self.telefono,
                'alquiler': self.alquiler,
                'impuestos_fijos': self.impuestos_fijos,
                'manus': self.manus
            },
            'mantenimiento': {
                'basico': self.mantenimiento_basico,
                'reserva_reparaciones': self.reserva_reparaciones
            },
            'horas_mensuales': self.horas_mensuales,
            'tarifas_mano_obra': {
                'tatiana': self.tarifa_tatiana,
                'tatiana_pintura': self.tarifa_tatiana_pintura,
                'ana': self.tarifa_ana,
                'daniel': self.tarifa_daniel,
                'dueno': self.tarifa_dueno
            },
            'fecha_actualizacion': self.fecha_actualizacion.isoformat()
        }

class Maquinas(db.Model):
    __tablename__ = 'maquinas'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    costo_inicial = db.Column(db.Float, nullable=False)  # En pesos
    vida_util_meses = db.Column(db.Integer, nullable=False)
    horas_semanales = db.Column(db.Float, nullable=False)
    fecha_compra = db.Column(db.DateTime, nullable=False)
    activa = db.Column(db.Boolean, default=True)
    
    # Costos de mantenimiento específicos
    costo_mantenimiento_mensual = db.Column(db.Float, default=0)
    
    def calcular_depreciacion_mensual(self):
        return self.costo_inicial / self.vida_util_meses
    
    def calcular_horas_mensuales(self):
        return self.horas_semanales * 4
    
    def calcular_costo_por_hora(self):
        depreciacion_mensual = self.calcular_depreciacion_mensual()
        horas_mensuales = self.calcular_horas_mensuales()
        if horas_mensuales == 0:
            return 0
        return (depreciacion_mensual + self.costo_mantenimiento_mensual) / horas_mensuales
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'costo_inicial': self.costo_inicial,
            'vida_util_meses': self.vida_util_meses,
            'horas_semanales': self.horas_semanales,
            'fecha_compra': self.fecha_compra.isoformat(),
            'activa': self.activa,
            'costo_mantenimiento_mensual': self.costo_mantenimiento_mensual,
            'depreciacion_mensual': self.calcular_depreciacion_mensual(),
            'horas_mensuales': self.calcular_horas_mensuales(),
            'costo_por_hora': self.calcular_costo_por_hora()
        }

class ProductosFijos(db.Model):
    __tablename__ = 'productos_fijos'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)
    imagen_url = db.Column(db.String(500))
    
    # Datos del cálculo
    costo_material = db.Column(db.Float, nullable=False)  # En pesos
    horas_trabajo = db.Column(db.Float, nullable=False)
    tipo_empleado = db.Column(db.String(50), nullable=False)  # tatiana, ana, daniel, dueno
    horas_maquina = db.Column(db.Float, nullable=False)
    tipo_maquina = db.Column(db.String(100), nullable=False)
    
    # Precios calculados
    costo_real = db.Column(db.Float)  # Calculado automáticamente
    precio_sugerido = db.Column(db.Float)  # Con factor de ganancia
    factor_ganancia = db.Column(db.Float, default=2.0)
    
    # Comparación con precio actual
    precio_actual_cobrado = db.Column(db.Float)  # Lo que cobra actualmente
    
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        diferencia_precio = None
        porcentaje_diferencia = None
        
        if self.precio_actual_cobrado and self.precio_sugerido:
            diferencia_precio = self.precio_sugerido - self.precio_actual_cobrado
            porcentaje_diferencia = (diferencia_precio / self.precio_actual_cobrado) * 100
        
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'imagen_url': self.imagen_url,
            'calculo': {
                'costo_material': self.costo_material,
                'horas_trabajo': self.horas_trabajo,
                'tipo_empleado': self.tipo_empleado,
                'horas_maquina': self.horas_maquina,
                'tipo_maquina': self.tipo_maquina,
                'factor_ganancia': self.factor_ganancia
            },
            'precios': {
                'costo_real': self.costo_real,
                'precio_sugerido': self.precio_sugerido,
                'precio_actual_cobrado': self.precio_actual_cobrado,
                'diferencia_precio': diferencia_precio,
                'porcentaje_diferencia': porcentaje_diferencia
            },
            'fecha_creacion': self.fecha_creacion.isoformat(),
            'activo': self.activo
        }

class CotizacionDolar(db.Model):
    __tablename__ = 'cotizacion_dolar'
    
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.Date, nullable=False, unique=True)
    compra = db.Column(db.Float, nullable=False)
    venta = db.Column(db.Float, nullable=False)
    promedio = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'fecha': self.fecha.isoformat(),
            'compra': self.compra,
            'venta': self.venta,
            'promedio': self.promedio
        }

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)  # 'taller' o 'propietario'
    activo = db.Column(db.Boolean, default=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    ultimo_acceso = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'tipo': self.tipo,
            'activo': self.activo,
            'fecha_creacion': self.fecha_creacion.isoformat(),
            'ultimo_acceso': self.ultimo_acceso.isoformat() if self.ultimo_acceso else None
        }
