import asyncio
import logging
from typing import Callable, Any
from utils.logger import get_logger

logger = get_logger(__name__)

class BackgroundTaskManager:
    """Enterprise non-blocking background task runner for asynchronous dataset operations."""
    
    def __init__(self):
        self._running_tasks = {}

    def run_in_background(self, task_id: str, func: Callable, *args: Any, **kwargs: Any):
        """Dispatches non-blocking task execution."""
        logger.info("Enqueuing background task", task_id=task_id, func_name=func.__name__)
        
        async def _wrapper():
            try:
                if asyncio.iscoroutinefunction(func):
                    await func(*args, **kwargs)
                else:
                    func(*args, **kwargs)
                logger.info("Background task completed successfully", task_id=task_id)
            except Exception as e:
                logger.error("Background task failed", task_id=task_id, error=str(e))
            finally:
                self._running_tasks.pop(task_id, None)

        task = asyncio.create_task(_wrapper())
        self._running_tasks[task_id] = task
        return task

task_manager = BackgroundTaskManager()
