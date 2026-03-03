import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.models.calculadora import CostosBase, Maquinas, ProductosFijos, CotizacionDolar, Usuario
from src.routes.user import user_bp
from src.routes.calculadora import calculadora_bp
from src.routes.calculadora_multiple import calculadora_multiple_bp
from src.routes.calculadora_multiple_maquinas import calculadora_multiple_maquinas_bp
from src.routes.productos_fijos import productos_fijos_bp
from src.routes.auth import auth_bp
from src.routes.cotizaciones import cotizaciones_bp, init_cotizaciones_db
from src.routes.materiales import materiales_bp
from src.models.materiales import init_materiales_db
from src.routes.empleados import empleados_bp
from src.routes.maquinas import maquinas_bp
from src.routes.costos_fijos import costos_fijos_bp
from src.routes.costos_base import costos_base_bp
from src.routes.clientes import clientes_bp
from src.routes.catalogo import catalogo_bp
from src.routes.presupuestos import presupuestos_bp
from src.models.kpi import PeriodoKPI, ResumenAnualKPI
from src.routes.kpi import kpi_bp
from src.models.taller import TrabajoPendiente, TareaEmpleado, MetricaEmpleadoPeriodo, MetricaEmpleadoAnual
from src.routes.taller import taller_bp
from src.services.dolar_service import dolar_service

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Habilitar CORS para todas las rutas
CORS(app)

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(calculadora_bp, url_prefix='/api')
app.register_blueprint(calculadora_multiple_bp, url_prefix='/api')
app.register_blueprint(calculadora_multiple_maquinas_bp, url_prefix='/api')
app.register_blueprint(productos_fijos_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(cotizaciones_bp)
app.register_blueprint(materiales_bp)
app.register_blueprint(empleados_bp)
app.register_blueprint(maquinas_bp)
app.register_blueprint(costos_fijos_bp, url_prefix='/api')
app.register_blueprint(costos_base_bp)
app.register_blueprint(clientes_bp)
app.register_blueprint(catalogo_bp)
app.register_blueprint(presupuestos_bp)
app.register_blueprint(kpi_bp, url_prefix='/api')
app.register_blueprint(taller_bp)

# Ruta de la base de datos: usa DATA_DIR si está definido (Railway Volume), si no usa la carpeta local
_data_dir = os.environ.get('DATA_DIR', os.path.join(os.path.dirname(__file__), 'database'))
os.makedirs(_data_dir, exist_ok=True)
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(_data_dir, 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()
    
    # Inicializar base de datos de cotizaciones
    init_cotizaciones_db()
    
    # Inicializar base de datos de materiales
    init_materiales_db()
    
    # Inicializar datos base si no existen
    if not CostosBase.query.first():
        costos_iniciales = CostosBase()
        db.session.add(costos_iniciales)
        db.session.commit()
    
    # Inicializar máquinas si no existen
    if not Maquinas.query.first():
        from datetime import datetime
        
        maquinas_iniciales = [
            Maquinas(
                nombre="Láser CO2 #1",
                costo_inicial=2700000,
                vida_util_meses=12,
                horas_semanales=28,
                fecha_compra=datetime(2024, 3, 1),
                costo_mantenimiento_mensual=50000
            ),
            Maquinas(
                nombre="Láser CO2 #2", 
                costo_inicial=2700000,
                vida_util_meses=24,
                horas_semanales=28,
                fecha_compra=datetime(2024, 12, 1),
                costo_mantenimiento_mensual=25000
            ),
            Maquinas(
                nombre="Cortadora Polyfan",
                costo_inicial=500000,
                vida_util_meses=48,  # 4 años restantes
                horas_semanales=7,
                fecha_compra=datetime(2022, 1, 1),
                costo_mantenimiento_mensual=2500
            ),
            Maquinas(
                nombre="Impresora Magna 2 230",
                costo_inicial=90000,
                vida_util_meses=48,  # 4 años restantes
                horas_semanales=7,
                fecha_compra=datetime(2023, 6, 1),
                costo_mantenimiento_mensual=1250
            ),
            Maquinas(
                nombre="Impresora Ender 3",
                costo_inicial=60000,
                vida_util_meses=36,  # 3 años
                horas_semanales=7,
                fecha_compra=datetime(2024, 7, 1),
                costo_mantenimiento_mensual=1250
            ),
            Maquinas(
                nombre="Impresora Resina",
                costo_inicial=64000,
                vida_util_meses=48,  # 4 años restantes
                horas_semanales=20,
                fecha_compra=datetime(2022, 1, 1),
                costo_mantenimiento_mensual=3021
            )
        ]
        
        for maquina in maquinas_iniciales:
            db.session.add(maquina)
        
        db.session.commit()
    
    # Inicializar servicio de dólar
    dolar_service.init_app(app)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        response = send_from_directory(static_folder_path, path)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            response = send_from_directory(static_folder_path, 'index.html')
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
            return response
        else:
            return "index.html not found", 404


@app.route('/')
def serve_frontend():
    """Sirve la aplicación React"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    """Sirve archivos estáticos de React"""
    if path.startswith('api/'):
        # Las rutas de API se manejan por los blueprints
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # Intentar servir el archivo solicitado
    try:
        return send_from_directory(app.static_folder, path)
    except:
        # Si el archivo no existe, servir index.html (para React Router)
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
