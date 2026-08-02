"""
Wrapper module maintaining backwards compatibility for groq_client imports.
Re-exports client factories from utils.ai_client.
"""
from utils.ai_client import (
    get_ai_sync_client as get_groq_sync_client,
    get_ai_async_client as get_groq_async_client,
    is_ai_configured as is_groq_configured,
    PLANNER_MODEL,
    EXPLAINER_MODEL
)
