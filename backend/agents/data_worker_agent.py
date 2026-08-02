import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple
from scipy import stats
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
import logging

logger = logging.getLogger(__name__)


class DataWorkerAgent:
    """
    Data Worker Agent performs actual data calculations, mathematical transformations,
    and business KPI aggregations deterministically on the Pandas DataFrame.
    """

    def __init__(self):
        self.scaler = StandardScaler()

    def execute_plan(self, plan: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Execute the data operations defined in the plan.
        """
        results = {
            'data': {},
            'statistics': {},
            'business_kpis': {},
            'metadata': {
                'original_shape': list(df.shape),
                'operations_executed': []
            }
        }

        # Auto-select numeric columns if none provided
        target_columns = plan.get('target_columns', [])
        numeric_cols   = df.select_dtypes(include=[np.number]).columns.tolist()
        if not target_columns:
            target_columns = numeric_cols[:5]

        target_columns = [c for c in target_columns if c in df.columns]
        numeric_targets = [c for c in target_columns if c in numeric_cols]

        # Always compute business KPIs first so all downstream agents have access to full business context
        business_kpis = self._calculate_business_kpis(df)
        results['business_kpis'] = business_kpis
        results['data']['calculate_business_kpis'] = business_kpis
        results['metadata']['operations_executed'].append('calculate_business_kpis')

        operations = plan.get('data_operations', [])
        for operation in operations:
            if operation == 'calculate_business_kpis':
                continue  # already computed above
            try:
                cols_to_use = numeric_targets if numeric_targets else numeric_cols[:5]
                operation_result = self._execute_operation(operation, cols_to_use, df)
                results['data'][operation] = operation_result
                results['metadata']['operations_executed'].append(operation)
            except Exception as e:
                logger.error("DataWorkerAgent error in operation %s: %s", operation, e)
                results['data'][operation] = {'error': str(e)}

        # Always calculate general statistics fallback
        stat_cols = numeric_targets or numeric_cols
        if stat_cols:
            results['statistics'] = self._calculate_statistics(df[stat_cols])
        else:
            results['statistics'] = {'note': 'No numeric columns found in dataset'}

        return results

    def _calculate_business_kpis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate key business metrics required by users:
          - Total orders
          - Total revenue
          - Total profit / Estimated profit
          - Average Order Value (AOV)
          - Top-selling categories
          - Monthly sales trends
          - Customer insights
        """
        kpis: Dict[str, Any] = {}

        # 1. Total Orders
        order_col = self._find_column_by_keywords(df, ['order', 'transaction', 'id'])
        if order_col:
            total_orders = int(df[order_col].nunique())
        else:
            total_orders = len(df)
        kpis['total_orders'] = total_orders

        # 2. Total Revenue & Revenue Column detection
        revenue_col = self._find_column_by_keywords(df, ['revenue', 'sales', 'amount', 'price', 'total'])
        if revenue_col and pd.api.types.is_numeric_dtype(df[revenue_col]):
            total_revenue = float(df[revenue_col].sum())
            avg_revenue = float(df[revenue_col].mean())
            aov = float(total_revenue / total_orders) if total_orders > 0 else 0.0
        else:
            total_revenue = 0.0
            avg_revenue = 0.0
            aov = 0.0

        kpis['total_revenue'] = round(total_revenue, 2)
        kpis['average_order_value'] = round(aov, 2)

        # 3. Total Profit calculation (if profit column exists or derived from discount/margin)
        profit_col = self._find_column_by_keywords(df, ['profit', 'margin', 'gain'])
        discount_col = self._find_column_by_keywords(df, ['discount'])

        if profit_col and pd.api.types.is_numeric_dtype(df[profit_col]):
            total_profit = float(df[profit_col].sum())
        elif revenue_col and discount_col and pd.api.types.is_numeric_dtype(df[discount_col]):
            # Estimated profit factoring in discounts (assume standard ~30% base margin after discount)
            net_revenue = df[revenue_col] * (1 - df[discount_col].fillna(0) / 100.0)
            total_profit = float(net_revenue.sum() * 0.35)
        elif revenue_col and pd.api.types.is_numeric_dtype(df[revenue_col]):
            # Estimated profit margin (~30% of total revenue)
            total_profit = float(total_revenue * 0.30)
        else:
            total_profit = 0.0

        kpis['total_profit'] = round(total_profit, 2)

        # 4. Top-selling categories
        cat_col = self._find_categorical_column(df)
        if cat_col:
            if revenue_col and pd.api.types.is_numeric_dtype(df[revenue_col]):
                top_cats = df.groupby(cat_col)[revenue_col].agg(['sum', 'count', 'mean']).reset_index()
                top_cats.columns = [cat_col, 'revenue', 'orders', 'avg_order']
                top_cats = top_cats.sort_values(by='revenue', ascending=False)
                kpis['top_categories'] = top_cats.head(5).to_dict(orient='records')
            else:
                top_cats = df[cat_col].value_counts().head(5).reset_index()
                top_cats.columns = [cat_col, 'orders']
                kpis['top_categories'] = top_cats.to_dict(orient='records')
        else:
            kpis['top_categories'] = []

        # 5. Monthly Sales Trends
        date_col = self._find_date_column(df)
        if date_col:
            df_trend = df.copy()
            df_trend[date_col] = pd.to_datetime(df_trend[date_col], errors='coerce')
            df_trend = df_trend.dropna(subset=[date_col])

            if revenue_col and pd.api.types.is_numeric_dtype(df_trend[revenue_col]):
                monthly = df_trend.set_index(date_col).resample('M')[revenue_col].agg(['sum', 'count']).reset_index()
                monthly['date'] = monthly[date_col].dt.strftime('%Y-%m')
                monthly = monthly.rename(columns={'sum': 'revenue', 'count': 'orders'})
                kpis['monthly_sales_trends'] = monthly[['date', 'revenue', 'orders']].to_dict(orient='records')
            else:
                monthly = df_trend.set_index(date_col).resample('M').size().reset_index(name='orders')
                monthly['date'] = monthly[date_col].dt.strftime('%Y-%m')
                kpis['monthly_sales_trends'] = monthly[['date', 'orders']].to_dict(orient='records')
        else:
            kpis['monthly_sales_trends'] = []

        # 6. Customer Insights
        cust_col = self._find_column_by_keywords(df, ['customer', 'client', 'user'])
        age_col = self._find_column_by_keywords(df, ['age'])
        loyalty_col = self._find_column_by_keywords(df, ['loyalty', 'score'])

        customer_insights: Dict[str, Any] = {}
        if cust_col:
            customer_insights['unique_customers'] = int(df[cust_col].nunique())
        if age_col and pd.api.types.is_numeric_dtype(df[age_col]):
            customer_insights['average_customer_age'] = round(float(df[age_col].mean()), 1)
        if loyalty_col and pd.api.types.is_numeric_dtype(df[loyalty_col]):
            customer_insights['average_loyalty_score'] = round(float(df[loyalty_col].mean()), 1)

        kpis['customer_insights'] = customer_insights

        return kpis

    def _find_column_by_keywords(self, df: pd.DataFrame, keywords: List[str]) -> str:
        for col in df.columns:
            if any(kw in col.lower() for kw in keywords):
                return col
        return ""

    def _execute_operation(self, operation: str, columns: List[str], df: pd.DataFrame) -> Dict[str, Any]:
        if operation == 'calculate_summary_stats':
            return self._calculate_summary_stats(df[columns])
        elif operation == 'calculate_trend':
            return self._calculate_trend(df, columns)
        elif operation == 'calculate_comparison':
            return self._calculate_comparison(df, columns)
        elif operation == 'calculate_correlation':
            return self._calculate_correlation(df, columns)
        elif operation == 'calculate_distribution':
            return self._calculate_distribution(df, columns)
        elif operation == 'detect_outliers':
            return self._detect_outliers(df, columns)
        elif operation == 'group_by_time':
            return self._group_by_time(df, columns)
        elif operation == 'group_by_category':
            return self._group_by_category(df, columns)
        else:
            return {'error': f'Unknown operation: {operation}'}

    def _calculate_summary_stats(self, df_subset: pd.DataFrame) -> Dict[str, Any]:
        stats_dict = {}
        for col in df_subset.columns:
            if pd.api.types.is_numeric_dtype(df_subset[col]):
                stats_dict[col] = {
                    'mean': float(df_subset[col].mean()),
                    'median': float(df_subset[col].median()),
                    'std': float(df_subset[col].std()),
                    'min': float(df_subset[col].min()),
                    'max': float(df_subset[col].max()),
                    'q25': float(df_subset[col].quantile(0.25)),
                    'q75': float(df_subset[col].quantile(0.75)),
                    'count': int(df_subset[col].count()),
                    'null_count': int(df_subset[col].isnull().sum())
                }
            else:
                stats_dict[col] = {
                    'unique_count': int(df_subset[col].nunique()),
                    'most_frequent': df_subset[col].mode().iloc[0] if not df_subset[col].mode().empty else None,
                    'count': int(df_subset[col].count()),
                    'null_count': int(df_subset[col].isnull().sum())
                }
        return stats_dict

    def _calculate_trend(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        date_col = self._find_date_column(df)
        if not date_col:
            return {'error': 'No date column found for trend analysis'}

        df_copy = df.copy()
        df_copy[date_col] = pd.to_datetime(df_copy[date_col], errors='coerce')
        df_copy = df_copy.dropna(subset=[date_col]).sort_values(date_col)

        trends = {}
        for col in columns:
            if pd.api.types.is_numeric_dtype(df_copy[col]) and col != date_col:
                x = np.arange(len(df_copy))
                y = df_copy[col].dropna()
                if len(y) > 1:
                    slope, intercept, r_value, p_value, std_err = stats.linregress(x[:len(y)], y)
                    trends[col] = {
                        'slope': float(slope),
                        'direction': 'increasing' if slope > 0 else 'decreasing',
                        'strength': abs(float(r_value)),
                        'p_value': float(p_value),
                        'significant': bool(p_value < 0.05)
                    }
        return trends

    def _calculate_comparison(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        cat_col = self._find_categorical_column(df)
        if not cat_col:
            return {'error': 'No categorical column found for comparison'}

        comparisons = {}
        for col in columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                grouped_stats = df.groupby(cat_col)[col].agg(['mean', 'std', 'count']).round(2)
                comparisons[col] = {
                    'grouped_stats': grouped_stats.to_dict(),
                    'max_difference': float(grouped_stats['mean'].max() - grouped_stats['mean'].min()),
                    'groups': grouped_stats.index.tolist()
                }
        return comparisons

    def _calculate_correlation(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        numeric_df = df[columns].select_dtypes(include=[np.number])
        if numeric_df.empty:
            return {'error': 'No numeric columns found for correlation analysis'}

        correlation_matrix = numeric_df.corr()
        correlations = []
        for i in range(len(correlation_matrix.columns)):
            for j in range(i+1, len(correlation_matrix.columns)):
                corr_val = correlation_matrix.iloc[i, j]
                if not np.isnan(corr_val):
                    correlations.append({
                        'variable1': correlation_matrix.columns[i],
                        'variable2': correlation_matrix.columns[j],
                        'correlation': float(corr_val),
                        'strength': self._interpret_correlation(abs(corr_val))
                    })
        correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
        return {
            'correlation_matrix': correlation_matrix.round(3).to_dict(),
            'top_correlations': correlations[:5]
        }

    def _calculate_distribution(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        distributions = {}
        for col in columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                data = df[col].dropna()
                if len(data) < 2:
                    continue
                hist_counts, hist_edges = np.histogram(data, bins=20, density=True)
                norm_stat, norm_p       = stats.normaltest(data)
                distributions[col] = {
                    'histogram': {
                        'counts': [float(x) for x in hist_counts],
                        'edges':  [float(x) for x in hist_edges],
                    },
                    'skewness':       float(stats.skew(data)),
                    'kurtosis':       float(stats.kurtosis(data)),
                    'normality_test': {'statistic': float(norm_stat), 'p_value': float(norm_p)},
                    'percentiles':    {f'p{p}': float(np.percentile(data, p)) for p in [1, 5, 10, 25, 50, 75, 90, 95, 99]},
                }
        return distributions

    def _detect_outliers(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        outliers = {}
        for col in columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                data = df[col].dropna()
                Q1 = data.quantile(0.25)
                Q3 = data.quantile(0.75)
                IQR = Q3 - Q1
                iqr_outliers = data[(data < Q1 - 1.5*IQR) | (data > Q3 + 1.5*IQR)]
                z_scores = np.abs(stats.zscore(data))
                z_outliers = data[z_scores > 3]

                outliers[col] = {
                    'iqr_outliers': {
                        'count': len(iqr_outliers),
                        'percentage': float(len(iqr_outliers) / len(data) * 100),
                        'values': iqr_outliers.tolist()[:10]
                    },
                    'zscore_outliers': {
                        'count': len(z_outliers),
                        'percentage': float(len(z_outliers) / len(data) * 100),
                        'values': z_outliers.tolist()[:10]
                    }
                }
        return outliers

    def _group_by_time(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        date_col = self._find_date_column(df)
        if not date_col:
            return {'error': 'No date column found'}

        df_copy = df.copy()
        df_copy[date_col] = pd.to_datetime(df_copy[date_col], errors='coerce')
        df_copy = df_copy.dropna(subset=[date_col])

        df_copy['year'] = df_copy[date_col].dt.year
        df_copy['month'] = df_copy[date_col].dt.month

        grouped_data = {}
        for period in ['year', 'month']:
            for col in columns:
                if pd.api.types.is_numeric_dtype(df_copy[col]):
                    grouped = df_copy.groupby(period)[col].agg(['mean', 'count', 'sum'])
                    grouped_data[f'{col}_by_{period}'] = grouped.round(2).to_dict()
        return grouped_data

    def _group_by_category(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        cat_col = self._find_categorical_column(df)
        if not cat_col:
            return {'error': 'No categorical column found'}

        grouped_data = {}
        for col in columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                grouped = df.groupby(cat_col)[col].agg(['mean', 'count', 'sum', 'min', 'max'])
                grouped_data[f'{col}_by_{cat_col}'] = grouped.round(2).to_dict()
        return grouped_data

    def _find_date_column(self, df: pd.DataFrame) -> str:
        date_keywords = ['date', 'time', 'created', 'updated', 'timestamp']
        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                return col
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                continue
            if any(keyword in col.lower() for keyword in date_keywords):
                return col
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                continue
            try:
                parsed = pd.to_datetime(df[col].dropna().head(10), errors='coerce')
                if parsed.notna().mean() >= 0.8:
                    return col
            except Exception:
                continue
        return ""

    def _find_categorical_column(self, df: pd.DataFrame) -> str:
        cat_cols = df.select_dtypes(include=['object']).columns.tolist()
        if cat_cols:
            for col in cat_cols:
                unique_count = df[col].nunique()
                if 2 <= unique_count <= 50:
                    return col
            return cat_cols[0]
        return ""

    def _interpret_correlation(self, corr_value: float) -> str:
        abs_corr = abs(corr_value)
        if abs_corr >= 0.7:
            return 'strong'
        elif abs_corr >= 0.5:
            return 'moderate'
        elif abs_corr >= 0.3:
            return 'weak'
        else:
            return 'very weak'

    def _calculate_statistics(self, df_subset: pd.DataFrame) -> Dict[str, Any]:
        return {
            'total_rows': len(df_subset),
            'total_columns': len(df_subset.columns),
            'numeric_columns': len(df_subset.select_dtypes(include=[np.number]).columns),
            'categorical_columns': len(df_subset.select_dtypes(include=['object']).columns),
            'missing_values': {col: int(val) for col, val in df_subset.isnull().sum().items()},
            'memory_usage': int(df_subset.memory_usage(deep=True).sum())
        }
