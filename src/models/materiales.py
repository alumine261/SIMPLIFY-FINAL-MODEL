from flask_sqlalchemy import SQLAlchemy
from src.models.user import db

class Material(db.Model):
    __tablename__ = 'materiales'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.String(200))
    precio_por_m2 = db.Column(db.Float, nullable=False)  # Precio por unidad
    unidad_medida = db.Column(db.String(10), default='m²')  # m², ml, Gr, U
    espesor = db.Column(db.String(50))  # Ej: "3mm", "5mm", etc.
    color = db.Column(db.String(50))
    categoria = db.Column(db.String(50))  # Ej: "Acrílico", "MDF", "Madera", etc.
    activo = db.Column(db.Boolean, default=True)
    fecha_actualizacion = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'precio_por_m2': self.precio_por_m2,
            'precio': self.precio_por_m2,  # Alias para compatibilidad
            'unidad_medida': self.unidad_medida,
            'espesor': self.espesor,
            'color': self.color,
            'categoria': self.categoria,
            'activo': self.activo
        }

def init_materiales_db():
    """Inicializar la base de datos con materiales básicos"""
    if Material.query.count() == 0:
        materiales_iniciales = [
            Material(
                nombre="Acrílico Transparente 3mm",
                descripcion="Acrílico transparente de 3mm de espesor",
                precio_por_m2=15000.0,
                espesor="3mm",
                color="Transparente",
                categoria="Acrílico"
            ),
            Material(
                nombre="Acrílico Negro 3mm",
                descripcion="Acrílico negro de 3mm de espesor",
                precio_por_m2=16000.0,
                espesor="3mm",
                color="Negro",
                categoria="Acrílico"
            ),
            Material(
                nombre="Acrílico Blanco 3mm",
                descripcion="Acrílico blanco de 3mm de espesor",
                precio_por_m2=16000.0,
                espesor="3mm",
                color="Blanco",
                categoria="Acrílico"
            ),
            Material(
                nombre="MDF 3mm",
                descripcion="MDF de 3mm de espesor",
                precio_por_m2=8000.0,
                espesor="3mm",
                color="Natural",
                categoria="MDF"
            ),
            Material(
                nombre="MDF 5mm",
                descripcion="MDF de 5mm de espesor",
                precio_por_m2=12000.0,
                espesor="5mm",
                color="Natural",
                categoria="MDF"
            ),
            Material(
                nombre="Madera Pino 10mm",
                descripcion="Madera de pino de 10mm de espesor",
                precio_por_m2=25000.0,
                espesor="10mm",
                color="Natural",
                categoria="Madera"
            ),
            Material(
                nombre="Cartón Corrugado 3mm",
                descripcion="Cartón corrugado de 3mm",
                precio_por_m2=3000.0,
                espesor="3mm",
                color="Natural",
                categoria="Cartón"
            ),
            Material(
                nombre="PLA Filamento",
                descripcion="Filamento PLA para impresión 3D",
                precio_por_m2=5000.0,
                espesor="Variable",
                color="Varios",
                categoria="Filamento"
            ),
            Material(
                nombre="Resina UV",
                descripcion="Resina UV para impresión 3D",
                precio_por_m2=8000.0,
                espesor="Variable",
                color="Varios",
                categoria="Resina"
            )
        ]
        
        for material in materiales_iniciales:
            db.session.add(material)
        
        db.session.commit()
        print("Materiales iniciales agregados a la base de datos")
