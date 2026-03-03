#!/usr/bin/env python3
"""
Script de migración: Agregar columna unidad_medida a la tabla materiales
"""
import sqlite3
import os

DB_PATH = '/home/ubuntu/calculadora-limpia/src/database/app.db'

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"❌ Base de datos no encontrada en {DB_PATH}")
        return False
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Verificar si la columna ya existe
        cursor.execute("PRAGMA table_info(materiales)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'unidad_medida' in columns:
            print("✅ La columna 'unidad_medida' ya existe")
            return True
        
        # Agregar columna unidad_medida con valor por defecto 'm²'
        cursor.execute("""
            ALTER TABLE materiales 
            ADD COLUMN unidad_medida TEXT DEFAULT 'm²'
        """)
        
        # Actualizar todos los registros existentes con 'm²'
        cursor.execute("""
            UPDATE materiales 
            SET unidad_medida = 'm²' 
            WHERE unidad_medida IS NULL
        """)
        
        conn.commit()
        print("✅ Columna 'unidad_medida' agregada exitosamente")
        print("✅ Todos los materiales existentes configurados con unidad 'm²'")
        return True
        
    except Exception as e:
        print(f"❌ Error en la migración: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == '__main__':
    print("🔄 Iniciando migración: Agregar columna unidad_medida...")
    success = migrate()
    if success:
        print("✅ Migración completada exitosamente")
    else:
        print("❌ Migración fallida")
