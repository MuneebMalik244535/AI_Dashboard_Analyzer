"""
PlannerAgent — Powered by Gemini API via OpenAI SDK (with Groq fallback).

Responsibilities:
  1. Read user query, dataset schema, sample rows.
  2. Call LLM to produce structured JSON execution plan.
  3. Fall back to keyword-matching if LLM calls fail.
"""

import logging
from typing import List, Dict, Any
import pandas as pd
from utils.ai_client import call_chat_completion, PLANNER_MODEL, is_ai_configured

logger = logging.getLogger(__name__)

QUERY_PATTERNS = {
    'trend':        ['trend', 'pattern', 'over time', 'change', 'growth', 'decline', 'monthly', 'sales trend'],
    'comparison':   ['compare', 'difference', 'versus', 'vs', 'between', 'among', 'top category', 'categories'],
    'correlation':  ['correlation', 'relationship', 'relate', 'association', 'link'],
    'distribution': ['distribution', 'spread', 'range', 'histogram', 'frequency', 'age'],
    'summary':      ['summary', 'overview', 'describe', 'statistics', 'stats', 'total revenue', 'total profit', 'total orders', 'aov', 'average order value'],
    'outlier':      ['outlier', 'anomaly', 'unusual', 'strange', 'abnormal'],
    'chart':        ['chart', 'graph', 'plot', 'visualize', 'show me', 'display'],
    'accounting':   ['balance sheet', 'p&l', 'income statement', 'cash flow', 'accounting', 'accountant', 'financial statement', 'current ratio', 'working capital', 'tax', 'ebitda', 'solvency', 'liquidity', 'debit', 'credit'],
}


def _keyword_detect(query: str) -> List[str]:
    q = query.lower()
    detected = [t for t, kws in QUERY_PATTERNS.items() if any(k in q for k in kws)]
    return detected or ['summary']


def _keyword_columns(query: str, columns: List[str]) -> List[str]:
    q = query.lower()
    mentioned = [c for c in columns if c.lower() in q]
    type_map = {
        'date':       ['date', 'time', 'created', 'updated', 'timestamp', 'month'],
        'price':      ['price', 'cost', 'amount', 'revenue', 'sales', 'profit'],
        'quantity':   ['quantity', 'count', 'number', 'total', 'orders', 'units'],
        'category':   ['category', 'type', 'group', 'classification', 'store', 'product'],
        'accounting': ['asset', 'liability', 'equity', 'payable', 'receivable', 'cash', 'inventory', 'debt', 'cogs', 'tax'],
    }
    for _, kws in type_map.items():
        if any(k in q for k in kws):
            mentioned.extend([c for c in columns if any(k in c.lower() for k in kws)])
    return list(set(mentioned))


def _build_execution_plan(query_type: List[str], columns: List[str], df: pd.DataFrame) -> Dict[str, Any]:
    ops: List[str] = ['calculate_business_kpis']
    fmt = 'text'
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    target = columns or numeric_cols[:5]

    if 'accounting'   in query_type: ops.extend(['generate_balance_sheet', 'generate_income_statement', 'calculate_financial_ratios'])
    if 'trend'        in query_type: ops.extend(['group_by_time', 'calculate_trend']);       fmt = 'chart'
    if 'comparison'   in query_type: ops.extend(['group_by_category', 'calculate_comparison'])
    if 'correlation'  in query_type: ops.extend(['calculate_correlation'])
    if 'distribution' in query_type: ops.extend(['calculate_distribution']);                 fmt = 'chart'
    if 'summary'      in query_type: ops.extend(['calculate_summary_stats'])
    if 'outlier'      in query_type: ops.extend(['detect_outliers'])

    return {
        'data_operations': ops,
        'analysis_type':   query_type,
        'target_columns':  target,
        'output_format':   fmt,
        'is_accounting_query': 'accounting' in query_type or any(o in ops for o in ['generate_balance_sheet', 'generate_income_statement']),
    }


def _fallback_plan(query: str, df: pd.DataFrame) -> Dict[str, Any]:
    query_type = _keyword_detect(query)
    cols       = _keyword_columns(query, df.columns.tolist())
    plan       = _build_execution_plan(query_type, cols, df)
    return {
        'query_type':        query_type,
        'mentioned_columns': cols,
        'execution_plan':    plan,
        'requires_chart':    'chart' in query_type or any(
            w in query.lower() for w in ['show', 'visualize', 'plot', 'graph', 'trend']
        ),
        'is_accounting_query': 'accounting' in query_type,
        'reasoning':         'Fallback keyword-matching strategy generated accounting/analysis steps.',
        'powered_by':        'keyword_fallback',
    }


