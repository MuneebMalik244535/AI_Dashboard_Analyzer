"""
ExplainerAgent — Powered by Gemini API via OpenAI SDK (with Groq fallback).

Responsibilities:
  1. Receive exact calculated KPIs and statistical data from DataWorkerAgent & ChartAgent.
  2. Call LLM to produce an executive business summary answering the user's explicit question.
  3. Provide concrete numerical findings (Total Orders, Total Revenue, Total Profit, AOV, Top Categories, Trends).
  4. Fall back to template-based text if LLM calls fail.
"""

import json
import logging
from typing import List, Dict, Any
import pandas as pd
import numpy as np

from utils.ai_client import call_chat_completion, EXPLAINER_MODEL, is_ai_configured

logger = logging.getLogger(__name__)


def _get_date_range(df: pd.DataFrame) -> str:
    date_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
    if date_cols:
        col = date_cols[0]
        return f"{df[col].min()} to {df[col].max()}"
    return "No date columns found"


def _analyze_data_quality(df: pd.DataFrame) -> Dict[str, Any]:
    total_cells = len(df) * len(df.columns) or 1
    return {
        'completeness': {
            'score':           float((1 - df.isnull().sum().sum() / total_cells) * 100),
            'missing_columns': df.columns[df.isnull().any()].tolist(),
            'missing_counts':  {k: int(v) for k, v in df.isnull().sum().items()},
        },
        'consistency': {
            'duplicate_rows':       int(df.duplicated().sum()),
            'duplicate_percentage': float((df.duplicated().sum() / len(df)) * 100),
        },
        'validity': {
            'numeric_columns':     df.select_dtypes(include=[np.number]).columns.tolist(),
            'categorical_columns': df.select_dtypes(include=['object']).columns.tolist(),
        },
    }


def _build_summary(df: pd.DataFrame) -> Dict[str, Any]:
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    return {
        'dataset_overview': {
            'total_records':       len(df),
            'total_columns':       len(df.columns),
            'numeric_columns':     len(numeric_cols),
            'categorical_columns': int(len(df.select_dtypes(include=['object']).columns)),
            'date_range':          _get_date_range(df),
            'data_completeness':   float((1 - df.isnull().sum().sum() / (len(df) * len(df.columns) or 1)) * 100),
        },
        'key_metrics': {
            col: {
                'average':     float(df[col].mean()),
                'range':       float(df[col].max() - df[col].min()),
                'variability': float(df[col].std() / df[col].mean()) if df[col].mean() != 0 else 0.0,
            }
            for col in numeric_cols[:3]
        },
    }


def _fallback_explain(data_results: Dict[str, Any], plan: Dict[str, Any], df: pd.DataFrame, query: str = "") -> Dict[str, Any]:
    data_quality   = _analyze_data_quality(df)
    key_findings:    List[str] = []
    recommendations: List[str] = []
    
    kpis = data_results.get('business_kpis', {})
    total_orders = kpis.get('total_orders', len(df))
    total_revenue = kpis.get('total_revenue', 0.0)
    total_profit = kpis.get('total_profit', 0.0)
    aov = kpis.get('average_order_value', 0.0)
    top_cats = kpis.get('top_categories', [])

    if total_orders > 0:
        key_findings.append(f"Total Orders: {total_orders:,}")
    if total_revenue > 0:
        key_findings.append(f"Total Revenue: £{total_revenue:,.2f}")
    if total_profit > 0:
        key_findings.append(f"Total Profit: £{total_profit:,.2f}")
    if aov > 0:
        key_findings.append(f"Average Order Value (AOV): £{aov:,.2f}")
    if top_cats:
        cat_name = list(top_cats[0].values())[0]
        key_findings.append(f"Top Category: '{cat_name}' leading in sales")

    recommendations.append("Focus marketing efforts on top-performing product categories")
    recommendations.append("Implement automated customer loyalty incentives to boost AOV")

    narrative = f"Based on the dataset analysis of {total_orders} orders, total revenue is £{total_revenue:,.2f} with an estimated profit of £{total_profit:,.2f} (Average Order Value: £{aov:,.2f})."

    return {
        'summary':         _build_summary(df),
        'key_findings':    key_findings[:6],
        'recommendations': recommendations[:5],
        'data_quality':    data_quality,
        'narrative':       narrative,
        'powered_by':      'template_fallback',
    }


EXPLAINER_SYSTEM_PROMPT = """\
You are a Senior Executive Data Analyst. Your job is to answer user business questions about dataset analysis results with extreme precision, citing exact numbers.

You will receive:
1. User's Question
2. Exact calculated Business KPIs (Total Orders, Total Revenue, Total Profit, Average Order Value, Top Categories, Sales Trends, Customer Insights)
3. Numeric column statistics & Data Quality

Your response MUST be valid JSON only (no markdown fences), formatted exactly as:
{
  "narrative": "A clear, professional 2-4 sentence executive response directly answering the user's question with precise figures (Total Orders, Revenue, Profit, AOV, Trends).",
  "key_findings": [
    "Total Orders: X",
    "Total Revenue: $Y",
    "Total Profit: $Z",
    "Average Order Value: $A",
    "Top Category: B"
  ],
  "recommendations": [
    "Strategic actionable recommendation 1",
    "Strategic actionable recommendation 2"
  ]
}

Rules:
- Directly answer the user's specific query using exact numbers provided in the input context.
- Never claim data is missing if numbers are present.
- Keep each finding concise and backed by metrics.
- Output ONLY valid JSON.
"""


def _build_explainer_message(data_results: Dict[str, Any], plan: Dict[str, Any], df: pd.DataFrame, query: str = "") -> str:
    kpis = data_results.get('business_kpis', {})
    raw_data = data_results.get('data', {})

    return (
        f"User Question: '{query}'\n\n"
        f"CALCULATED BUSINESS KPIS:\n{json.dumps(kpis, indent=2, default=str)}\n\n"
        f"OTHER ANALYSIS RESULTS:\n{json.dumps({k: v for k, v in raw_data.items() if k != 'calculate_business_kpis'}, indent=2, default=str)[:1500]}\n\n"
        f"DATASET INFO: {len(df)} total rows across {len(df.columns)} columns.\n\n"
        "Synthesize a complete business response and output valid JSON now."
    )


class ExplainerAgent:
    """
    Explainer Agent — Synthesizes data analysis results into human-readable executive insights.
    """

    def generate_insights(
        self,
        data_results: Dict[str, Any],
        plan:         Dict[str, Any],
        df:           pd.DataFrame,
        query:        str = "",
    ) -> Dict[str, Any]:
        if is_ai_configured():
            try:
                user_msg = _build_explainer_message(data_results, plan, df, query)
                res = call_chat_completion(
                    system_prompt=EXPLAINER_SYSTEM_PROMPT,
                    user_prompt=user_msg,
                    default_model=EXPLAINER_MODEL,
                    temperature=0.3,
                    max_tokens=800,
                )
                llm_data = res["data"]
                return {
                    'summary':         _build_summary(df),
                    'key_findings':    llm_data.get('key_findings', []),
                    'recommendations': llm_data.get('recommendations', []),
                    'data_quality':    _analyze_data_quality(df),
                    'narrative':       llm_data.get('narrative', 'Analysis complete.'),
                    'powered_by':      res["powered_by"],
                }
            except Exception as exc:
                logger.warning("ExplainerAgent LLM call failed (%s) — using fallback.", exc)

        return _fallback_explain(data_results, plan, df, query)
