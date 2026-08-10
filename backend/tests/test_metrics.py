import pytest

def test_prometheus_metrics_endpoint(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    content = response.text
    assert "# HELP" in content or "http_requests_total" in content or "python_info" in content
