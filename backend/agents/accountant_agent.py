"""
AccountantAgent — Specialized Autonomous Agent for Accounting, Balance Sheet & Financial Statement Generation.

Features:
  1. Zero-Token Accounting Computation powered by AccountingEngine.
  2. Double-entry Balance Sheet, P&L (Income Statement), and Cash Flow generation.
  3. Financial Ratio Analysis & Solvency/Liquidity diagnostics.
  4. Automated Audit Anomaly detection.
  5. Standardized MCP Tool Schema definitions for external integration (QuickBooks, Xero, Stripe, ERP).
"""

import logging
from typing import Dict, List, Any
import pandas as pd

from utils.accounting_engine import AccountingEngine

logger = logging.getLogger(__name__)


class AccountantAgent:
    """
    Accountant Agent handles all accounting and financial calculation workflows
    without consuming LLM tokens.
    """

    def __init__(self):
        self.engine = AccountingEngine()

    def process_accounting_plan(self, plan: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
        """
        Execute accounting tasks based on the execution plan or query intent.
        """
        results: Dict[str, Any] = {
            'agent': 'AccountantAgent',
            'powered_by': 'deterministic_accounting_engine',
            'balance_sheet': {},
            'income_statement': {},
            'cash_flow_statement': {},
            'financial_ratios': {},
            'audit_anomalies': [],
            'summary_kpis': {},
        }

        try:
            # 1. Income Statement
            income_stmt = self.engine.generate_income_statement(df)
            results['income_statement'] = income_stmt

            # 2. Balance Sheet
            balance_sheet = self.engine.generate_balance_sheet(df)
            results['balance_sheet'] = balance_sheet

            # 3. Cash Flow Statement
            cash_flow = self.engine.generate_cash_flow_statement(df)
            results['cash_flow_statement'] = cash_flow

            # 4. Financial Ratios
            ratios = self.calculate_ratios(df)
            results['financial_ratios'] = ratios

            # 5. Audit Diagnostics
            anomalies = self.engine.detect_audit_anomalies(df)
            results['audit_anomalies'] = anomalies

            # 6. Executive Accounting Summary KPIs
            results['summary_kpis'] = {
                'gross_revenue': income_stmt['gross_revenue'],
                'net_income': income_stmt['net_income'],
                'total_assets': balance_sheet['summary']['total_assets'],
                'total_liabilities': balance_sheet['liabilities']['total_liabilities'],
                'equity': balance_sheet['equity']['total_equity'],
                'is_balanced': balance_sheet['summary']['is_balanced'],
                'current_ratio': ratios['liquidity']['current_ratio'],
                'net_margin_pct': income_stmt['net_margin_pct'],
                'anomaly_count': len(anomalies),
            }

            logger.info("AccountantAgent successfully generated financial statements & ratios.")
        except Exception as e:
            logger.error("AccountantAgent processing error: %s", e)
            results['error'] = str(e)

        return results

    def generate_balance_sheet(self, df: pd.DataFrame) -> Dict[str, Any]:
        return self.engine.generate_balance_sheet(df)

    def generate_income_statement(self, df: pd.DataFrame) -> Dict[str, Any]:
        return self.engine.generate_income_statement(df)

    def calculate_ratios(self, df: pd.DataFrame) -> Dict[str, Any]:
        return self.engine.calculate_financial_ratios(df)

    def get_mcp_tool_definitions(self) -> List[Dict[str, Any]]:
        """
        Expose standardized Model Context Protocol (MCP) tool schemas for external client integration.
        """
        return [
            {
                "name": "generate_balance_sheet",
                "description": "Generates a double-entry classified Balance Sheet (Assets = Liabilities + Equity) from accounting ledger data.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "dataset_id": {"type": "string", "description": "Target dataset or CSV session ID"}
                    },
                    "required": ["dataset_id"]
                }
            },
            {
                "name": "generate_income_statement",
                "description": "Computes Profit and Loss (P&L) breakdown: Revenue, COGS, EBITDA, EBIT, and Net Profit.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "dataset_id": {"type": "string", "description": "Target dataset or CSV session ID"}
                    },
                    "required": ["dataset_id"]
                }
            },
            {
                "name": "calculate_financial_ratios",
                "description": "Calculates Current Ratio, Quick Ratio, Debt-to-Equity, ROA, ROE, and Gross/Net Margins.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "dataset_id": {"type": "string", "description": "Target dataset or CSV session ID"}
                    },
                    "required": ["dataset_id"]
                }
            },
            {
                "name": "run_audit_diagnostics",
                "description": "Detects accounting anomalies, unbalanced double-entry balance sheets, and insolvency flags.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "dataset_id": {"type": "string", "description": "Target dataset or CSV session ID"}
                    },
                    "required": ["dataset_id"]
                }
            }
        ]
