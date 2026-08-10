import io
import logging
from typing import Dict, Any, List
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

logger = logging.getLogger(__name__)

class PDFReportGenerator:
    """
    Executive PDF Report Generator engine using ReportLab.
    Produces enterprise-grade PDF business summary documents.
    """

    def generate_pdf_report(
        self,
        filename: str,
        kpis: Dict[str, Any],
        narrative: str = "",
        key_findings: List[str] = None
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#4F46E5"),
            spaceAfter=10
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#6B7280"),
            spaceAfter=15
        )
        heading2_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#1F2937"),
            spaceBefore=12,
            spaceAfter=8
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['BodyText'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#374151"),
            spaceAfter=8
        )

        story = []

        # Header Title
        story.append(Paragraph("AI Data Dashboard — Executive Analysis Report", title_style))
        story.append(Paragraph(f"Dataset: <b>{filename}</b> | Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", subtitle_style))
        story.append(Spacer(1, 10))

        # KPI Summary Table
        story.append(Paragraph("Key Business Performance Metrics", heading2_style))
        table_data = [
            ["Metric Name", "Calculated Value"],
            ["Total Orders", f"{kpis.get('total_orders', 0):,}"],
            ["Total Revenue", f"£{kpis.get('total_revenue', 0.0):,.2f}"],
            ["Total Profit", f"£{kpis.get('total_profit', 0.0):,.2f}"],
            ["Average Order Value (AOV)", f"£{kpis.get('average_order_value', 0.0):,.2f}"],
        ]

        t = Table(table_data, colWidths=[240, 240])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#F9FAFB")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        story.append(t)
        story.append(Spacer(1, 15))

        # Executive Narrative Section
        if narrative:
            story.append(Paragraph("Executive Narrative Briefing", heading2_style))
            story.append(Paragraph(narrative, body_style))
            story.append(Spacer(1, 10))

        # Key Findings Bullets
        if key_findings:
            story.append(Paragraph("Key Strategic Findings", heading2_style))
            for finding in key_findings:
                story.append(Paragraph(f"• {finding}", body_style))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
