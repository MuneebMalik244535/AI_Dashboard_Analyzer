import time
import logging
import re
from typing import Dict, Any, List, Optional
import pandas as pd
import duckdb

logger = logging.getLogger(__name__)

class DuckDBEngine:
    """
    In-Memory DuckDB OLAP Analytical SQL Engine.
    Provides sub-second SQL queries over Pandas DataFrames.
    """

    def __init__(self):
        self.conn = duckdb.connect(database=':memory:')

    def register_dataframe(self, table_name: str, df: pd.DataFrame) -> None:
        """Register a Pandas DataFrame as a virtual table in DuckDB."""
        # Sanitize table_name
        clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', table_name)
        self.conn.register(clean_name, df)
        logger.debug("Registered table '%s' in DuckDB (shape=%s)", clean_name, df.shape)

    def execute_query(
        self,
        sql_query: str,
        df: Optional[pd.DataFrame] = None,
        table_name: str = "dataset"
    ) -> Dict[str, Any]:
        """
        Execute read-only SQL query on the registered DataFrame table.
        Returns execution metrics, columns, and records.
        """
        # Validate read-only query
        forbidden = ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "TRUNCATE", "CREATE"]
        upper_sql = sql_query.upper()
        for kw in forbidden:
            if f" {kw} " in f" {upper_sql} ":
                raise ValueError(f"Security error: Modification statement '{kw}' is not allowed.")

        if df is not None:
            self.register_dataframe(table_name, df)

        t0 = time.perf_counter()
        try:
            rel = self.conn.sql(sql_query)
            result_df = rel.df()
            elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

            return {
                "success": True,
                "query": sql_query,
                "execution_time_ms": elapsed_ms,
                "rows_returned": len(result_df),
                "columns": result_df.columns.tolist(),
                "records": result_df.head(100).to_dict(orient="records"),
                "summary": {
                    "total_rows": len(result_df),
                    "total_cols": len(result_df.columns)
                }
            }
        except Exception as exc:
            logger.error("DuckDB query error: %s", exc)
            return {
                "success": False,
                "query": sql_query,
                "execution_time_ms": round((time.perf_counter() - t0) * 1000, 2),
                "rows_returned": 0,
                "columns": [],
                "records": [],
                "error": str(exc)
            }

    def get_table_schema(self, table_name: str = "dataset") -> List[Dict[str, str]]:
        """Return schema details for registered table."""
        try:
            res = self.conn.sql(f"DESCRIBE {table_name}").df()
            return res.to_dict(orient="records")
        except Exception as exc:
            logger.error("Error describing table '%s': %s", table_name, exc)
            return []
