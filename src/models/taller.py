from src.models.user import db
from datetime import datetime


class TrabajoPendiente(db.Model):
    """Trabajo asignado a empleados a partir de un presupuesto aprobado"""
    __tablename__ = 'trabajos_pendientes'

    id = db.Column(db.Integer, primary_key=True)
    presupuesto_id = db.Column(db.Integer, db.ForeignKey('presupuestos.id'), nullable=False)
    producto_nombre = db.Column(db.String(200), nullable=False)
    cantidad = db.Column(db.Float, nullable=False, default=1)
    fecha_entrega = db.Column(db.Date, nullable=True)
    estado = db.Column(db.String(50), default='pendiente')  # pendiente, en_progreso, entregado, tarde
    fecha_entrega_real = db.Column(db.DateTime, nullable=True)
    valor_sueldo = db.Column(db.Float, default=0)  # Valor Y del presupuesto para este item
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    tareas = db.relationship('TareaEmpleado', backref='trabajo', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'presupuesto_id': self.presupuesto_id,
            'producto_nombre': self.producto_nombre,
            'cantidad': self.cantidad,
            'fecha_entrega': self.fecha_entrega.isoformat() if self.fecha_entrega else None,
            'estado': self.estado,
            'fecha_entrega_real': self.fecha_entrega_real.isoformat() if self.fecha_entrega_real else None,
            'valor_sueldo': self.valor_sueldo,
            'created_at': self.created_at.isoformat(),
            'tareas': [t.to_dict() for t in self.tareas]
        }


class TareaEmpleado(db.Model):
    """Tarea específica asignada a un empleado dentro de un trabajo"""
    __tablename__ = 'tareas_empleado'

    id = db.Column(db.Integer, primary_key=True)
    trabajo_id = db.Column(db.Integer, db.ForeignKey('trabajos_pendientes.id'), nullable=False)
    empleado_id = db.Column(db.Integer, db.ForeignKey('empleados.id'), nullable=False)
    nombre_tarea = db.Column(db.String(200), nullable=False)  # ej: "Corte", "Armado", "Pegado"
    horas_estimadas = db.Column(db.Float, nullable=False)  # horas × cantidad
    valor_sueldo_tarea = db.Column(db.Float, default=0)  # porción del sueldo para esta tarea
    compartida_con = db.Column(db.String(200), nullable=True)  # nombres de otros empleados si es compartida
    completada = db.Column(db.Boolean, default=False)
    fecha_completada = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    empleado = db.relationship('Empleado', backref='tareas', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'trabajo_id': self.trabajo_id,
            'empleado_id': self.empleado_id,
            'empleado_nombre': self.empleado.nombre if self.empleado else '',
            'nombre_tarea': self.nombre_tarea,
            'horas_estimadas': self.horas_estimadas,
            'valor_sueldo_tarea': self.valor_sueldo_tarea,
            'compartida_con': self.compartida_con,
            'completada': self.completada,
            'fecha_completada': self.fecha_completada.isoformat() if self.fecha_completada else None,
            'created_at': self.created_at.isoformat()
        }


class MetricaEmpleadoPeriodo(db.Model):
    """Métricas acumuladas de un empleado en un período 28→27"""
    __tablename__ = 'metricas_empleado_periodo'

    id = db.Column(db.Integer, primary_key=True)
    empleado_id = db.Column(db.Integer, db.ForeignKey('empleados.id'), nullable=False)
    periodo_id = db.Column(db.Integer, db.ForeignKey('periodos_kpi.id'), nullable=False)
    valor_producido = db.Column(db.Float, default=0)  # suma de valor_sueldo_tarea completadas
    sueldo_real_pagado = db.Column(db.Float, nullable=True)  # cargado manualmente el día 28
    tareas_completadas = db.Column(db.Integer, default=0)
    trabajos_entregados_tarde = db.Column(db.Integer, default=0)
    recompensa_ganada = db.Column(db.Boolean, default=False)
    cerrado = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    empleado = db.relationship('Empleado', backref='metricas', lazy=True)

    @property
    def ratio_produccion(self):
        """Producido / Sueldo pagado"""
        if not self.sueldo_real_pagado or self.sueldo_real_pagado == 0:
            return None
        return round(self.valor_producido / self.sueldo_real_pagado, 3)

    @property
    def estado_color(self):
        ratio = self.ratio_produccion
        if ratio is None:
            return 'gris'
        if ratio >= 1.5:
            return 'recompensa'
        if ratio > 1:
            return 'verde'
        if ratio == 1:
            return 'amarillo'
        return 'rojo'

    def to_dict(self):
        return {
            'id': self.id,
            'empleado_id': self.empleado_id,
            'empleado_nombre': self.empleado.nombre if self.empleado else '',
            'periodo_id': self.periodo_id,
            'valor_producido': self.valor_producido,
            'sueldo_real_pagado': self.sueldo_real_pagado,
            'tareas_completadas': self.tareas_completadas,
            'trabajos_entregados_tarde': self.trabajos_entregados_tarde,
            'ratio_produccion': self.ratio_produccion,
            'estado_color': self.estado_color,
            'recompensa_ganada': self.recompensa_ganada,
            'cerrado': self.cerrado
        }


class MetricaEmpleadoAnual(db.Model):
    """Métricas anuales acumuladas de un empleado"""
    __tablename__ = 'metricas_empleado_anual'

    id = db.Column(db.Integer, primary_key=True)
    empleado_id = db.Column(db.Integer, db.ForeignKey('empleados.id'), nullable=False)
    anio = db.Column(db.Integer, nullable=False)
    valor_producido_total = db.Column(db.Float, default=0)
    sueldo_real_total = db.Column(db.Float, default=0)
    tareas_completadas_total = db.Column(db.Integer, default=0)
    periodos_incluidos = db.Column(db.Text, default='[]')  # JSON list de periodo_ids
    recompensas_ganadas = db.Column(db.Integer, default=0)

    empleado = db.relationship('Empleado', backref='metricas_anuales', lazy=True)

    @property
    def ratio_anual(self):
        if not self.sueldo_real_total or self.sueldo_real_total == 0:
            return None
        return round(self.valor_producido_total / self.sueldo_real_total, 3)

    def to_dict(self):
        return {
            'id': self.id,
            'empleado_id': self.empleado_id,
            'empleado_nombre': self.empleado.nombre if self.empleado else '',
            'anio': self.anio,
            'valor_producido_total': self.valor_producido_total,
            'sueldo_real_total': self.sueldo_real_total,
            'tareas_completadas_total': self.tareas_completadas_total,
            'ratio_anual': self.ratio_anual,
            'recompensas_ganadas': self.recompensas_ganadas
        }
