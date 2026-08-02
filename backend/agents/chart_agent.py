import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
import base64
import io
from typing import Dict, List, Any, Tuple
import json

class ChartAgent:
    """
    Chart Agent creates visualizations based on data analysis results
    """
    
    def __init__(self):
        # Set style for matplotlib
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
        
        # Chart type recommendations
        self.chart_recommendations = {
            'trend': ['line', 'area'],
            'comparison': ['bar', 'box', 'violin'],
            'correlation': ['scatter', 'heatmap'],
            'distribution': ['histogram', 'box', 'violin'],
            'summary': ['bar', 'pie'],
            'outlier': ['box', 'scatter']
        }
    
    def create_visualization(self, data: Dict[str, Any], plan: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Create appropriate visualizations based on the analysis type
        """
        visualizations = {}
        analysis_type = plan.get('analysis_type', [])
        target_columns = plan.get('target_columns', [])
        
        # Determine best chart types
        recommended_charts = self._get_recommended_charts(analysis_type)
        
        for chart_type in recommended_charts[:3]:  # Limit to top 3 charts
            try:
                chart_data = self._create_chart(chart_type, data, target_columns, df)
                if chart_data:
                    visualizations[f'{chart_type}_chart'] = chart_data
            except Exception as e:
                visualizations[f'{chart_type}_chart'] = {'error': str(e)}
        
        return visualizations
    
    def _get_recommended_charts(self, analysis_types: List[str]) -> List[str]:
        """
        Get recommended chart types based on analysis type
        """
        all_recommendations = []
        
        for analysis_type in analysis_types:
            if analysis_type in self.chart_recommendations:
                all_recommendations.extend(self.chart_recommendations[analysis_type])
        
        # Remove duplicates and prioritize
        priority_order = ['line', 'bar', 'scatter', 'heatmap', 'histogram', 'box', 'area', 'pie', 'violin']
        recommended = []
        
        for chart_type in priority_order:
            if chart_type in all_recommendations and chart_type not in recommended:
                recommended.append(chart_type)
        
        # Add any remaining chart types
        for chart_type in all_recommendations:
            if chart_type not in recommended:
                recommended.append(chart_type)
        
        return recommended or ['bar']  # Default to bar chart
    
    def _create_chart(self, chart_type: str, data: Dict[str, Any], columns: List[str], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Create specific chart types
        """
        if chart_type == 'line':
            return self._create_line_chart(data, columns, df)
        elif chart_type == 'bar':
            return self._create_bar_chart(data, columns, df)
        elif chart_type == 'scatter':
            return self._create_scatter_chart(data, columns, df)
        elif chart_type == 'heatmap':
            return self._create_heatmap(data, columns, df)
        elif chart_type == 'histogram':
            return self._create_histogram(data, columns, df)
        elif chart_type == 'box':
            return self._create_box_chart(data, columns, df)
        elif chart_type == 'area':
            return self._create_area_chart(data, columns, df)
        elif chart_type == 'pie':
            return self._create_pie_chart(data, columns, df)
        elif chart_type == 'violin':
            return self._create_violin_chart(data, columns, df)
        else:
            return {'error': f'Unknown chart type: {chart_type}'}
    
    def _create_line_chart(self, data: Dict[str, Any], columns: List[str], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Create line chart for trend analysis
        """
        # Find date column
        date_col = self._find_date_column(df)
        if not date_col:
            return {'error': 'No date column found for line chart'}
        
        fig = go.Figure()
        
        for col in columns[:5]:  # Limit to 5 columns
            if pd.api.types.is_numeric_dtype(df[col]) and col != date_col:
                # Group by date if needed
                if len(df) > 100:
                    df_grouped = df.groupby(pd.Grouper(key=date_col, freq='M'))[col].mean().reset_index()
                else:
                    df_grouped = df[[date_col, col]].sort_values(date_col)
                
                fig.add_trace(go.Scatter(
                    x=df_grouped[date_col],
                    y=df_grouped[col],
                    mode='lines+markers',
                    name=col,
                    line=dict(width=2)
                ))
        
        fig.update_layout(
            title='Trend Analysis Over Time',
            xaxis_title=date_col,
            yaxis_title='Value',
            hovermode='x unified'
        )
        
        return self._convert_plotly_to_json(fig)
    
    def _create_bar_chart(self, data: Dict[str, Any], columns: List[str], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Create bar chart for comparisons
        """
        fig = go.Figure()
        
        # Find categorical column for grouping
        cat_col = self._find_categorical_column(df)
        
        if cat_col and columns:
            # Grouped bar chart
            for col in columns[:3]:  # Limit to 3 columns
                if pd.api.types.is_numeric_dtype(df[col]):
                    grouped_data = df.groupby(cat_col)[col].mean().reset_index()
                    
                    fig.add_trace(go.Bar(
                        x=grouped_data[cat_col],
                        y=grouped_data[col],
                        name=col,
                        text=grouped_data[col].round(2),
                        textposition='auto'
                    ))
        else:
            # Simple bar chart for single column
            if columns and pd.api.types.is_numeric_dtype(df[columns[0]]):
                col = columns[0]
                value_counts = df[col].value_counts().head(10)
                
                fig.add_trace(go.Bar(
                    x=value_counts.index,
                    y=value_counts.values,
                    name=col,
                    text=value_counts.values,
                    textposition='auto'
                ))
        
        fig.update_layout(
            title='Comparison Analysis',
            xaxis_title=cat_col or 'Category',
            yaxis_title='Value',
            showlegend=len(columns) > 1
        )
        
        return self._convert_plotly_to_json(fig)
    
    def _create_scatter_chart(self, data: Dict[str, Any], columns: List[str], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Create scatter plot for correlation analysis
        """
        numeric_cols = df[columns].select_dtypes(include=[np.number]).columns.tolist()
        
        if len(numeric_cols) < 2:
            return {'error': 'Need at least 2 numeric columns for scatter plot'}
        
        fig = go.Figure()
        
        # Create scatter plot for first two numeric columns
        x_col, y_col = numeric_cols[0], numeric_cols[1]
        
        fig.add_trace(go.Scatter(
            x=df[x_col],
            y=df[y_col],
            mode='markers',
            text=df.index,
            hovertemplate=f'{x_col}: %{{x}}<br>{y_col}: %{{y}}<extra></extra>'
        ))
        
        # Add trend line
        if len(df) > 1:
            z = np.polyfit(df[x_col].dropna(), df[y_col].dropna(), 1)
            p = np.poly1d(z)
            fig.add_trace(go.Scatter(
                x=df[x_col],
                y=p(df[x_col]),
                mode='lines',
                name='Trend Line',
                line=dict(dash='dash')
            ))
        
        fig.update_layout(
            title=f'Correlation: {x_col} vs {y_col}',
            xaxis_title=x_col,
            yaxis_title=y_col
        )
        
        return self._convert_plotly_to_json(fig)
    
    def _create_heatmap(self, data: Dict[str, Any], columns: List[str], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Create heatmap for correlation matrix
        """
        numeric_df = df[columns].select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            return {'error': 'No numeric columns found for heatmap'}
        
        corr_matrix = numeric_df.corr()
        
        fig = go.Figure(data=go.Heatmap(
            z=corr_matrix.values,
            x=corr_matrix.columns,
            y=corr_matrix.columns,
            colorscale='RdBu',
            zmid=0,
            text=corr_matrix.round(2).values,
            texttemplate='%{text}',
            textfont={"size": 10},
            hoverongaps=False
        ))
        
        fig.update_layout(
            title='Correlation Heatmap',
            width=600,
            height=600
        )
        
        return self._convert_plotly_to_json(fig)
    
    def _create_histogram(self, data: Dict[str, Any], columns: List[str], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Create histogram for distribution analysis
        """
        fig = make_subplots(
            rows=len(columns[:2]), cols=1,
            subplot_titles=columns[:2],
            vertical_spacing=0.1
        )
        
        for i, col in enumerate(columns[:2]):  # Limit to 2 columns
            if pd.api.types.is_numeric_dtype(df[col]):
                fig.add_trace(
                    go.Histogram(
                        x=df[col],
                        name=col,
                        nbinsx=20,
                        opacity=0.7
                    ),
                    row=i+1, col=1
                )
        
        fig.update_layout(
            title='Distribution Analysis',
            height=300 * len(columns[:2]),
            showlegend=False
        )
        
        return self._convert_plotly_to_json(fig)
    
    def _create_box_chart(self, data: Dict[str, Any], columns: List[str], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Create box plot for outlier detection and distribution
        """
        fig = go.Figure()
        
        for col in columns[:5]:  # Limit to 5 columns
            if pd.api.types.is_numeric_dtype(df[col]):
                fig.add_trace(go.Box(
                    y=df[col],
                    name=col,
                    boxpoints='outliers'
                ))
        
        fig.update_layout(
            title='Box Plot Analysis',
            yaxis_title='Value',
            xaxis_title='Variables'
        )
        
        return self._convert_plotly_to_json(fig)
    
    def _create_area_chart(self, data: Dict[str, Any], columns: List[str], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Create area chart for trend analysis
        """
        date_col = self._find_date_column(df)
        if not date_col:
            return {'error': 'No date column found for area chart'}
        
        fig = go.Figure()
        
        for col in columns[:3]:  # Limit to 3 columns
            if pd.api.types.is_numeric_dtype(df[col]) and col != date_col:
                if len(df) > 100:
                    df_grouped = df.groupby(pd.Grouper(key=date_col, freq='M'))[col].mean().reset_index()
                else:
                    df_grouped = df[[date_col, col]].sort_values(date_col)
                
                fig.add_trace(go.Scatter(
                    x=df_grouped[date_col],
                    y=df_grouped[col],
                    mode='none',
                    fill='tonexty' if fig.data else 'tozeroy',
                    name=col
                ))
        
        fig.update_layout(
            title='Area Chart - Trend Analysis',
            xaxis_title=date_col,
            yaxis_title='Value'
        )
        
        return self._convert_plotly_to_json(fig)
    
    def _create_pie_chart(self, data: Dict[str, Any], columns: List[str], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Create pie chart for categorical data
        """
        cat_col = self._find_categorical_column(df)
        
        if not cat_col:
            return {'error': 'No categorical column found for pie chart'}
        
        value_counts = df[cat_col].value_counts().head(8)  # Limit to top 8 categories
        
        fig = go.Figure(data=[go.Pie(
            labels=value_counts.index,
            values=value_counts.values,
            hole=0.3,
            textinfo='label+percent'
        )])
        
        fig.update_layout(
            title=f'Distribution of {cat_col}'
        )
        
        return self._convert_plotly_to_json(fig)
    
    def _create_violin_chart(self, data: Dict[str, Any], columns: List[str], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Create violin plot for distribution analysis
        """
        cat_col = self._find_categorical_column(df)
        
        if not cat_col:
            return {'error': 'No categorical column found for violin plot'}
        
        fig = go.Figure()
        
        for col in columns[:3]:  # Limit to 3 columns
            if pd.api.types.is_numeric_dtype(df[col]):
                fig.add_trace(go.Violin(
                    x=df[cat_col],
                    y=df[col],
                    name=col,
                    box_visible=True,
                    meanline_visible=True
                ))
        
        fig.update_layout(
            title='Violin Plot - Distribution Analysis',
            xaxis_title=cat_col,
            yaxis_title='Value'
        )
        
        return self._convert_plotly_to_json(fig)
    
    def _find_date_column(self, df: pd.DataFrame) -> str:
        """
        Find the most likely date column.

        BUG FIX: The original fallback attempted pd.to_datetime() on ALL
        columns, which silently succeeded for integer columns (e.g.
        Transaction_ID = 1, 2, 3 are valid Unix nanosecond timestamps).
        This caused numeric data columns to be misidentified as dates and
        used incorrectly in time-series charts.

        FIX: The fallback only attempts date parsing on non-numeric, non-bool
        columns. Numeric columns are explicitly skipped.
        """
        date_keywords = ['date', 'time', 'created', 'updated', 'timestamp']

        # 1. Already a datetime dtype column
        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                return col

        # 2. Name contains a date keyword (and is not numeric)
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                continue  # FIX: never treat a numeric column as a date
            if any(keyword in col.lower() for keyword in date_keywords):
                return col

        # 3. Fallback: try parsing non-numeric string columns
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                continue  # FIX: skip numeric columns
            try:
                parsed = pd.to_datetime(df[col].dropna().head(10), errors='coerce')
                if parsed.notna().mean() >= 0.8:  # 80%+ must parse as date
                    return col
            except Exception:
                continue

        return None
    
    def _find_categorical_column(self, df: pd.DataFrame) -> str:
        """
        Find the most likely categorical column
        """
        cat_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        if cat_cols:
            # Return column with reasonable cardinality
            for col in cat_cols:
                unique_count = df[col].nunique()
                if 2 <= unique_count <= 20:  # Good for pie charts
                    return col
            
            return cat_cols[0]
        
        return None
    
    def _convert_plotly_to_json(self, fig) -> Dict[str, Any]:
        """
        Convert Plotly figure to a plain Python dict (JSON-serializable).

        BUG FIX: Previously returned raw Plotly objects (fig.data, fig.layout,
        fig.config) which are BasePlotlyType instances — NOT plain dicts.
        FastAPI's sanitize_for_json() doesn't know how to handle these, so the
        JSON serialization either crashed or produced empty/broken output.
        When charts failed, the explainer agent received no data and fell back
        to reporting "all numeric columns have missing values."

        FIX: Use fig.to_json() which is Plotly's own serializer (handles numpy,
        datetime, NaN etc.) then json.loads() to get a plain Python dict that
        is safely handled by FastAPI's JSONResponse.
        """
        return json.loads(fig.to_json())
    
    def suggest_chart_improvements(self, chart_type: str, data: Dict[str, Any]) -> List[str]:
        """
        Suggest improvements for the created chart
        """
        suggestions = []
        
        if chart_type == 'scatter':
            suggestions.append("Consider adding color coding based on a categorical variable")
            suggestions.append("Add trend lines to show correlation direction")
        
        elif chart_type == 'bar':
            suggestions.append("Sort bars by value for better readability")
            suggestions.append("Consider horizontal bars if category names are long")
        
        elif chart_type == 'heatmap':
            suggestions.append("Use diverging colorscale for correlation matrices")
            suggestions.append("Add annotations to show exact correlation values")
        
        elif chart_type == 'histogram':
            suggestions.append("Adjust bin size for better distribution representation")
            suggestions.append("Add normal distribution overlay for comparison")
        
        return suggestions
