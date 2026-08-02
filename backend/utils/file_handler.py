import pandas as pd
import numpy as np
import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class FileHandler:
    """
    Handles file operations and CSV processing.

    FIX SUMMARY (bugs that caused "all numeric columns have missing values"):
    ──────────────────────────────────────────────────────────────────────────
    BUG 1 – _convert_date_columns ran BEFORE _convert_numeric_columns and
    used an overly aggressive heuristic: it called pd.to_datetime() on every
    column (not just date-named ones). Integers like 1, 2, 3 are valid
    nanosecond-epoch timestamps, so they silently converted Revenue/Profit/
    Orders into datetime64 dtype.  After the CSV round-trip those datetimes
    became timestamp strings ("1970-01-01 00:00:00.000000001"), which then
    got coerced to NaN by pd.to_numeric().

    FIX 1 – Swap the call order: convert numerics FIRST (so Revenue, Profit,
    etc. become float64 before date detection runs), then convert dates ONLY
    for columns whose names contain date-related keywords.  Never attempt
    to parse a column as a date if it is already numeric dtype.

    BUG 2 – _convert_numeric_columns only targeted 'object' dtype columns;
    after the datetime corruption the real numeric columns were datetime64
    and were skipped entirely.

    FIX 2 – Run numeric conversion before date conversion (see above), and
    also guard date conversion so it never touches already-numeric columns.

    BUG 3 – _convert_numeric_columns blindly called pd.to_numeric() on ALL
    object columns, turning categorical text columns (Category, Customer)
    into NaN-filled float columns.

    FIX 3 – Only attempt numeric coercion on columns where > 60 % of the
    non-null sample parses successfully.  Text-majority columns are left as
    object/category dtype.
    """

    def __init__(self):
        self.supported_formats = ['.csv', '.xlsx', '.json']
        self.max_file_size = 50 * 1024 * 1024  # 50 MB

    # ──────────────────────────────────────────────────────────────────────────
    # Public entry points
    # ──────────────────────────────────────────────────────────────────────────

    def validate_file(self, file_path: str) -> Dict[str, Any]:
        """Validate uploaded file."""
        result = {'valid': False, 'error': None, 'file_info': {}}
        try:
            file_size = os.path.getsize(file_path)
            if file_size > self.max_file_size:
                result['error'] = f'File too large (max {self.max_file_size/(1024*1024):.0f} MB)'
                return result

            ext = os.path.splitext(file_path)[1].lower()
            if ext not in self.supported_formats:
                result['error'] = f'Unsupported format. Use: {", ".join(self.supported_formats)}'
                return result

            df = self.read_csv_safe(file_path) if ext == '.csv' else \
                 pd.read_excel(file_path) if ext == '.xlsx' else \
                 pd.read_json(file_path)

            result['valid'] = True
            result['file_info'] = {
                'size': file_size, 'format': ext,
                'rows': len(df), 'columns': len(df.columns),
                'column_names': df.columns.tolist(),
                'data_types': {c: str(t) for c, t in df.dtypes.items()},
                'sample_data': df.head().to_dict('records'),
            }
        except Exception as e:
            result['error'] = f'Error reading file: {e}'
        return result

    def read_csv_safe(self, file_path: str) -> pd.DataFrame:
        """Safely read CSV with encoding detection."""
        import chardet
        with open(file_path, 'rb') as f:
            raw = f.read()
            enc = chardet.detect(raw).get('encoding') or 'utf-8'

        for encoding in [enc, 'utf-8', 'latin-1', 'cp1252']:
            try:
                return pd.read_csv(file_path, encoding=encoding)
            except (UnicodeDecodeError, Exception):
                continue
        raise ValueError("Could not read CSV with any supported encoding")

    def clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and type-coerce a freshly parsed DataFrame.

        Order of operations (critical – do NOT reorder):
          1. Drop completely empty rows/columns.
          2. Normalise column names.
          3. Convert numeric columns  ← MUST happen before date detection.
          4. Convert date columns     ← Only by name, never on numeric cols.
        """
        df = df.copy()

        # 1. Drop fully-empty rows/cols
        df = df.dropna(how='all')
        df = df.dropna(axis=1, how='all')

        # 2. Normalise column names
        df.columns = self._clean_column_names(df.columns.tolist())

        # 3. Numeric conversion FIRST  ─── FIX: was step 2 (after dates)
        df = self._convert_numeric_columns(df)

        # 4. Date conversion LAST, keyword-only  ─── FIX: was aggressive/all-columns
        df = self._convert_date_columns(df)

        logger.debug("clean_dataframe done | shape=%s | dtypes=%s | nulls=%s",
                     df.shape, df.dtypes.to_dict(), df.isnull().sum().to_dict())
        return df

    # ──────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _clean_column_names(self, columns: List[str]) -> List[str]:
        """Lower-case, alphanumeric + underscore column names, de-duplicated."""
        cleaned: List[str] = []
        for col in columns:
            clean = ''.join(c if c.isalnum() or c == '_' else '_'
                            for c in str(col).strip())
            clean = '_'.join(p for p in clean.split('_') if p).lower()
            clean = clean or f'column_{len(cleaned)}'
            base, n = clean, 1
            while clean in cleaned:
                clean = f'{base}_{n}'; n += 1
            cleaned.append(clean)
        return cleaned

    def _convert_numeric_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Convert object-dtype columns to numeric ONLY when the column is
        predominantly numeric (> 60 % parse success on the non-null sample).

        FIX: previous code called pd.to_numeric(errors='coerce') on every
        object column unconditionally, turning text columns (Category, City …)
        into all-NaN float columns.
        """
        for col in df.columns:
            if df[col].dtype != object:
                continue  # already typed; skip

            sample = df[col].dropna()
            if sample.empty:
                continue

            # Test how many values actually parse as numbers
            coerced = pd.to_numeric(sample, errors='coerce')
            success_rate = coerced.notna().mean()

            if success_rate >= 0.6:
                # Majority numeric → convert the full column
                df[col] = pd.to_numeric(df[col], errors='coerce')
                logger.debug("Converted '%s' to numeric (%.0f%% success)", col, success_rate * 100)
            # else: leave as object/category – it's text data

        return df

    def _convert_date_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Convert columns to datetime ONLY when:
          a) The column name contains a date-related keyword, AND
          b) The column is NOT already numeric dtype.

        FIX: previous code attempted pd.to_datetime() on ALL columns
        (including numeric int/float columns).  Integers like 1, 2, 3 are
        valid Unix-nanosecond timestamps, so they silently converted
        Revenue/Profit/Orders to datetime64, destroying the numeric data.
        """
        date_keywords = {'date', 'time', 'created', 'updated', 'timestamp', 'dt', 'day', 'month', 'year'}

        for col in df.columns:
            # ── Guard: never touch already-numeric columns ──────────────────
            if pd.api.types.is_numeric_dtype(df[col]):
                continue

            # ── Only act when the column name hints at a date ───────────────
            col_lower = col.lower()
            is_date_named = any(kw in col_lower for kw in date_keywords)
            if not is_date_named:
                continue  # FIX: removed the aggressive "try everything" else-block

            try:
                df[col] = pd.to_datetime(df[col], errors='coerce', infer_datetime_format=True)
                logger.debug("Converted '%s' to datetime", col)
            except Exception:
                continue

        return df

    # ──────────────────────────────────────────────────────────────────────────
    # Reporting helpers
    # ──────────────────────────────────────────────────────────────────────────

    def get_data_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Comprehensive data summary safe to JSON-serialise."""
        total_cells = len(df) * len(df.columns) or 1
        summary = {
            'basic_info': {
                'rows':           len(df),
                'columns':        len(df.columns),
                'memory_usage':   int(df.memory_usage(deep=True).sum()),
                'duplicate_rows': int(df.duplicated().sum()),
            },
            'column_info': {},
            'data_quality': {
                'missing_values':      {k: int(v) for k, v in df.isnull().sum().items()},
                'missing_percentage':  {k: float(round(v / len(df) * 100, 2))
                                        for k, v in df.isnull().sum().items()},
                'complete_rows':       int(len(df.dropna())),
                'complete_percentage': float(round(len(df.dropna()) / len(df) * 100, 2)),
            },
            'data_types': {
                'numeric':     int(len(df.select_dtypes(include=['number']).columns)),
                'categorical': int(len(df.select_dtypes(include=['object', 'category']).columns)),
                'datetime':    int(len(df.select_dtypes(include=['datetime64']).columns)),
                'boolean':     int(len(df.select_dtypes(include=['bool']).columns)),
            },
        }

        for col in df.columns:
            info: Dict[str, Any] = {
                'dtype':        str(df[col].dtype),
                'non_null':     int(df[col].count()),
                'unique':       int(df[col].nunique()),
                'missing':      int(df[col].isnull().sum()),
                'missing_pct':  float(round(df[col].isnull().mean() * 100, 2)),
            }
            if pd.api.types.is_numeric_dtype(df[col]):
                info.update({
                    'mean':   float(df[col].mean()) if df[col].notna().any() else None,
                    'std':    float(df[col].std())  if df[col].notna().any() else None,
                    'min':    float(df[col].min())  if df[col].notna().any() else None,
                    'max':    float(df[col].max())  if df[col].notna().any() else None,
                    'median': float(df[col].median()) if df[col].notna().any() else None,
                })
            elif pd.api.types.is_object_dtype(df[col]):
                mode = df[col].mode()
                vc   = df[col].value_counts()
                info.update({
                    'most_frequent':  str(mode.iloc[0]) if not mode.empty else None,
                    'least_frequent': str(vc.index[-1]) if len(vc) > 0 else None,
                })
            summary['column_info'][col] = info

        return summary

    def suggest_data_cleaning(self, df: pd.DataFrame) -> List[str]:
        """Return up to 5 data-cleaning suggestions."""
        suggestions: List[str] = []
        missing_cols = df.columns[df.isnull().any()].tolist()
        if missing_cols:
            suggestions.append(f"Handle missing values in {len(missing_cols)} columns: {', '.join(missing_cols[:3])}")
        dupes = int(df.duplicated().sum())
        if dupes:
            suggestions.append(f"Remove {dupes} duplicate rows")
        for col in df.select_dtypes(include=['object']).columns:
            if 1 < df[col].nunique() < len(df) * 0.05:
                suggestions.append(f"Consider converting '{col}' to categorical dtype")
        for col in df.select_dtypes(include=['number']).columns:
            q1, q3 = df[col].quantile(0.25), df[col].quantile(0.75)
            iqr = q3 - q1
            n_out = int(((df[col] < q1 - 1.5 * iqr) | (df[col] > q3 + 1.5 * iqr)).sum())
            if n_out:
                suggestions.append(f"Review {n_out} outliers in '{col}'")
        return suggestions[:5]
