import pytest
import os
import sys
import pandas as pd
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import Base, get_db
from main import app
from models import User
from auth import get_password_hash

TEST_DATABASE_URL = "sqlite:///./test_ai_dashboard.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_ai_dashboard.db"):
        try:
            os.remove("./test_ai_dashboard.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def _get_test_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def sample_csv_df():
    data = {
        "Transaction_ID": [1.0, 2.0, 3.0, 4.0, 5.0],
        "Date": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"],
        "Store_Location": ["Leeds", "London", "Manchester", "Leeds", "Birmingham"],
        "Revenue": [200.0, 450.0, 300.0, 150.0, 500.0],
        "Units_Sold": [5, 10, 6, 3, 12],
        "Product_Category": ["Clothing", "Electronics", "Clothing", "Groceries", "Electronics"]
    }
    return pd.DataFrame(data)