PLANNER_SYSTEM_PROMPT = """\
You are an expert AI Data & Accounting Planner for an AI Analytics Dashboard.
Analyze the user's business query and dataset schema, then output a structured JSON plan for downstream agents:
  1. AccountantAgent (executes zero-token accounting, balance sheet, P&L, and ratio calculations)
  2. DataWorkerAgent (executes Python data operations & calculates business KPIs)
  3. ChartAgent (renders Plotly charts)
  4. ExplainerAgent (synthesizes human-readable business response & executive CFO summary)

Available data & accounting operations:
  - generate_balance_sheet     : generate double-entry classified Balance Sheet (Assets = Liabilities + Equity)
  - generate_income_statement   : compute P&L statement (Revenue, COGS, EBITDA, EBIT, Net Income)
  - calculate_financial_ratios  : compute solvency, liquidity, profitability, ROA, ROE, Debt-to-Equity
  - calculate_business_kpis   : calculate total orders, total revenue, total profit, AOV, top categories
  - calculate_summary_stats   : descriptive stats (mean, std, min, max, median, nulls)
  - calculate_trend           : time series trend over time
  - calculate_comparison      : group-by aggregation across categorical dimensions

Your output MUST be valid JSON only (no markdown code blocks), matching this exact schema:
{
  "query_type": ["accounting", "summary", "trend", "comparison", "chart"],
  "mentioned_columns": ["col1", "col2"],
  "execution_plan": {
    "data_operations": ["generate_balance_sheet", "generate_income_statement", "calculate_financial_ratios"],
    "analysis_type": ["accounting", "summary"],
    "target_columns": ["revenue", "cogs", "expenses"],
    "output_format": "text or chart",
    "is_accounting_query": true
  },
  "requires_chart": false,
  "reasoning": "Clear 1-2 sentence strategy explaining how downstream agents will handle this query."
}
"""


def _build_user_message(query: str, df: pd.DataFrame) -> str:
    import json
    schema_lines = [f"  - {col} ({dtype})" for col, dtype in df.dtypes.items()]
    schema_str   = "\n".join(schema_lines[:30])
    sample_rows  = df.head(3).to_dict(orient='records')
    return (
        f"User Business Question: '{query}'\n\n"
        f"Dataset Info: {len(df)} rows × {len(df.columns)} columns\n"
        f"Columns:\n{schema_str}\n\n"
        f"Sample Data (first 3 rows):\n{json.dumps(sample_rows, default=str)}\n\n"
        "Generate the structured JSON planning strategy now."
    )


class PlannerAgent:
    """
    Planner Agent — Deconstructs user questions into structured analysis plans.
    """

    def analyze_query(self, query: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Synchronous entry point used by AgentCoordinator."""
        if is_ai_configured():
            try:
                user_msg = _build_user_message(query, df)
                res = call_chat_completion(
                    system_prompt=PLANNER_SYSTEM_PROMPT,
                    user_prompt=user_msg,
                    default_model=PLANNER_MODEL,
                    temperature=0.2,
                    max_tokens=700,
                )
                plan_data = res["data"]
                ep = plan_data.get("execution_plan", {})
                if not ep or not ep.get("data_operations"):
                    qt = plan_data.get("query_type", ["summary"])
                    ep = _build_execution_plan(qt, plan_data.get("mentioned_columns", []), df)
                    plan_data["execution_plan"] = ep

                if "calculate_business_kpis" not in ep.get("data_operations", []):
                    ep.setdefault("data_operations", []).insert(0, "calculate_business_kpis")

                plan_data.setdefault("query_type",        ep.get("analysis_type", ["summary"]))
                plan_data.setdefault("mentioned_columns", ep.get("target_columns", []))
                plan_data.setdefault("requires_chart",    ep.get("output_format") == "chart")
                plan_data["powered_by"] = res["powered_by"]
                logger.info("PlannerAgent succeeded via %s", res["powered_by"])
                return plan_data
            except Exception as exc:
                logger.warning("PlannerAgent LLM call failed (%s) — using keyword fallback.", exc)

        return _fallback_plan(query, df)

    def suggest_followup_questions(self, query: str, df: pd.DataFrame) -> List[str]:
        """Suggest business follow-up questions from dataset schema."""
        numeric_cols     = df.select_dtypes(include=['number']).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        suggestions: List[str] = []

        if numeric_cols:
            suggestions.append(f"What is the total revenue and profit trend over time?")
            suggestions.append(f"What is the average order value (AOV)?")
        if categorical_cols:
            suggestions.append(f"Which are the top-selling categories by revenue?")
            suggestions.append(f"How do sales compare across {categorical_cols[0]}?")
        suggestions.append("What key customer insights can be derived from the data?")

        return suggestions[:4]
