from src.models.user import db
from datetime import datetime

class ProductoCatalogo(db.Model):
    """Modelo para productos del catálogo (productos fijos reutilizables)"""
    __tablename__ = 'productos_catalogo'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)
    categoria = db.Column(db.String(100))
    precio = db.Column(db.Float, nullable=False)
    costo = db.Column(db.Float)
    datos_calculo = db.Column(db.Text)  # JSON con datos de la calculadora
    activo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'categoria': self.categoria,
            'precio': self.precio,
            'costo': self.costo,
            'datos_calculo': self.datos_calculo,
            'activo': self.activo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
