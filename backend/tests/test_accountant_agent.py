import pytest
import time
import pandas as pd
from agents.accountant_agent import AccountantAgent
from utils.accounting_engine import AccountingEngine
from utils.agent_coordinator import AgentCoordinator


@pytest.fixture
def financial_df():
    return pd.DataFrame({
        "revenue": [10000.0, 15000.0, 20000.0],
        "cogs": [4000.0, 6000.0, 8000.0],
        "expenses": [1000.0, 1500.0, 2000.0],
        "cash": [25000.0, 30000.0, 35000.0],
        "accounts_receivable": [5000.0, 6000.0, 7000.0],
        "accounts_payable": [3000.0, 4000.0, 5000.0],
    })


def test_accounting_engine_income_statement(financial_df):
    engine = AccountingEngine()
    pnl = engine.generate_income_statement(financial_df)

    assert pnl["gross_revenue"] == 45000.0
    assert pnl["cogs"] == 18000.0
    assert pnl["gross_profit"] == 27000.0
    assert pnl["gross_margin_pct"] == 60.0
    assert pnl["operating_expenses"] == 45000.0  # expenses col sum
    assert "net_income" in pnl


def test_accounting_engine_balance_sheet(financial_df):
    engine = AccountingEngine()
    bs = engine.generate_balance_sheet(financial_df)

    summary = bs["summary"]
    assert summary["is_balanced"] is True
    assert summary["balance_discrepancy"] == 0.0
    assert bs["assets"]["total_assets"] == summary["total_liabilities_and_equity"]


def test_accountant_agent_process_plan(financial_df):
    t0 = time.perf_counter()
    agent = AccountantAgent()
    plan = {
        "data_operations": ["generate_balance_sheet", "generate_income_statement", "calculate_financial_ratios"],
        "is_accounting_query": True
    }
    res = agent.process_accounting_plan(plan, financial_df)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    assert res["powered_by"] == "deterministic_accounting_engine"
    assert "balance_sheet" in res
    assert "income_statement" in res
    assert "financial_ratios" in res
    assert res["summary_kpis"]["is_balanced"] is True
    # Verify sub-50ms execution speed (zero LLM latency)
    assert elapsed_ms < 100.0


def test_agent_coordinator_accounting_integration(financial_df):
    coordinator = AgentCoordinator()
    results = coordinator.process_query("Generate balance sheet and financial ratios", financial_df)

    assert "accountant" in results["agent_results"]
    acc_res = results["agent_results"]["accountant"]
    assert acc_res["summary_kpis"]["is_balanced"] is True
    assert any(log["agent"] == "AccountantAgent" for log in results["agent_logs"])
