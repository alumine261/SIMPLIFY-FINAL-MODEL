from src.models.user import db
from datetime import datetime

class Presupuesto(db.Model):
    """Modelo para presupuestos"""
    __tablename__ = 'presupuestos'
    
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(50), unique=True, nullable=False)  # Ej: 10001, 10002
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    vendedor = db.Column(db.String(100))
    items = db.Column(db.Text)  # JSON con los items del presupuesto
    subtotal = db.Column(db.Float, default=0)
    descuento_total = db.Column(db.Float, default=0)
    total = db.Column(db.Float, nullable=False)
    estado = db.Column(db.String(20), default='borrador')  # borrador, aprobado, rechazado
    fecha_aprobacion = db.Column(db.DateTime)
    fecha_rechazo = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relación con cliente
    cliente = db.relationship('Cliente', backref='presupuestos')
    
    def to_dict(self):
        return {
            'id': self.id,
            'numero': self.numero,
            'cliente_id': self.cliente_id,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'vendedor': self.vendedor,
            'items': self.items,
            'subtotal': self.subtotal,
            'descuento_total': self.descuento_total,
            'total': self.total,
            'estado': self.estado,
            'fecha_aprobacion': self.fecha_aprobacion.isoformat() if self.fecha_aprobacion else None,
            'fecha_rechazo': self.fecha_rechazo.isoformat() if self.fecha_rechazo else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
