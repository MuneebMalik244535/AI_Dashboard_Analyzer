import pytest
import pandas as pd
from utils.duckdb_engine import DuckDBEngine

def test_duckdb_register_and_query(sample_csv_df):
    engine = DuckDBEngine()
    engine.register_dataframe("dataset", sample_csv_df)
    
    # Run SQL aggregation
    query = "SELECT Store_Location, SUM(Revenue) AS total_revenue FROM dataset GROUP BY Store_Location ORDER BY total_revenue DESC"
    result = engine.execute_query(query)

    assert result["success"] is True
    assert result["rows_returned"] > 0
    assert "total_revenue" in result["columns"]
    assert result["records"][0]["total_revenue"] > 0

def test_duckdb_forbidden_statement():
    engine = DuckDBEngine()
    with pytest.raises(ValueError, match="Security error"):
        engine.execute_query("DROP TABLE dataset")
