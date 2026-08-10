import pytest
import asyncio
from utils.background_tasks import task_manager

@pytest.mark.asyncio
async def test_background_task_execution():
    executed = False

    def dummy_task():
        nonlocal executed
        executed = True

    task = task_manager.run_in_background("test-task-1", dummy_task)
    await task
    assert executed is True
