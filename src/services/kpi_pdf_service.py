"""
Servicio de generación de PDF para KPIs mensuales y anuales de Simplify.cnc
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
import os

AZUL = colors.HexColor('#1e3a8a')
AZUL_CLARO = colors.HexColor('#dbeafe')
VERDE = colors.HexColor('#16a34a')
ROJO = colors.HexColor('#dc2626')
GRIS = colors.HexColor('#6b7280')
GRIS_CLARO = colors.HexColor('#f8fafc')
AMARILLO = colors.HexColor('#f59e0b')
VIOLETA = colors.HexColor('#7c3aed')
BLANCO = colors.white
NEGRO = colors.HexColor('#111827')


def fmt(n):
    """Formatea número como moneda argentina"""
    if n is None:
        return '$ 0,00'
    try:
        n = float(n)
        return f'$ {n:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    except Exception:
        return '$ 0,00'


def signo_color(v):
    """Devuelve color según signo del valor"""
    try:
        v = float(v)
        if v > 0:
            return VERDE
        if v < 0:
            return ROJO
        return GRIS
    except Exception:
        return GRIS


def signo_str(v):
    try:
        return '+' if float(v) > 0 else ''
    except Exception:
        return ''


def generar_pdf_kpi(datos, tipo='mensual'):
    """
    Genera el PDF de KPI mensual o anual.
    datos: dict con los campos del PeriodoKPI o ResumenAnualKPI
    tipo: 'mensual' o 'anual'
    Retorna BytesIO con el PDF generado.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.8 * cm,
        leftMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Estilos personalizados ────────────────────────────────────────────────
    estilo_titulo = ParagraphStyle(
        'titulo', parent=styles['Normal'],
        fontSize=22, fontName='Helvetica-Bold', textColor=AZUL,
        alignment=TA_CENTER, spaceAfter=4
    )
    estilo_subtitulo = ParagraphStyle(
        'subtitulo', parent=styles['Normal'],
        fontSize=11, fontName='Helvetica', textColor=GRIS,
        alignment=TA_CENTER, spaceAfter=2
    )
    estilo_seccion = ParagraphStyle(
        'seccion', parent=styles['Normal'],
        fontSize=11, fontName='Helvetica-Bold', textColor=AZUL,
        spaceBefore=10, spaceAfter=4
    )
    estilo_normal = ParagraphStyle(
        'normal_kpi', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica', textColor=NEGRO
    )
    estilo_formula = ParagraphStyle(
        'formula', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica-Oblique', textColor=GRIS,
        alignment=TA_CENTER
    )

    # ── Logo + Encabezado ─────────────────────────────────────────────────────
    logo_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'simplify_logo.png')
    logo_jpg = os.path.join(os.path.dirname(__file__), '..', 'static', 'simplify.jpg')

    from reportlab.platypus import Image as RLImage
    logo_elem = None
    for lp in [logo_path, logo_jpg]:
        if os.path.exists(lp):
            try:
                logo_elem = RLImage(lp, width=1.4 * inch, height=0.7 * inch)
                break
            except Exception:
                pass

    datos_empresa = [
        Paragraph('<b>Simplify.cnc</b>', ParagraphStyle('emp', fontSize=10, fontName='Helvetica-Bold', textColor=NEGRO)),
        Paragraph('Dirección: Av. Colón 498', ParagraphStyle('emp2', fontSize=9, fontName='Helvetica', textColor=GRIS)),
        Paragraph('Cel: 3816082833', ParagraphStyle('emp2', fontSize=9, fontName='Helvetica', textColor=GRIS)),
        Paragraph('Mail: leandropereztello@gmail.com', ParagraphStyle('emp2', fontSize=9, fontName='Helvetica', textColor=GRIS)),
    ]

    logo_con_slogan = [logo_elem] if logo_elem else []
    logo_con_slogan.append(
        Paragraph('<i>Con SIMPLIFY es posible</i>',
                  ParagraphStyle('slogan', fontSize=8, fontName='Helvetica-Oblique',
                                 textColor=AZUL, alignment=TA_CENTER, spaceBefore=2))
    )

    encabezado_data = [[datos_empresa, logo_con_slogan]]
    encabezado_table = Table(encabezado_data, colWidths=[4.5 * inch, 2 * inch])
    encabezado_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(encabezado_table)
    story.append(Spacer(1, 0.25 * inch))
    story.append(HRFlowable(width='100%', thickness=2, color=AZUL))
    story.append(Spacer(1, 0.15 * inch))

    # ── Título del reporte ────────────────────────────────────────────────────────────────────────────
    if tipo == 'mensual':
        titulo_texto = 'REPORTE KPI MENSUAL'
        subtitulo_nombre = datos.get('nombre', '').upper()
        periodo_texto = f"Período: {datos.get('fecha_inicio', '')} al {datos.get('fecha_cierre', '')}"
    else:
        titulo_texto = 'REPORTE KPI ANUAL'
        subtitulo_nombre = str(datos.get('anio', ''))
        periodo_texto = f"Año fiscal {datos.get('anio', '')}"

    story.append(Paragraph(titulo_texto, estilo_titulo))
    story.append(Spacer(1, 0.05 * inch))
    story.append(Paragraph(subtitulo_nombre, ParagraphStyle(
        'subtitulo_nombre', parent=styles['Normal'],
        fontSize=13, fontName='Helvetica-Bold', textColor=AZUL,
        alignment=TA_CENTER, spaceAfter=2
    )))
    story.append(Spacer(1, 0.05 * inch))
    story.append(Paragraph(periodo_texto, estilo_subtitulo))
    story.append(Spacer(1, 0.2 * inch))

    # ── Tarjetas destacadas: Total Vendido y Ganancia Real ────────────────────
    total_vendido = datos.get('total_vendido', 0) or 0
    ganancia_real = datos.get('ganancia_real', 0) or 0
    color_ganancia = VERDE if ganancia_real >= 0 else ROJO

    destacadas_data = [
        [
            Paragraph('<b>TOTAL VENDIDO</b>', ParagraphStyle('td_label', fontSize=9, fontName='Helvetica-Bold', textColor=BLANCO, alignment=TA_CENTER)),
            Paragraph('<b>GANANCIA REAL</b>', ParagraphStyle('td_label', fontSize=9, fontName='Helvetica-Bold', textColor=BLANCO, alignment=TA_CENTER))
        ],
        [
            Paragraph(fmt(total_vendido), ParagraphStyle('td_val', fontSize=18, fontName='Helvetica-Bold', textColor=BLANCO, alignment=TA_CENTER)),
            Paragraph(f'{signo_str(ganancia_real)}{fmt(ganancia_real)}', ParagraphStyle('td_val', fontSize=18, fontName='Helvetica-Bold', textColor=BLANCO, alignment=TA_CENTER))
        ]
    ]
    destacadas_table = Table(destacadas_data, colWidths=[3.2 * inch, 3.2 * inch])
    destacadas_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), AZUL),
        ('BACKGROUND', (1, 0), (1, -1), color_ganancia),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
        ('COLPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(destacadas_table)
    story.append(Spacer(1, 0.2 * inch))

    # ── Desglose de componentes ───────────────────────────────────────────────
    story.append(Paragraph('Desglose del Total Vendido', estilo_seccion))

    componentes = [
        ['Componente', 'Descripción', 'Monto'],
        ['X — Materiales', 'Costo de materiales utilizados', fmt(datos.get('total_materiales', 0))],
        ['Y — Sueldos', 'Mano de obra presupuestada', fmt(datos.get('total_sueldos_presupuestados', 0))],
        ['Z — Máquinas', 'Reposición y amortización de máquinas', fmt(datos.get('total_maquinas', 0))],
        ['T — Costos indirectos', 'Alquiler, servicios, etc. (presupuestados)', fmt(datos.get('total_costos_indirectos_presupuestados', 0))],
        ['G — Ganancia', 'Ganancia presupuestada', fmt(datos.get('total_ganancia_presupuestada', 0))],
    ]

    comp_table = Table(componentes, colWidths=[1.8 * inch, 3.0 * inch, 1.6 * inch])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), AZUL),
        ('TEXTCOLOR', (0, 0), (-1, 0), BLANCO),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [BLANCO, GRIS_CLARO]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        # Fila de ganancia en verde
        ('TEXTCOLOR', (2, 5), (2, 5), VERDE),
        ('FONTNAME', (2, 5), (2, 5), 'Helvetica-Bold'),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 0.2 * inch))

    # ── Comparaciones K y J ───────────────────────────────────────────────────
    story.append(Paragraph('Comparaciones Reales vs. Presupuestadas', estilo_seccion))

    K = datos.get('K', 0) or 0
    J = datos.get('J', 0) or 0
    sueldo_real = datos.get('sueldo_real_pagado', 0) or 0
    ci_real = datos.get('costos_indirectos_reales', 0) or 0
    total_sueldos_pres = datos.get('total_sueldos_presupuestados', 0) or 0
    total_ci_pres = datos.get('total_costos_indirectos_presupuestados', 0) or 0

    comparaciones = [
        ['Concepto', 'Presupuestado', 'Real', 'Diferencia'],
        ['Y — Sueldos', fmt(total_sueldos_pres), fmt(sueldo_real), f'{signo_str(K)}{fmt(K)}  (K)'],
        ['T — Costos Indirectos', fmt(total_ci_pres), fmt(ci_real), f'{signo_str(J)}{fmt(J)}  (J)'],
    ]

    comp2_table = Table(comparaciones, colWidths=[1.8 * inch, 1.7 * inch, 1.7 * inch, 1.2 * inch])
    comp2_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), AZUL),
        ('TEXTCOLOR', (0, 0), (-1, 0), BLANCO),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [BLANCO, GRIS_CLARO]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        # Color K
        ('TEXTCOLOR', (3, 1), (3, 1), signo_color(K)),
        ('FONTNAME', (3, 1), (3, 1), 'Helvetica-Bold'),
        # Color J
        ('TEXTCOLOR', (3, 2), (3, 2), signo_color(J)),
        ('FONTNAME', (3, 2), (3, 2), 'Helvetica-Bold'),
    ]))
    story.append(comp2_table)
    story.append(Spacer(1, 0.15 * inch))

    # ── Fórmula Ganancia Real ─────────────────────────────────────────────────
    ganancia_pres = datos.get('total_ganancia_presupuestada', 0) or 0
    formula_texto = (
        f'<b>Ganancia Real</b> = G + K + J = '
        f'{fmt(ganancia_pres)} + ({signo_str(K)}{fmt(K)}) + ({signo_str(J)}{fmt(J)}) = '
        f'<b>{signo_str(ganancia_real)}{fmt(ganancia_real)}</b>'
    )
    formula_style = ParagraphStyle(
        'formula_box', fontSize=10, fontName='Helvetica',
        textColor=NEGRO, alignment=TA_CENTER,
        borderPad=10, backColor=AZUL_CLARO,
        borderColor=AZUL, borderWidth=1, borderRadius=6
    )
    story.append(Paragraph(formula_texto, formula_style))
    story.append(Spacer(1, 0.2 * inch))

    # ── Indicadores de presupuestos ───────────────────────────────────────────
    story.append(Paragraph('Indicadores de Presupuestos', estilo_seccion))

    cant_gen = datos.get('cantidad_presupuestos_generados', 0) or 0
    cant_apr = datos.get('cantidad_presupuestos_aprobados', 0) or 0
    cant_rech = datos.get('cantidad_presupuestos_rechazados', 0) or 0
    tasa = datos.get('tasa_conversion', 0) or 0
    ticket = datos.get('ticket_promedio', 0) or 0

    indicadores = [
        ['Indicador', 'Valor'],
        ['Presupuestos generados', str(cant_gen)],
        ['Presupuestos aprobados', str(cant_apr)],
        ['Presupuestos rechazados', str(cant_rech)],
        ['Tasa de conversión', f'{tasa:.1f}%'],
        ['Ticket promedio', fmt(ticket)],
    ]

    ind_table = Table(indicadores, colWidths=[3.5 * inch, 3.0 * inch])
    ind_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), AZUL),
        ('TEXTCOLOR', (0, 0), (-1, 0), BLANCO),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [BLANCO, GRIS_CLARO]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (1, 3), (1, 3), ROJO),
        ('FONTNAME', (1, 3), (1, 3), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1, 2), (1, 2), VERDE),
        ('FONTNAME', (1, 2), (1, 2), 'Helvetica-Bold'),
    ]))
    story.append(ind_table)
    story.append(Spacer(1, 0.3 * inch))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=1, color=AZUL))
    story.append(Spacer(1, 0.1 * inch))
    footer_style = ParagraphStyle(
        'footer_kpi', fontSize=8, fontName='Helvetica', textColor=GRIS, alignment=TA_CENTER
    )
    story.append(Paragraph('Leandro Horacio Pérez Tello — CUIT: 20-38184952-0', footer_style))
    story.append(Paragraph('Simplify.cnc — Av. Colón 498 — Cel: 3816082833', footer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
