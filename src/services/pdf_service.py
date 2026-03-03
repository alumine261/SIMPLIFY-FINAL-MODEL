from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas
from io import BytesIO
import os
import json

def generar_pdf_presupuesto(presupuesto, cliente):
    """
    Genera un PDF profesional del presupuesto con diseño moderno
    Paleta de colores: blanco, negro y azul potente
    """
    buffer = BytesIO()
    
    # Crear documento PDF con márgenes ajustados para que entre en una página
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=0.8*cm,
        bottomMargin=2*cm
    )
    
    # Colores corporativos - Azul potente con tonos negros
    AZUL_POTENTE = colors.HexColor('#1E3A8A')  # Azul oscuro potente
    GRIS_OSCURO = colors.HexColor('#2C3E50')
    NEGRO = colors.black
    BLANCO = colors.white
    
    # Estilos
    styles = getSampleStyleSheet()
    
    # Estilo para título (alineado a la izquierda)
    style_titulo = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=GRIS_OSCURO,
        spaceAfter=5,
        alignment=TA_LEFT,  # Alineado a la izquierda
        fontName='Helvetica-Bold'
    )
    
    # Estilo para slogan (debajo del logo, MUY cerca)
    style_slogan = ParagraphStyle(
        'Slogan',
        parent=styles['Normal'],
        fontSize=9,
        textColor=AZUL_POTENTE,
        spaceAfter=0,
        spaceBefore=2,  # Muy poco espacio antes
        alignment=TA_LEFT,
        fontName='Helvetica-Oblique',
        leading=10
    )
    
    # Estilo para texto normal
    style_normal = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=9,
        textColor=NEGRO,
        spaceAfter=3,
        fontName='Helvetica'
    )
    
    # Estilo para datos de contacto (más compacto)
    style_contacto = ParagraphStyle(
        'Contacto',
        parent=styles['Normal'],
        fontSize=9,
        textColor=GRIS_OSCURO,
        spaceAfter=0,
        spaceBefore=0,
        fontName='Helvetica',
        leading=11
    )
    
    # Estilo para pie de página
    style_footer = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=GRIS_OSCURO,
        alignment=TA_CENTER,
        fontName='Helvetica',
        leading=10
    )
    
    # Contenido del PDF
    story = []
    
    # ENCABEZADO: Datos izquierda (con mail abajo) | Logo+slogan derecha
    logo_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'simplify_logo.png')
    
    # Datos de contacto con mail en renglón separado
    datos_text = "<b>Simplify.cnc</b> | Dirección: Av. Colón 498 | Cel: 3816082833<br/>Mail: leandropereztello@gmail.com"
    
    # Logo + slogan pegados (sin espacio)
    style_slogan_derecha = ParagraphStyle(
        'SloganDerecha',
        parent=style_slogan,
        alignment=TA_CENTER,
        fontSize=8
    )
    
    logo_con_slogan = []
    if os.path.exists(logo_path):
        logo_con_slogan.append(Image(logo_path, width=1.3*inch, height=1.3*inch))
        logo_con_slogan.append(Spacer(1, 0.02*inch))  # Mínimo espacio
        logo_con_slogan.append(Paragraph("Con SIMPLIFY es posible", style_slogan_derecha))
    
    encabezado_data = [[
        Paragraph(datos_text, style_contacto),
        logo_con_slogan
    ]]
    
    encabezado_table = Table(encabezado_data, colWidths=[4.5*inch, 2*inch])
    encabezado_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Centrado vertical
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(encabezado_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Título PRESUPUESTO (alineado a la izquierda)
    titulo = Paragraph("PRESUPUESTO", style_titulo)
    story.append(titulo)
    story.append(Spacer(1, 0.15*inch))
    
    # Información del presupuesto y cliente en dos columnas
    info_data = [
        [Paragraph(f"<b>Presupuesto N°:</b> {presupuesto.numero}", style_normal),
         Paragraph(f"<b>Fecha:</b> {presupuesto.fecha.strftime('%d/%m/%Y')}", style_normal)],
        [Paragraph(f"<b>Cliente:</b> {cliente.nombre}", style_normal),
         Paragraph(f"<b>Empresa:</b> {cliente.empresa or 'N/A'}", style_normal)],
    ]
    
    if cliente.telefono:
        info_data.append([Paragraph(f"<b>Teléfono:</b> {cliente.telefono}", style_normal), ""])
    if cliente.email:
        info_data.append([Paragraph(f"<b>Email:</b> {cliente.email}", style_normal), ""])
    
    info_table = Table(info_data, colWidths=[3.5*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Tabla de productos
    items = json.loads(presupuesto.items)
    
    # Estilo para encabezado de tabla (letras blancas)
    style_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontSize=9,
        textColor=BLANCO,  # Letras blancas
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    # Encabezado de la tabla
    tabla_data = [
        [
            Paragraph("<b>CANTIDAD</b>", style_header),
            Paragraph("<b>DESCRIPCIÓN</b>", style_header),
            Paragraph("<b>PRECIO UNIT.</b>", style_header),
            Paragraph("<b>SUBTOTAL</b>", style_header)
        ]
    ]
    
    # Importar modelo de productos y db para buscar nombres
    from src.models.calculadora import ProductosFijos
    from src.models.user import db
    
    # Filas de productos y cálculo de total correcto
    total_calculado = 0
    for item in items:
        cantidad = item.get('cantidad', 1)
        
        # Obtener descripción
        descripcion = None
        
        # Primero intentar con el campo 'descripcion' si existe y no está vacío
        if 'descripcion' in item and item['descripcion']:
            descripcion = item['descripcion'].strip()
        
        # Si no hay descripción, buscar por producto_id
        if not descripcion and 'producto_id' in item:
            try:
                producto_id = int(item['producto_id'])
                # Usar db.session.get() que funciona dentro del contexto de Flask
                producto = db.session.get(ProductosFijos, producto_id)
                if producto and producto.nombre:
                    descripcion = producto.nombre
            except Exception as e:
                # Si falla, intentar con query directo
                try:
                    producto = ProductosFijos.query.filter_by(id=producto_id).first()
                    if producto and producto.nombre:
                        descripcion = producto.nombre
                except:
                    pass
        
        # Si aún no hay descripción, usar fallback
        if not descripcion:
            if 'producto_id' in item:
                descripcion = f"Producto ID {item['producto_id']}"
            else:
                descripcion = "Producto sin nombre"
        
        precio_unit = float(item.get('precio_unitario', 0))
        subtotal = cantidad * precio_unit
        total_calculado += subtotal
        
        tabla_data.append([
            Paragraph(str(cantidad), style_normal),
            Paragraph(descripcion, style_normal),
            Paragraph(f"$ {precio_unit:,.2f}", style_normal),
            Paragraph(f"$ {subtotal:,.2f}", style_normal)
        ])
    
    # Crear tabla
    tabla = Table(tabla_data, colWidths=[1*inch, 3*inch, 1.5*inch, 1.5*inch])
    tabla.setStyle(TableStyle([
        # Encabezado
        ('BACKGROUND', (0, 0), (-1, 0), AZUL_POTENTE),
        ('TEXTCOLOR', (0, 0), (-1, 0), BLANCO),  # Letras blancas
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        
        # Cuerpo
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # Cantidad centrada
        ('ALIGN', (1, 1), (1, -1), 'LEFT'),    # Descripción a la izquierda
        ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),  # Precios a la derecha
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [BLANCO, colors.HexColor('#F0F0F0')]),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        
        # Bordes
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOX', (0, 0), (-1, -1), 1, GRIS_OSCURO),
    ]))
    story.append(tabla)
    story.append(Spacer(1, 0.2*inch))
    
    # Totales (alineados a la derecha, con $ y valor a la misma altura)
    totales_data = []
    
    if presupuesto.descuento_total and presupuesto.descuento_total > 0:
        totales_data.append([
            Paragraph("<b>SUBTOTAL:</b>", style_normal),
            Paragraph(f"$ {presupuesto.subtotal:,.2f}", style_normal)
        ])
        totales_data.append([
            Paragraph("<b>DESCUENTO:</b>", style_normal),
            Paragraph(f"- $ {presupuesto.descuento_total:,.2f}", style_normal)
        ])
    
    # TOTAL con $ y valor en la misma línea
    style_total = ParagraphStyle(
        'Total',
        parent=styles['Normal'],
        fontSize=16,
        textColor=AZUL_POTENTE,
        fontName='Helvetica-Bold',
        alignment=TA_RIGHT
    )
    
    totales_data.append([
        Paragraph("<b>TOTAL:</b>", style_total),
        Paragraph(f"$ {total_calculado:,.2f}", style_total)
    ])
    
    totales_table = Table(totales_data, colWidths=[4.5*inch, 2*inch])
    totales_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LINEABOVE', (0, -1), (-1, -1), 2, AZUL_POTENTE),
    ]))
    story.append(totales_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Forma de Pago (título más suave)
    style_condiciones = ParagraphStyle(
        'Condiciones',
        parent=styles['Normal'],
        fontSize=9,
        textColor=NEGRO,
        spaceAfter=2,
        fontName='Helvetica',
        leading=12
    )
    
    condiciones = f"""
    <b>FORMA DE PAGO:</b><br/>
    • El trabajo se da de alta con una seña del 50%<br/>
    • Recibimos efectivo o transferencia<br/>
    • La fecha de entrega es confirmada una vez dado de alta el trabajo<br/>
    <br/>
    <b>VALIDEZ:</b> 7 días | <b>MONEDA:</b> Pesos argentinos (ARS)
    """
    story.append(Paragraph(condiciones, style_condiciones))
    
    # Pie de página con datos personales (dos líneas)
    story.append(Spacer(1, 0.3*inch))
    footer_text = """
    <b>Leandro Horacio Pérez Tello</b><br/>
    CUIT: 20-38184952-0
    """
    story.append(Paragraph(footer_text, style_footer))
    
    # Construir PDF
    doc.build(story)
    
    # Mover el puntero al inicio del buffer
    buffer.seek(0)
    return buffer
