import pytest
from utils.pdf_generator import PDFReportGenerator

def test_pdf_report_generation():
    generator = PDFReportGenerator()
    kpis = {
        "total_orders": 100,
        "total_revenue": 5000.0,
        "total_profit": 1500.0,
        "average_order_value": 50.0
    }
    narrative = "Revenue increased by 15% due to strong sales in electronics."
    key_findings = [
        "Electronics is the highest revenue category.",
        "London store generated 40% of total sales."
    ]

    pdf_bytes = generator.generate_pdf_report(
        filename="sales_2024.csv",
        kpis=kpis,
        narrative=narrative,
        key_findings=key_findings
    )

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF")
