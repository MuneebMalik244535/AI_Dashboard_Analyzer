"""
AgentCoordinator — Orchestrates the 4-agent multi-agent system.

Multi-Agent Collaboration Pipeline:
  1. PlannerAgent     → Gemini API (via OpenAI SDK) — Analyzes question, schema & outputs strategy plan.
  2. DataWorkerAgent  → Python Data Engine         — Calculates math, aggregations & business KPIs.
  3. ChartAgent       → Plotly Engine              — Converts computed data into visual charts.
  4. ExplainerAgent   → Gemini API (via OpenAI SDK) — Synthesizes executive narrative & business answer.
"""
import time
import logging
from typing import Dict, List, Any

import pandas as pd

from agents.planner_agent     import PlannerAgent
from agents.data_worker_agent import DataWorkerAgent
from agents.accountant_agent  import AccountantAgent
from agents.chart_agent       import ChartAgent
from agents.explainer_agent   import ExplainerAgent

logger = logging.getLogger(__name__)


class AgentCoordinator:
    """Coordinates multi-agent collaboration (Planner, DataWorker, Accountant, Chart, Explainer)."""

    def __init__(self):
        self.planner     = PlannerAgent()
        self.data_worker = DataWorkerAgent()
        self.accountant  = AccountantAgent()
        self.chart_agent = ChartAgent()
        self.explainer   = ExplainerAgent()
        self.execution_history: List[Dict[str, Any]] = []

    def process_query(self, user_query: str, df: pd.DataFrame, chat_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """Run the multi-agent collaborative pipeline for a user query."""
        results: Dict[str, Any] = {
            'query':             user_query,
            'timestamp':         pd.Timestamp.now().isoformat(),
            'agent_results':     {},
            'final_response':    {},
            'followup_questions': [],
            'agent_logs':        [],
            'agent_messages':    [],
            'chat_history':      chat_history or [],
        }

        try:
            # ── Step 1: PlannerAgent ──────────────────────────────────────────
            t0          = time.perf_counter()
            plan_result = self.planner.analyze_query(user_query, df)
            elapsed_planner = round(time.perf_counter() - t0, 3)

            results['agent_results']['planner'] = plan_result
            results['agent_logs'].append({
                'agent':      'PlannerAgent',
                'status':     'completed',
                'elapsed_s':  elapsed_planner,
                'powered_by': plan_result.get('powered_by', 'unknown'),
                'detail':     f"Query Types: {plan_result.get('query_type', [])} | Target Cols: {plan_result.get('mentioned_columns', [])}",
                'reasoning':  plan_result.get('reasoning', ''),
            })
            results['agent_messages'].append({
                'from': 'PlannerAgent',
                'to': 'DataWorkerAgent & AccountantAgent',
                'content': f"Execution Plan formulated. Operations: {plan_result.get('execution_plan', {}).get('data_operations', [])}. Target columns: {plan_result.get('execution_plan', {}).get('target_columns', [])}."
            })
            logger.info("PlannerAgent completed in %.3fs via %s", elapsed_planner, plan_result.get('powered_by'))

            # ── Step 2: DataWorkerAgent ───────────────────────────────────────
            t0          = time.perf_counter()
            data_result = self.data_worker.execute_plan(
                plan_result.get('execution_plan', plan_result), df
            )
            elapsed_worker = round(time.perf_counter() - t0, 3)

            results['agent_results']['data_worker'] = data_result
            kpis = data_result.get('business_kpis', {})
            results['agent_logs'].append({
                'agent':      'DataWorkerAgent',
                'status':     'completed',
                'elapsed_s':  elapsed_worker,
                'powered_by': 'python/pandas/scipy',
                'detail':     f"Executed {len(data_result.get('metadata', {}).get('operations_executed', []))} ops. Total Orders: {kpis.get('total_orders')}, Revenue: £{kpis.get('total_revenue')}, Profit: £{kpis.get('total_profit')}.",
            })
            results['agent_messages'].append({
                'from': 'DataWorkerAgent',
                'to': 'ChartAgent & ExplainerAgent',
                'content': f"Calculated business metrics: Total Orders={kpis.get('total_orders')}, Total Revenue=£{kpis.get('total_revenue')}, AOV=£{kpis.get('average_order_value')}. Passed numerical payload."
            })
            logger.info("DataWorkerAgent completed in %.3fs", elapsed_worker)

            # ── Step 3: AccountantAgent (Zero-Token Financial Engine) ─────────
            t0                = time.perf_counter()
            accounting_result = self.accountant.process_accounting_plan(
                plan_result.get('execution_plan', plan_result), df
            )
            elapsed_accountant = round(time.perf_counter() - t0, 3)

            results['agent_results']['accountant'] = accounting_result
            acc_summary = accounting_result.get('summary_kpis', {})
            results['agent_logs'].append({
                'agent':      'AccountantAgent',
                'status':     'completed',
                'elapsed_s':  elapsed_accountant,
                'powered_by': 'deterministic_accounting_engine',
                'detail':     f"Generated double-entry Balance Sheet & P&L. Assets: £{acc_summary.get('total_assets')}, Liabilities: £{acc_summary.get('total_liabilities')}, Net Income: £{acc_summary.get('net_income')}. Balanced: {acc_summary.get('is_balanced')}.",
            })
            results['agent_messages'].append({
                'from': 'AccountantAgent',
                'to': 'ExplainerAgent & UI',
                'content': f"Financial statements generated deterministically with 0 LLM tokens. Balance Sheet is_balanced={acc_summary.get('is_balanced')}, Current Ratio={acc_summary.get('current_ratio')}."
            })
            logger.info("AccountantAgent completed in %.3fs", elapsed_accountant)

            # ── Step 3: ChartAgent ───────────────────────────────────────────
            t0           = time.perf_counter()
            chart_result = self.chart_agent.create_visualization(
                data_result,
                plan_result.get('execution_plan', plan_result),
                df,
            )
            elapsed_chart = round(time.perf_counter() - t0, 3)

            results['agent_results']['chart_agent'] = chart_result
            results['agent_logs'].append({
                'agent':      'ChartAgent',
                'status':     'completed',
                'elapsed_s':  elapsed_chart,
                'powered_by': 'plotly/graph_objects',
                'detail':     f"Generated {len(chart_result)} visualization(s): {list(chart_result.keys())}.",
            })
            results['agent_messages'].append({
                'from': 'ChartAgent',
                'to': 'ExplainerAgent',
                'content': f"Rendered Plotly interactive chart specs: {list(chart_result.keys())}."
            })
            logger.info("ChartAgent completed in %.3fs", elapsed_chart)

            # ── Step 4: ExplainerAgent ────────────────────────────────────────
            t0             = time.perf_counter()
            insight_result = self.explainer.generate_insights(
                data_result,
                plan_result.get('execution_plan', plan_result),
                df,
                query=user_query,
            )
            elapsed_explainer = round(time.perf_counter() - t0, 3)

            results['agent_results']['explainer'] = insight_result
            results['agent_logs'].append({
                'agent':      'ExplainerAgent',
                'status':     'completed',
                'elapsed_s':  elapsed_explainer,
                'powered_by': insight_result.get('powered_by', 'unknown'),
                'detail':     f"Synthesized executive response. Key findings: {len(insight_result.get('key_findings', []))}.",
            })
            results['agent_messages'].append({
                'from': 'ExplainerAgent',
                'to': 'User Interface',
                'content': f"Final executive response formulated using {insight_result.get('powered_by')}."
            })
            logger.info("ExplainerAgent completed in %.3fs via %s", elapsed_explainer, insight_result.get('powered_by'))

            # ── Follow-up questions & Final Response assembly ────────────────
            results['followup_questions'] = self.planner.suggest_followup_questions(user_query, df)
            results['final_response'] = self._create_final_response(results)

        except Exception as exc:
            logger.exception("AgentCoordinator pipeline error: %s", exc)
            results['error']          = str(exc)
            results['final_response'] = {
                'text':             f"I encountered an error while coordinating agents: {exc}",
                'charts':           {},
                'insights':         {},
                'confidence_score': 0.0,
            }

        self.execution_history.append(results)
        return results

    def generate_insights(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate automatic insights for uploaded dataset."""
        auto_query = (
            "What are the total orders, total revenue, total profit, average order value, top selling categories, and monthly sales trends?"
        )
        return self.process_query(auto_query, df)

    def _create_final_response(self, results: Dict[str, Any]) -> Dict[str, Any]:
        agent_results = results['agent_results']

        final_response: Dict[str, Any] = {
            'text':             '',
            'charts':           {},
            'insights':         {},
            'data_summary':     {},
            'business_kpis':    {},
            'query_type':       [],
            'confidence_score': 0.0,
        }

        if 'explainer' in agent_results:
            er = agent_results['explainer']
            final_response['text']     = er.get('narrative', 'Analysis completed.')
            final_response['insights'] = {
                'summary':         er.get('summary', {}),
                'key_findings':    er.get('key_findings', []),
                'recommendations': er.get('recommendations', []),
                'data_quality':    er.get('data_quality', {}),
                'powered_by':      er.get('powered_by', ''),
            }

        if 'chart_agent' in agent_results:
            final_response['charts'] = agent_results['chart_agent']

        if 'data_worker' in agent_results:
            dw = agent_results['data_worker']
            final_response['data_summary']  = dw.get('statistics', {})
            final_response['business_kpis'] = dw.get('business_kpis', {})

        if 'planner' in agent_results:
            pr = agent_results['planner']
            final_response['query_type']     = pr.get('query_type', [])
            final_response['requires_chart'] = pr.get('requires_chart', False)
            final_response['plan_reasoning'] = pr.get('reasoning', '')

        final_response['confidence_score'] = self._calculate_confidence(results)
        return final_response

    def _calculate_confidence(self, results: Dict[str, Any]) -> float:
        agent_results = results.get('agent_results', {})
        score = sum(
            1.0 for name in ['planner', 'data_worker', 'chart_agent', 'explainer']
            if name in agent_results and 'error' not in agent_results[name]
        )
        explainer = agent_results.get('explainer', {})
        if any(engine in explainer.get('powered_by', '') for engine in ['gemini', 'groq']):
            score = min(score + 0.5, 4.0)
        return round(score / 4.0, 3)

    def get_agent_status(self) -> Dict[str, str]:
        from utils.ai_client import is_ai_configured, PLANNER_MODEL, EXPLAINER_MODEL, GEMINI_API_KEY
        ai_ok = is_ai_configured()
        provider = "gemini" if GEMINI_API_KEY else "groq"
        return {
            'planner':     f"Active — {provider}/{PLANNER_MODEL}" if ai_ok else "Active — keyword_fallback",
            'data_worker': "Active — python/pandas/scipy",
            'chart_agent': "Active — plotly/graph_objects",
            'explainer':   f"Active — {provider}/{EXPLAINER_MODEL}" if ai_ok else "Active — template_fallback",
            'provider':    provider,
            'status':      "connected" if ai_ok else "not_configured",
        }

    def reset_agents(self):
        self.planner     = PlannerAgent()
        self.data_worker = DataWorkerAgent()
        self.chart_agent = ChartAgent()
        self.explainer   = ExplainerAgent()
        self.execution_history = []

    def get_execution_log(self) -> List[Dict[str, Any]]:
        return self.execution_history
