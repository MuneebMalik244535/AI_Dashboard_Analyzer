import pytest
import pandas as pd
from agents.data_worker_agent import DataWorkerAgent
from agents.planner_agent import PlannerAgent
from agents.explainer_agent import ExplainerAgent

def test_data_worker_kpis(sample_csv_df):
    worker = DataWorkerAgent()
    plan = {
        "target_columns": ["revenue", "units_sold"],
        "data_operations": ["calculate_business_kpis", "calculate_summary_stats"]
    }
    result = worker.execute_plan(plan, sample_csv_df)
    
    assert "business_kpis" in result
    kpis = result["business_kpis"]
    assert kpis["total_orders"] == 5
    assert kpis["total_revenue"] == 1600.0
    assert kpis["average_order_value"] == 320.0

def test_planner_fallback(sample_csv_df):
    planner = PlannerAgent()
    # Test keyword detection fallback
    plan = planner.analyze_query("Show me total revenue and top categories", sample_csv_df)
    assert "execution_plan" in plan
    assert "data_operations" in plan["execution_plan"]
