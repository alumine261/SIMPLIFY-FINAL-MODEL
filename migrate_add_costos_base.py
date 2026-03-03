import sqlite3
import json

# Conectar a la base de datos
conn = sqlite3.connect('/home/ubuntu/calculadora-limpia/src/database/app.db')
cursor = conn.cursor()

# Crear tabla costos_base si no existe
cursor.execute('''
CREATE TABLE IF NOT EXISTS costos_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    horas_mensuales REAL DEFAULT 600.0,
    costos_fijos TEXT,
    mantenimiento TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# Insertar registro por defecto si no existe
cursor.execute('SELECT COUNT(*) FROM costos_base')
count = cursor.fetchone()[0]

if count == 0:
    costos_fijos_default = json.dumps({
        'luz': 0,
        'gas': 0,
        'internet': 0,
        'telefono': 0,
        'alquiler': 0,
        'impuestos_fijos': 0,
        'manus': 0
    })
    
    mantenimiento_default = json.dumps({
        'basico': 0,
        'reserva_reparaciones': 0
    })
    
    cursor.execute('''
    INSERT INTO costos_base (horas_mensuales, costos_fijos, mantenimiento)
    VALUES (?, ?, ?)
    ''', (600.0, costos_fijos_default, mantenimiento_default))
    
    print("✅ Registro de costos_base creado con valores por defecto")
else:
    print("✅ Tabla costos_base ya existe con datos")

conn.commit()
conn.close()

print("✅ Migración completada exitosamente")
