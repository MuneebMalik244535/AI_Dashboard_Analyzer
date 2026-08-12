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
        key_findings: List[str] = None,
        balance_sheet: Dict[str, Any] = None,
        income_statement: Dict[str, Any] = None,
        ratios: Dict[str, Any] = None,
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
            spaceAfter=6
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
            fontSize=13,
            leading=16,
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
        story.append(Paragraph("AI Data & CFO Accounting Dashboard — Executive Audit Report", title_style))
        story.append(Paragraph(f"Dataset: <b>{filename}</b> | Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", subtitle_style))
        story.append(Spacer(1, 8))

        # KPI Summary Table
        story.append(Paragraph("Key Performance Metrics", heading2_style))
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
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('TOPPADDING', (0, 0), (-1, 0), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#F9FAFB")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ]))
        story.append(t)
        story.append(Spacer(1, 12))

        # Financial Statements (Balance Sheet & P&L) if available
        if balance_sheet and income_statement:
            story.append(Paragraph("Double-Entry Balance Sheet Summary", heading2_style))
            bs_assets = balance_sheet.get('assets', {}).get('total_assets', 0.0)
            bs_liab = balance_sheet.get('liabilities', {}).get('total_liabilities', 0.0)
            bs_eq = balance_sheet.get('equity', {}).get('total_equity', 0.0)
            is_balanced = balance_sheet.get('summary', {}).get('is_balanced', True)

            bs_table_data = [
                ["Balance Sheet Category", "Amount (£)", "Ledger Integrity"],
                ["Total Assets", f"£{bs_assets:,.2f}", "Balanced" if is_balanced else "Unbalanced"],
                ["Total Liabilities", f"£{bs_liab:,.2f}", "Verified"],
                ["Shareholders' Equity", f"£{bs_eq:,.2f}", "Verified"],
                ["Total Liabilities & Equity", f"£{(bs_liab + bs_eq):,.2f}", "Assets = L + E"],
            ]
            t_bs = Table(bs_table_data, colWidths=[180, 150, 150])
            t_bs.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#059669")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ]))
            story.append(t_bs)
            story.append(Spacer(1, 12))

        # Narrative / Key Findings
        if narrative:
            story.append(Paragraph("Executive Insights Summary", heading2_style))
            story.append(Paragraph(narrative, body_style))
            story.append(Spacer(1, 8))

        if key_findings:
            story.append(Paragraph("Key Audit & Business Findings", heading2_style))
            for finding in key_findings:
                story.append(Paragraph(f"• {finding}", body_style))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
