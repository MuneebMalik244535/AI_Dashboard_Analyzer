import pytest
import pandas as pd
from utils.file_handler import FileHandler

def test_clean_dataframe(sample_csv_df):
    handler = FileHandler()
    cleaned = handler.clean_dataframe(sample_csv_df)

    assert "revenue" in cleaned.columns
    assert "units_sold" in cleaned.columns
    assert pd.api.types.is_numeric_dtype(cleaned["revenue"])
    assert pd.api.types.is_numeric_dtype(cleaned["units_sold"])

def test_data_summary(sample_csv_df):
    handler = FileHandler()
    cleaned = handler.clean_dataframe(sample_csv_df)
    summary = handler.get_data_summary(cleaned)

    assert summary["basic_info"]["rows"] == 5
    assert "revenue" in summary["column_info"]
    assert summary["column_info"]["revenue"]["mean"] == 320.0
