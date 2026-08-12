"""
AccountingEngine — High-performance, zero-token deterministic financial & accounting calculation engine.

Capabilities:
  1. Double-entry Balance Sheet generation & validation (Assets = Liabilities + Equity).
  2. Income Statement (Profit & Loss / P&L) computation (Revenue -> COGS -> EBITDA -> Net Income).
  3. Statement of Cash Flows (Operating, Investing, Financing).
  4. Financial Ratio Suite (Current Ratio, Quick Ratio, Debt-to-Equity, Gross Margin, Net Margin, ROA, ROE).
  5. Automated Audit Diagnostics & Anomaly Flags.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class AccountingEngine:
    """
    Deterministic Financial Engine that runs 100% locally with zero LLM API token cost.
    """

    # Keyword mappings for dynamic schema detection
    KEYWORD_MAP = {
        'revenue': ['revenue', 'sales', 'gross_sales', 'turnover', 'income', 'price', 'total_amount', 'amount', 'total_revenue'],
        'cogs': ['cogs', 'cost_of_goods_sold', 'cost', 'product_cost', 'unit_cost', 'purchase_price', 'direct_cost'],
        'opex': ['opex', 'operating_expense', 'expense', 'expenses', 'salary', 'salaries', 'rent', 'utilities', 'marketing', 'overhead', 'admin_expense'],
        'depreciation': ['depreciation', 'amortization', 'dep_expense', 'depr'],
        'cash': ['cash', 'bank', 'cash_and_cash_equivalents', 'liquid_assets', 'cash_balance', 'bank_balance'],
        'accounts_receivable': ['accounts_receivable', 'ar', 'receivable', 'receivables', 'uncollected', 'debtors'],
        'inventory': ['inventory', 'stock', 'merchandise', 'goods'],
        'fixed_assets': ['fixed_assets', 'property', 'plant', 'equipment', 'ppe', 'machinery', 'assets_fixed', 'buildings'],
        'accumulated_depreciation': ['accumulated_depreciation', 'dep_accum', 'depreciation_accumulated'],
        'accounts_payable': ['accounts_payable', 'ap', 'payable', 'payables', 'vendor_dues', 'creditors'],
        'short_term_debt': ['short_term_debt', 'bank_overdraft', 'current_debt', 'short_term_loan', 'st_debt'],
        'long_term_debt': ['long_term_debt', 'mortgage', 'loan', 'long_term_loans', 'bonds_payable', 'lt_debt'],
        'equity': ['equity', 'owner_equity', 'capital', 'retained_earnings', 'share_capital', 'common_stock', 'shareholders_equity'],
        'tax': ['tax', 'taxes', 'tax_expense', 'income_tax'],
        'interest': ['interest', 'interest_expense', 'finance_cost'],
    }

    def _find_col(self, df: pd.DataFrame, target_key: str) -> Optional[str]:
        """Dynamically detect dataframe column matching an accounting concept."""
        keywords = self.KEYWORD_MAP.get(target_key, [])
        cols = df.columns.tolist()
        
        # 1. Exact match (case insensitive)
        for c in cols:
            c_clean = str(c).lower().strip().replace(' ', '_')
            if c_clean in keywords:
                return c

        # 2. Substring match
        for c in cols:
            c_clean = str(c).lower().strip().replace(' ', '_')
            if any(k in c_clean for k in keywords):
                return c

        return None

    def _get_val(self, df: pd.DataFrame, key: str, default: float = 0.0) -> float:
        col = self._find_col(df, key)
        if col and col in df.columns:
            series = pd.to_numeric(df[col], errors='coerce').dropna()
            if not series.empty:
                return float(series.sum())
        return default

    def generate_income_statement(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate Income Statement (Profit & Loss).
        Calculates: Gross Revenue, COGS, Gross Profit, OpEx, EBITDA, Depreciation, EBIT, Tax, Net Income.
        """
        revenue = self._get_val(df, 'revenue', default=0.0)
        cogs = self._get_val(df, 'cogs', default=0.0)

        # If cogs not found, estimate based on standard 60% cost if revenue exists
        if cogs == 0.0 and revenue > 0.0 and self._find_col(df, 'cogs') is None:
            cogs = round(revenue * 0.60, 2)

        gross_profit = revenue - cogs
        gross_margin_pct = (gross_profit / revenue * 100.0) if revenue > 0 else 0.0

        opex = self._get_val(df, 'opex', default=0.0)
        if opex == 0.0 and revenue > 0.0 and self._find_col(df, 'opex') is None:
            opex = round(revenue * 0.15, 2)

        ebitda = gross_profit - opex
        depreciation = self._get_val(df, 'depreciation', default=round(revenue * 0.03, 2) if revenue > 0 else 0.0)
        ebit = ebitda - depreciation

        interest = self._get_val(df, 'interest', default=0.0)
        taxable_income = max(0.0, ebit - interest)
        tax_expense = self._get_val(df, 'tax', default=round(taxable_income * 0.20, 2))

        net_income = ebit - interest - tax_expense
        net_margin_pct = (net_income / revenue * 100.0) if revenue > 0 else 0.0

        return {
            'gross_revenue': round(revenue, 2),
            'cogs': round(cogs, 2),
            'gross_profit': round(gross_profit, 2),
            'gross_margin_pct': round(gross_margin_pct, 2),
            'operating_expenses': round(opex, 2),
            'ebitda': round(ebitda, 2),
            'depreciation_amortization': round(depreciation, 2),
            'ebit': round(ebit, 2),
            'interest_expense': round(interest, 2),
            'tax_expense': round(tax_expense, 2),
            'net_income': round(net_income, 2),
            'net_margin_pct': round(net_margin_pct, 2),
        }

    def generate_balance_sheet(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate Classified Double-Entry Balance Sheet.
        Ensures Assets = Liabilities + Equity.
        """
        pnl = self.generate_income_statement(df)
        net_income = pnl['net_income']

        # Assets
        cash = self._get_val(df, 'cash', default=round(pnl['gross_revenue'] * 0.25, 2) if pnl['gross_revenue'] > 0 else 50000.0)
        ar = self._get_val(df, 'accounts_receivable', default=round(pnl['gross_revenue'] * 0.12, 2) if pnl['gross_revenue'] > 0 else 15000.0)
        inventory = self._get_val(df, 'inventory', default=round(pnl['cogs'] * 0.15, 2) if pnl['cogs'] > 0 else 10000.0)
        current_assets = cash + ar + inventory

        fixed_assets_gross = self._get_val(df, 'fixed_assets', default=round(pnl['gross_revenue'] * 0.40, 2) if pnl['gross_revenue'] > 0 else 80000.0)
        accum_depr = self._get_val(df, 'accumulated_depreciation', default=round(fixed_assets_gross * 0.20, 2))
        fixed_assets_net = max(0.0, fixed_assets_gross - accum_depr)
        
        total_assets = current_assets + fixed_assets_net

        # Liabilities
        ap = self._get_val(df, 'accounts_payable', default=round(pnl['cogs'] * 0.10, 2) if pnl['cogs'] > 0 else 8000.0)
        st_debt = self._get_val(df, 'short_term_debt', default=round(total_assets * 0.05, 2))
        current_liabilities = ap + st_debt

        lt_debt = self._get_val(df, 'long_term_debt', default=round(total_assets * 0.20, 2))
        total_liabilities = current_liabilities + lt_debt

        # Equity (Plug retained earnings / capital to balance double-entry if not explicitly provided)
        user_equity = self._get_val(df, 'equity', default=0.0)
        if user_equity > 0.0:
            retained_earnings = user_equity + net_income
        else:
            retained_earnings = round(total_assets - total_liabilities, 2)

        total_equity = retained_earnings
        total_liabilities_and_equity = total_liabilities + total_equity

        balance_discrepancy = round(total_assets - total_liabilities_and_equity, 2)
        is_balanced = abs(balance_discrepancy) < 0.01

        return {
            'assets': {
                'current_assets': {
                    'cash_and_equivalents': round(cash, 2),
                    'accounts_receivable': round(ar, 2),
                    'inventory': round(inventory, 2),
                    'total_current_assets': round(current_assets, 2),
                },
                'non_current_assets': {
                    'fixed_assets_gross': round(fixed_assets_gross, 2),
                    'accumulated_depreciation': round(accum_depr, 2),
                    'fixed_assets_net': round(fixed_assets_net, 2),
                    'total_non_current_assets': round(fixed_assets_net, 2),
                },
                'total_assets': round(total_assets, 2),
            },
            'liabilities': {
                'current_liabilities': {
                    'accounts_payable': round(ap, 2),
                    'short_term_debt': round(st_debt, 2),
                    'total_current_liabilities': round(current_liabilities, 2),
                },
                'non_current_liabilities': {
                    'long_term_debt': round(lt_debt, 2),
                    'total_non_current_liabilities': round(lt_debt, 2),
                },
                'total_liabilities': round(total_liabilities, 2),
            },
            'equity': {
                'retained_earnings': round(retained_earnings, 2),
                'net_income_current_period': round(net_income, 2),
                'total_equity': round(total_equity, 2),
            },
            'summary': {
                'total_assets': round(total_assets, 2),
                'total_liabilities_and_equity': round(total_liabilities_and_equity, 2),
                'balance_discrepancy': balance_discrepancy,
                'is_balanced': is_balanced,
            }
        }

    def generate_cash_flow_statement(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate Statement of Cash Flows (Operating, Investing, Financing).
        """
        pnl = self.generate_income_statement(df)
        net_income = pnl['net_income']
        depr = pnl['depreciation_amortization']

        # Operating activities
        operating_cash_flow = net_income + depr
        # Investing activities (CapEx estimate)
        investing_cash_flow = round(-pnl['gross_revenue'] * 0.05, 2) if pnl['gross_revenue'] > 0 else 0.0
        # Financing activities
        financing_cash_flow = round(-net_income * 0.10, 2)  # dividend / debt paydown estimate

        net_cash_change = operating_cash_flow + investing_cash_flow + financing_cash_flow

        return {
            'operating_activities': {
                'net_income': net_income,
                'add_depreciation': depr,
                'total_operating_cash_flow': round(operating_cash_flow, 2),
            },
            'investing_activities': {
                'capital_expenditures': investing_cash_flow,
                'total_investing_cash_flow': round(investing_cash_flow, 2),
            },
            'financing_activities': {
                'dividends_debt_payments': financing_cash_flow,
                'total_financing_cash_flow': round(financing_cash_flow, 2),
            },
            'net_change_in_cash': round(net_cash_change, 2),
        }

    def calculate_financial_ratios(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate key financial solvency, liquidity, profitability, and efficiency ratios.
        """
        bs = self.generate_balance_sheet(df)
        pnl = self.generate_income_statement(df)

        ca = bs['assets']['current_assets']['total_current_assets']
        inv = bs['assets']['current_assets']['inventory']
        cl = bs['liabilities']['current_liabilities']['total_current_liabilities']
        ta = bs['assets']['total_assets']
        tl = bs['liabilities']['total_liabilities']
        eq = bs['equity']['total_equity']
        net_income = pnl['net_income']

        # Liquidity
        current_ratio = round(ca / cl, 2) if cl > 0 else 0.0
        quick_ratio = round((ca - inv) / cl, 2) if cl > 0 else 0.0
        working_capital = round(ca - cl, 2)

        # Solvency
        debt_to_equity = round(tl / eq, 2) if eq > 0 else 0.0
        debt_to_assets = round(tl / ta, 2) if ta > 0 else 0.0

        # Profitability
        gross_margin = pnl['gross_margin_pct']
        net_margin = pnl['net_margin_pct']
        roa = round((net_income / ta * 100.0), 2) if ta > 0 else 0.0
        roe = round((net_income / eq * 100.0), 2) if eq > 0 else 0.0

        return {
            'liquidity': {
                'current_ratio': current_ratio,
                'quick_ratio': quick_ratio,
                'working_capital': working_capital,
                'status': 'Healthy' if current_ratio >= 1.5 else ('Warning' if current_ratio >= 1.0 else 'Critical'),
            },
            'solvency': {
                'debt_to_equity': debt_to_equity,
                'debt_to_assets': debt_to_assets,
                'status': 'Healthy' if debt_to_equity <= 1.5 else 'High Leverage Risk',
            },
            'profitability': {
                'gross_margin_pct': gross_margin,
                'net_margin_pct': net_margin,
                'return_on_assets_roa': roa,
                'return_on_equity_roe': roe,
                'status': 'Profitable' if net_income > 0 else 'Unprofitable',
            }
        }

    def detect_audit_anomalies(self, df: pd.DataFrame) -> List[Dict[str, str]]:
        """
        Run automated accounting audit diagnostic rules.
        """
        anomalies: List[Dict[str, str]] = []
        bs = self.generate_balance_sheet(df)
        pnl = self.generate_income_statement(df)
        ratios = self.calculate_financial_ratios(df)

        # 1. Unbalanced Balance Sheet
        if not bs['summary']['is_balanced']:
            anomalies.append({
                'severity': 'CRITICAL',
                'category': 'Double-Entry Integrity',
                'issue': f"Balance Sheet does not balance! Discrepancy of {bs['summary']['balance_discrepancy']} found between Assets and Liabilities+Equity.",
            })

        # 2. Negative Cash
        cash = bs['assets']['current_assets']['cash_and_equivalents']
        if cash < 0:
            anomalies.append({
                'severity': 'HIGH',
                'category': 'Liquidity Deficit',
                'issue': f"Negative cash balance detected (£{cash:,.2f}). Overdraft alert.",
            })

        # 3. Insolvency Risk (Current Ratio < 1.0)
        cr = ratios['liquidity']['current_ratio']
        if cr < 1.0:
            anomalies.append({
                'severity': 'HIGH',
                'category': 'Solvency Warning',
                'issue': f"Current Ratio is {cr} (below 1.0 threshold). Current liabilities exceed current assets.",
            })

        # 4. Excessive Debt (Debt to Equity > 2.5)
        dte = ratios['solvency']['debt_to_equity']
        if dte > 2.5:
            anomalies.append({
                'severity': 'MEDIUM',
                'category': 'Capital Structure',
                'issue': f"Debt-to-Equity ratio is unusually high ({dte}). High leverage detected.",
            })

        # 5. Negative Gross Margin
        gm = pnl['gross_margin_pct']
        if gm < 0:
            anomalies.append({
                'severity': 'CRITICAL',
                'category': 'Profitability Alarm',
                'issue': f"Negative Gross Margin detected ({gm}%). Cost of Goods Sold exceeds gross revenue.",
            })

        return anomalies
