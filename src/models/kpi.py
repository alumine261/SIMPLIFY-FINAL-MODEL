from src.models.user import db
from datetime import datetime


class PeriodoKPI(db.Model):
    """Almacena el resumen de KPIs de cada período cerrado (28 al 27)"""
    __tablename__ = 'periodos_kpi'

    id = db.Column(db.Integer, primary_key=True)
    # Identificación del período
    nombre = db.Column(db.String(50), nullable=False)       # Ej: "Feb 2026"
    fecha_inicio = db.Column(db.Date, nullable=False)        # Día 28 del mes anterior
    fecha_cierre = db.Column(db.Date, nullable=False)        # Día 27 del mes actual
    cerrado = db.Column(db.Boolean, default=False)           # True cuando se cierra el período
    fecha_cerrado = db.Column(db.DateTime)

    # Componentes acumulados de presupuestos APROBADOS (suma de todos los items × cantidad)
    total_vendido = db.Column(db.Float, default=0)           # Suma total facturado
    total_materiales = db.Column(db.Float, default=0)        # X: suma costo_materiales × cantidad
    total_sueldos_presupuestados = db.Column(db.Float, default=0)  # Y: suma costo_mano_obra × cantidad
    total_maquinas = db.Column(db.Float, default=0)          # Z: suma costo_maquinas × cantidad
    total_costos_indirectos_presupuestados = db.Column(db.Float, default=0)  # T: suma costos_indirectos × cantidad
    total_ganancia_presupuestada = db.Column(db.Float, default=0)  # G: suma ganancia × cantidad

    # Valores reales cargados manualmente
    sueldo_real_pagado = db.Column(db.Float, default=0)      # Cargado el día 28
    costos_indirectos_reales = db.Column(db.Float, default=0)  # Suma de costos fijos reales del período

    # Indicadores derivados
    # K = total_sueldos_presupuestados - sueldo_real_pagado
    # J = total_costos_indirectos_presupuestados - costos_indirectos_reales
    # Ganancia Real = G + K + J

    # Contadores de presupuestos
    cantidad_presupuestos_generados = db.Column(db.Integer, default=0)
    cantidad_presupuestos_aprobados = db.Column(db.Integer, default=0)
    cantidad_presupuestos_rechazados = db.Column(db.Integer, default=0)

    # PDF generado
    pdf_generado = db.Column(db.Boolean, default=False)
    fecha_pdf = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def K(self):
        """Diferencia sueldos presupuestados vs reales"""
        return self.total_sueldos_presupuestados - (self.sueldo_real_pagado or 0)

    @property
    def J(self):
        """Diferencia costos indirectos presupuestados vs reales"""
        return self.total_costos_indirectos_presupuestados - (self.costos_indirectos_reales or 0)

    @property
    def ganancia_real(self):
        """Ganancia Real = G + K + J"""
        return self.total_ganancia_presupuestada + self.K + self.J

    @property
    def tasa_conversion(self):
        """Porcentaje de presupuestos aprobados sobre generados"""
        if not self.cantidad_presupuestos_generados:
            return 0
        return round((self.cantidad_presupuestos_aprobados / self.cantidad_presupuestos_generados) * 100, 1)

    @property
    def ticket_promedio(self):
        """Ticket promedio de presupuestos aprobados"""
        if not self.cantidad_presupuestos_aprobados:
            return 0
        return self.total_vendido / self.cantidad_presupuestos_aprobados

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'fecha_inicio': self.fecha_inicio.isoformat(),
            'fecha_cierre': self.fecha_cierre.isoformat(),
            'cerrado': self.cerrado,
            'fecha_cerrado': self.fecha_cerrado.isoformat() if self.fecha_cerrado else None,
            # Componentes
            'total_vendido': self.total_vendido,
            'total_materiales': self.total_materiales,
            'total_sueldos_presupuestados': self.total_sueldos_presupuestados,
            'total_maquinas': self.total_maquinas,
            'total_costos_indirectos_presupuestados': self.total_costos_indirectos_presupuestados,
            'total_ganancia_presupuestada': self.total_ganancia_presupuestada,
            # Reales
            'sueldo_real_pagado': self.sueldo_real_pagado,
            'costos_indirectos_reales': self.costos_indirectos_reales,
            # Derivados
            'K': self.K,
            'J': self.J,
            'ganancia_real': self.ganancia_real,
            # Contadores
            'cantidad_presupuestos_generados': self.cantidad_presupuestos_generados,
            'cantidad_presupuestos_aprobados': self.cantidad_presupuestos_aprobados,
            'cantidad_presupuestos_rechazados': self.cantidad_presupuestos_rechazados,
            'tasa_conversion': self.tasa_conversion,
            'ticket_promedio': self.ticket_promedio,
            # PDF
            'pdf_generado': self.pdf_generado,
            'fecha_pdf': self.fecha_pdf.isoformat() if self.fecha_pdf else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ResumenAnualKPI(db.Model):
    """Almacena el resumen anual de KPIs (suma de los 12 períodos)"""
    __tablename__ = 'resumenes_anuales_kpi'

    id = db.Column(db.Integer, primary_key=True)
    anio = db.Column(db.Integer, nullable=False, unique=True)   # Ej: 2026
    cerrado = db.Column(db.Boolean, default=False)
    fecha_cerrado = db.Column(db.DateTime)

    # Acumulados anuales
    total_vendido = db.Column(db.Float, default=0)
    total_materiales = db.Column(db.Float, default=0)
    total_sueldos_presupuestados = db.Column(db.Float, default=0)
    total_maquinas = db.Column(db.Float, default=0)
    total_costos_indirectos_presupuestados = db.Column(db.Float, default=0)
    total_ganancia_presupuestada = db.Column(db.Float, default=0)
    sueldo_real_pagado = db.Column(db.Float, default=0)
    costos_indirectos_reales = db.Column(db.Float, default=0)
    cantidad_presupuestos_generados = db.Column(db.Integer, default=0)
    cantidad_presupuestos_aprobados = db.Column(db.Integer, default=0)
    cantidad_presupuestos_rechazados = db.Column(db.Integer, default=0)
    periodos_incluidos = db.Column(db.Text)   # JSON con IDs de períodos incluidos

    pdf_generado = db.Column(db.Boolean, default=False)
    fecha_pdf = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def K(self):
        return self.total_sueldos_presupuestados - (self.sueldo_real_pagado or 0)

    @property
    def J(self):
        return self.total_costos_indirectos_presupuestados - (self.costos_indirectos_reales or 0)

    @property
    def ganancia_real(self):
        return self.total_ganancia_presupuestada + self.K + self.J

    @property
    def tasa_conversion(self):
        if not self.cantidad_presupuestos_generados:
            return 0
        return round((self.cantidad_presupuestos_aprobados / self.cantidad_presupuestos_generados) * 100, 1)

    @property
    def ticket_promedio(self):
        if not self.cantidad_presupuestos_aprobados:
            return 0
        return self.total_vendido / self.cantidad_presupuestos_aprobados

    def to_dict(self):
        return {
            'id': self.id,
            'anio': self.anio,
            'cerrado': self.cerrado,
            'fecha_cerrado': self.fecha_cerrado.isoformat() if self.fecha_cerrado else None,
            'total_vendido': self.total_vendido,
            'total_materiales': self.total_materiales,
            'total_sueldos_presupuestados': self.total_sueldos_presupuestados,
            'total_maquinas': self.total_maquinas,
            'total_costos_indirectos_presupuestados': self.total_costos_indirectos_presupuestados,
            'total_ganancia_presupuestada': self.total_ganancia_presupuestada,
            'sueldo_real_pagado': self.sueldo_real_pagado,
            'costos_indirectos_reales': self.costos_indirectos_reales,
            'K': self.K,
            'J': self.J,
            'ganancia_real': self.ganancia_real,
            'cantidad_presupuestos_generados': self.cantidad_presupuestos_generados,
            'cantidad_presupuestos_aprobados': self.cantidad_presupuestos_aprobados,
            'cantidad_presupuestos_rechazados': self.cantidad_presupuestos_rechazados,
            'tasa_conversion': self.tasa_conversion,
            'ticket_promedio': self.ticket_promedio,
            'pdf_generado': self.pdf_generado,
            'fecha_pdf': self.fecha_pdf.isoformat() if self.fecha_pdf else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
