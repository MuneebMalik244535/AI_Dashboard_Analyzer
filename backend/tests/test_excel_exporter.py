import pytest
import pandas as pd
from utils.excel_exporter import ExcelWorkbookExporter

def test_excel_workbook_generation(sample_csv_df):
    exporter = ExcelWorkbookExporter()
    kpis = {
        "total_orders": 5,
        "total_revenue": 1600.0,
        "total_profit": 560.0,
        "average_order_value": 320.0
    }

    excel_bytes = exporter.generate_excel_workbook(
        filename="sales_data.csv",
        df=sample_csv_df,
        kpis=kpis
    )

    assert isinstance(excel_bytes, bytes)
    assert len(excel_bytes) > 1000
    # ZIP signature for XLSX files (PK..)
    assert excel_bytes.startswith(b"PK")
