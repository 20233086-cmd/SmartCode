import os, tempfile
from pathlib import Path
import pytest

TEST_DIR = tempfile.TemporaryDirectory(prefix="smartcode-tests-")
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(TEST_DIR.name) / "tests.db")
os.environ["SMARTCODE_DATA_DIR"] = str(Path(TEST_DIR.name) / "data")
os.environ["JWT_SECRET"] = "test-only-secret-not-for-production-1234567890"
os.environ["AUTO_SEED"] = "true"
os.environ["JUDGE0_URL"] = ""
os.environ["OLLAMA_URL"] = ""
os.environ["DEMO_PAYMENTS"] = "true"
os.environ["DEMO_PASSWORD"] = "SmartCode@123"
from fastapi.testclient import TestClient
from app.main import app, _attempts
from app.db import Base, engine, Session


@pytest.fixture
def client():
    Base.metadata.drop_all(engine)
    _attempts.clear()
    with TestClient(app) as client:
        yield client


@pytest.fixture
def learner(client):
    assert (
        client.post(
            "/api/auth/login",
            json={"email": "learner@smartcode.local", "password": "SmartCode@123"},
        ).status_code
        == 200
    )
    return client


def login(client, role):
    r = client.post(
        "/api/auth/login",
        json={"email": role + "@smartcode.local", "password": "SmartCode@123"},
    )
    assert r.status_code == 200
    return r.json()
