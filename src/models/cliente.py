from src.models.user import db
from datetime import datetime

class Cliente(db.Model):
    """Modelo para clientes"""
    __tablename__ = 'clientes'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    empresa = db.Column(db.String(100))
    telefono = db.Column(db.String(50))
    email = db.Column(db.String(100))
    direccion = db.Column(db.String(255))
    codigo_seguimiento = db.Column(db.String(20), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'empresa': self.empresa,
            'telefono': self.telefono,
            'email': self.email,
            'direccion': self.direccion,
            'codigo_seguimiento': self.codigo_seguimiento,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
