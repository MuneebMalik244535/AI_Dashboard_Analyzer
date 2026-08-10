import pytest
from utils.logger import setup_logging, get_logger

def test_structured_logger():
    setup_logging()
    logger = get_logger("test_module")
    assert logger is not None
    # Verify binding trace context
    bound_logger = logger.bind(trace_id="test-trace-123", user_id="user-456")
    assert bound_logger is not None
