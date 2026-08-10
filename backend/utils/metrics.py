import time
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

# Metric definitions
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total count of HTTP requests",
    ["method", "endpoint", "status_code"]
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"]
)

LLM_QUERIES_TOTAL = Counter(
    "llm_queries_total",
    "Total count of LLM agent executions",
    ["agent_name", "provider"]
)

def get_metrics_response() -> Response:
    """Return current Prometheus metrics in text exposition format."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
