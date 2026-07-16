import io
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_csv_report(stations):
    """Generates a CSV report summarizing current stations data."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    writer.writerow(["Station ID", "Station Name", "City", "Ward", "Current AQI", "Temperature (C)", "Humidity (%)", "Wind Speed (km/h)", "Wind Direction", "Main Pollutant", "Last Updated"])
    
    for s in stations:
        writer.writerow([
            s.id,
            s.name,
            s.city,
            s.ward,
            s.current_aqi,
            s.temperature,
            s.humidity,
            s.wind_speed,
            s.wind_direction,
            s.main_pollutant,
            s.last_updated.strftime("%Y-%m-%d %H:%M:%S")
        ])
        
    return output.getvalue()

def generate_pdf_report(city, stations, alerts, citizen_reports):
    """Generates a structured PDF command report for a city."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles for Premium Government Look
    title_style = ParagraphStyle(
        'GovTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'), # slate-900
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'GovSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'), # slate-600
        spaceAfter=15
    )
    
    section_title_style = ParagraphStyle(
        'GovSectionTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1E3A8A'), # deep navy
        spaceBefore=10,
        spaceAfter=8,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'GovBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    
    bold_body_style = ParagraphStyle(
        'GovBoldBody',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )
    
    story = []
    
    # 1. Header block
    story.append(Paragraph(f"URBAN AIR QUALITY INTEL PLATFORM — COMMAND REPORT", title_style))
    story.append(Paragraph(f"Location Scope: {city} | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Classification: Official Use Only", subtitle_style))
    
    # 2. Executive Summary
    avg_aqi = int(sum(s.current_aqi for s in stations) / len(stations)) if stations else 0
    max_station = max(stations, key=lambda s: s.current_aqi) if stations else None
    
    summary_text = (
        f"This report presents real-time environmental telemetry for <b>{city} Command Hub</b>. "
        f"The current spatial average AQI across municipal monitors stands at <b>{avg_aqi}</b>. "
        f"{f'The highest air degradation was recorded at <b>{max_station.name} ({max_station.current_aqi} AQI, dominant pollutant: {max_station.main_pollutant})</b>.' if max_station else ''} "
        f"Atmospheric dispersion metrics and meteorological profiles indicate localized stagnation. Enforcement teams are dispatched accordingly."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 12))
    
    # 3. Telemetry Stations Table
    story.append(Paragraph("I. Current Sensor Network Status", section_title_style))
    
    table_data = [[
        Paragraph("Station Name", table_header_style),
        Paragraph("Ward", table_header_style),
        Paragraph("AQI", table_header_style),
        Paragraph("Temp (°C)", table_header_style),
        Paragraph("Wind", table_header_style),
        Paragraph("Primary", table_header_style)
    ]]
    
    for s in stations:
        # AQI color coding
        aqi_color = "#22C55E" # safe
        if s.current_aqi > 300:
            aqi_color = "#EF4444"
        elif s.current_aqi > 200:
            aqi_color = "#F97316"
        elif s.current_aqi > 100:
            aqi_color = "#EAB308"
        elif s.current_aqi > 50:
            aqi_color = "#3B82F6"
            
        table_data.append([
            Paragraph(s.name, body_style),
            Paragraph(s.ward, body_style),
            Paragraph(f"<font color='{aqi_color}'><b>{s.current_aqi}</b></font>", bold_body_style),
            Paragraph(f"{s.temperature}", body_style),
            Paragraph(f"{s.wind_speed} km/h {s.wind_direction}", body_style),
            Paragraph(s.main_pollutant, body_style)
        ])
        
    station_table = Table(table_data, colWidths=[160, 100, 50, 60, 90, 70])
    station_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F8FAFC')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,1), (-1,-1), 5),
        ('BOTTOMPADDING', (0,1), (-1,-1), 5),
    ]))
    
    story.append(station_table)
    story.append(Spacer(1, 15))
    
    # 4. Active Command Alerts
    story.append(Paragraph("II. Active Warnings & Anomalies", section_title_style))
    if alerts:
        alert_table_data = [[
            Paragraph("Ward / Area", table_header_style),
            Paragraph("Severity", table_header_style),
            Paragraph("Operational Incident / Recommended Action", table_header_style)
        ]]
        for a in alerts:
            sev_color = "#EF4444" if a.severity in ["Severe", "Dangerous"] else "#EAB308"
            alert_table_data.append([
                Paragraph(a.ward or "Citywide", body_style),
                Paragraph(f"<font color='{sev_color}'><b>{a.severity}</b></font>", bold_body_style),
                Paragraph(f"<b>Incident:</b> {a.message}<br/><b>Directive:</b> {a.suggested_action}", body_style)
            ])
        alert_table = Table(alert_table_data, colWidths=[100, 70, 360])
        alert_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#7F1D1D')), # Dark red header
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('TOPPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#FCA5A5')),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#FEF2F2')), # Light red background
            ('TOPPADDING', (0,1), (-1,-1), 5),
            ('BOTTOMPADDING', (0,1), (-1,-1), 5),
        ]))
        story.append(alert_table)
    else:
        story.append(Paragraph("No critical environmental warnings or anomalies active in this reporting cycle.", body_style))
        
    story.append(Spacer(1, 15))
    
    # 5. Citizen Reports
    story.append(Paragraph("III. Pending Citizen Incident Reports", section_title_style))
    city_citizen_reps = [r for r in citizen_reports if r.ward in [s.ward for s in stations]]
    if city_citizen_reps:
        rep_table_data = [[
            Paragraph("Report ID", table_header_style),
            Paragraph("Ward", table_header_style),
            Paragraph("Category", table_header_style),
            Paragraph("Description", table_header_style),
            Paragraph("Status", table_header_style)
        ]]
        for r in city_citizen_reps:
            status_color = "#EAB308" if r.status == "Pending" else ("#3B82F6" if r.status == "In Progress" else "#22C55E")
            rep_table_data.append([
                Paragraph(f"AQI-REP-{r.id}", body_style),
                Paragraph(r.ward, body_style),
                Paragraph(r.category, body_style),
                Paragraph(r.description, body_style),
                Paragraph(f"<font color='{status_color}'><b>{r.status}</b></font>", bold_body_style)
            ])
        rep_table = Table(rep_table_data, colWidths=[80, 80, 100, 200, 70])
        rep_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('TOPPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F8FAFC')),
            ('TOPPADDING', (0,1), (-1,-1), 5),
            ('BOTTOMPADDING', (0,1), (-1,-1), 5),
        ]))
        story.append(rep_table)
    else:
        story.append(Paragraph("No citizen incidents logged or pending verification in this reporting sector.", body_style))
        
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
