import pytest
import os
import pandas as pd
from utils.storage_manager import StorageManager
from models import User
from auth import require_role
from fastapi import HTTPException


def test_storage_manager_local_fallback(tmp_path):
    storage = StorageManager(local_dir=str(tmp_path))
    content = "header1,header2\n10,20\n30,40\n"
    filename = "test_dataset.csv"

    saved_path = storage.save_file(content, filename)
    assert os.path.exists(saved_path)

    read_bytes = storage.read_file_bytes(filename)
    assert read_bytes is not None
    assert b"header1,header2" in read_bytes

    deleted = storage.delete_file(filename)
    assert deleted is True


def test_user_rbac_roles():
    cfo_user = User(email="cfo@company.com", hashed_password="pw", role="cfo")
    analyst_user = User(email="analyst@company.com", hashed_password="pw", role="analyst")

    checker = require_role(["cfo", "admin"])

    # CFO user should pass
    validated_cfo = checker(user=cfo_user)
    assert validated_cfo.role == "cfo"

    # Analyst user should raise 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        checker(user=analyst_user)
    assert exc_info.value.status_code == 403
