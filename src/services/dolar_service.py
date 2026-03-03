import requests
import schedule
import time
import threading
from datetime import date, datetime
from src.models.calculadora import db, CotizacionDolar
from flask import current_app

class DolarService:
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Inicializa el servicio con la aplicación Flask"""
        self.app = app
        
        # Programar actualización diaria a las 9:00 AM
        schedule.every().day.at("09:00").do(self._actualizar_cotizacion_job)
        
        # Iniciar el scheduler en un hilo separado
        scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        scheduler_thread.start()
        
        # Actualizar cotización al iniciar si no existe para hoy
        with app.app_context():
            self._verificar_cotizacion_hoy()
    
    def _run_scheduler(self):
        """Ejecuta el scheduler en un hilo separado"""
        while True:
            schedule.run_pending()
            time.sleep(60)  # Verificar cada minuto
    
    def _actualizar_cotizacion_job(self):
        """Job que se ejecuta diariamente para actualizar la cotización"""
        if self.app:
            with self.app.app_context():
                self.actualizar_cotizacion_dolar()
    
    def _verificar_cotizacion_hoy(self):
        """Verifica si existe cotización para hoy, si no la obtiene"""
        hoy = date.today()
        cotizacion_hoy = CotizacionDolar.query.filter_by(fecha=hoy).first()
        
        if not cotizacion_hoy:
            print(f"No existe cotización para {hoy}, obteniendo...")
            self.actualizar_cotizacion_dolar()
    
    def actualizar_cotizacion_dolar(self):
        """Actualiza la cotización del dólar oficial desde la API"""
        try:
            print("Actualizando cotización del dólar oficial...")
            
            # Intentar obtener de DolarAPI (más confiable)
            response = requests.get('https://dolarapi.com/v1/dolares/oficial', timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                compra = float(data['compra'])
                venta = float(data['venta'])
                promedio = (compra + venta) / 2
                
                hoy = date.today()
                
                # Verificar si ya existe cotización para hoy
                cotizacion_existente = CotizacionDolar.query.filter_by(fecha=hoy).first()
                
                if cotizacion_existente:
                    # Actualizar cotización existente
                    cotizacion_existente.compra = compra
                    cotizacion_existente.venta = venta
                    cotizacion_existente.promedio = promedio
                    print(f"Cotización actualizada: ${promedio:.2f}")
                else:
                    # Crear nueva cotización
                    nueva_cotizacion = CotizacionDolar(
                        fecha=hoy,
                        compra=compra,
                        venta=venta,
                        promedio=promedio
                    )
                    db.session.add(nueva_cotizacion)
                    print(f"Nueva cotización guardada: ${promedio:.2f}")
                
                db.session.commit()
                return True
                
            else:
                print(f"Error en API DolarAPI: {response.status_code}")
                return self._intentar_api_alternativa()
                
        except requests.exceptions.RequestException as e:
            print(f"Error de conexión con DolarAPI: {e}")
            return self._intentar_api_alternativa()
        except Exception as e:
            print(f"Error inesperado al actualizar cotización: {e}")
            return False
    
    def _intentar_api_alternativa(self):
        """Intenta obtener cotización de una API alternativa"""
        try:
            print("Intentando API alternativa...")
            
            # API alternativa: dolarsi.com
            response = requests.get('https://www.dolarsi.com/api/api.php?type=valoresprincipales', timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Buscar dólar oficial en la respuesta
                for item in data:
                    if item['casa']['nombre'] == 'Dolar Oficial':
                        compra = float(item['casa']['compra'].replace(',', '.'))
                        venta = float(item['casa']['venta'].replace(',', '.'))
                        promedio = (compra + venta) / 2
                        
                        hoy = date.today()
                        
                        # Verificar si ya existe cotización para hoy
                        cotizacion_existente = CotizacionDolar.query.filter_by(fecha=hoy).first()
                        
                        if cotizacion_existente:
                            cotizacion_existente.compra = compra
                            cotizacion_existente.venta = venta
                            cotizacion_existente.promedio = promedio
                        else:
                            nueva_cotizacion = CotizacionDolar(
                                fecha=hoy,
                                compra=compra,
                                venta=venta,
                                promedio=promedio
                            )
                            db.session.add(nueva_cotizacion)
                        
                        db.session.commit()
                        print(f"Cotización obtenida de API alternativa: ${promedio:.2f}")
                        return True
                
                print("No se encontró dólar blue en API alternativa")
                return False
                
        except Exception as e:
            print(f"Error con API alternativa: {e}")
            return False
    
    def obtener_cotizacion_actual(self):
        """Obtiene la cotización actual (de hoy o la más reciente)"""
        try:
            hoy = date.today()
            
            # Buscar cotización de hoy
            cotizacion_hoy = CotizacionDolar.query.filter_by(fecha=hoy).first()
            
            if cotizacion_hoy:
                return cotizacion_hoy
            
            # Si no existe para hoy, intentar actualizar
            if self.actualizar_cotizacion_dolar():
                cotizacion_hoy = CotizacionDolar.query.filter_by(fecha=hoy).first()
                if cotizacion_hoy:
                    return cotizacion_hoy
            
            # Si no se pudo actualizar, usar la más reciente
            ultima_cotizacion = CotizacionDolar.query.order_by(CotizacionDolar.fecha.desc()).first()
            return ultima_cotizacion
            
        except Exception as e:
            print(f"Error al obtener cotización actual: {e}")
            return None
    
    def obtener_historial_cotizaciones(self, dias=30):
        """Obtiene el historial de cotizaciones de los últimos N días"""
        try:
            cotizaciones = CotizacionDolar.query.order_by(CotizacionDolar.fecha.desc()).limit(dias).all()
            return cotizaciones
        except Exception as e:
            print(f"Error al obtener historial: {e}")
            return []

# Instancia global del servicio
dolar_service = DolarService()

