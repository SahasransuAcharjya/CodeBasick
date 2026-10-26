"""Global pytest fixtures and test lifecycle hooks."""

import pytest
from app.core.rate_limit import clear_rate_limits
from app.repositories.project_repository import in_memory_repository
from app.repositories.user_repository import in_memory_user_repo


@pytest.fixture(autouse=True)
def reset_global_state_between_tests():
    """Clear memory repositories and rate limit counters before and after each test."""
    clear_rate_limits()
    in_memory_user_repo.clear()
    in_memory_repository.clear()
    yield
    clear_rate_limits()
    in_memory_user_repo.clear()
    in_memory_repository.clear()
