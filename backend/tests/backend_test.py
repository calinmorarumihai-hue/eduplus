"""Backend tests for Edu Plus API"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def test_user(session):
    email = f"test.student.{uuid.uuid4().hex[:8]}@eduplus.ro"
    password = "Test123!"
    payload = {"email": email, "password": password, "full_name": "Test Student"}
    r = session.post(f"{API}/auth/register", json=payload, timeout=20)
    assert r.status_code == 200, f"register failed {r.status_code}: {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    return {"email": email, "password": password, "token": data["token"], "user": data["user"]}


@pytest.fixture(scope="session")
def auth_headers(test_user):
    return {"Authorization": f"Bearer {test_user['token']}", "Content-Type": "application/json"}


# ---- Root ----
def test_root(session):
    r = session.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert r.json().get("message") == "Edu Plus API"


# ---- Auth ----
def test_register_duplicate_rejected(session, test_user):
    r = session.post(
        f"{API}/auth/register",
        json={"email": test_user["email"], "password": "x", "full_name": "Dup"},
        timeout=10,
    )
    assert r.status_code == 400


def test_login_success(session, test_user):
    r = session.post(
        f"{API}/auth/login",
        json={"email": test_user["email"], "password": test_user["password"]},
        timeout=10,
    )
    assert r.status_code == 200
    data = r.json()
    assert "token" in data and data["user"]["email"] == test_user["email"]


def test_login_invalid(session):
    r = session.post(
        f"{API}/auth/login",
        json={"email": "nope@eduplus.ro", "password": "wrong"},
        timeout=10,
    )
    assert r.status_code == 401


def test_me_protected(session):
    r = session.get(f"{API}/auth/me", timeout=10)
    assert r.status_code in (401, 403)


def test_me_with_token(session, auth_headers, test_user):
    r = session.get(f"{API}/auth/me", headers=auth_headers, timeout=10)
    assert r.status_code == 200
    assert r.json()["email"] == test_user["email"]


# ---- Team ----
def test_team(session):
    r = session.get(f"{API}/team", timeout=10)
    assert r.status_code == 200
    team = r.json()
    assert isinstance(team, list)
    assert len(team) >= 4, f"Expected 4+ team members, got {len(team)}"


# ---- Packages ----
def test_packages(session):
    r = session.get(f"{API}/packages", timeout=10)
    assert r.status_code == 200
    pkgs = r.json()
    assert len(pkgs) == 3
    ids = {p["id"] for p in pkgs}
    assert ids == {"starter", "standard", "premium"}


# ---- Questions ----
def test_initial_romana_no_correct(session):
    r = session.get(f"{API}/questions/romana?initial=true", timeout=10)
    assert r.status_code == 200
    qs = r.json()
    assert len(qs) == 5
    for q in qs:
        assert "correct" not in q
        assert "options" in q and "question" in q


def test_initial_mate(session):
    r = session.get(f"{API}/questions/matematica?initial=true", timeout=10)
    assert r.status_code == 200
    qs = r.json()
    assert len(qs) == 5
    for q in qs:
        assert "correct" not in q


# ---- AI study plan: must fail before initial eval ----
def test_ai_plan_blocked_before_eval(session, auth_headers):
    r = session.post(f"{API}/ai/study-plan", headers=auth_headers, timeout=20)
    assert r.status_code == 400, f"Expected 400 before initial eval, got {r.status_code}: {r.text}"


# ---- Submit initial tests ----
def test_submit_initial_romana(session, auth_headers):
    qr = session.get(f"{API}/questions/romana?initial=true", timeout=10).json()
    answers = [{"question_id": q["id"], "selected": 0} for q in qr]
    r = session.post(
        f"{API}/test/submit",
        headers=auth_headers,
        json={"subject": "romana", "is_initial": True, "answers": answers},
        timeout=15,
    )
    assert r.status_code == 200
    data = r.json()
    assert "score" in data and "points_earned" in data and "correct" in data and "total" in data
    assert data["total"] == 5


def test_submit_initial_mate(session, auth_headers):
    qm = session.get(f"{API}/questions/matematica?initial=true", timeout=10).json()
    # Use selected=1 to get some correct
    answers = [{"question_id": q["id"], "selected": 1} for q in qm]
    r = session.post(
        f"{API}/test/submit",
        headers=auth_headers,
        json={"subject": "matematica", "is_initial": True, "answers": answers},
        timeout=15,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 5
    # Verify has_initial_eval flipped
    dash = session.get(f"{API}/dashboard/me", headers=auth_headers, timeout=10).json()
    assert dash["has_initial_eval"] is True


# ---- AI study plan after eval ----
def test_ai_study_plan(session, auth_headers):
    r = session.post(f"{API}/ai/study-plan", headers=auth_headers, timeout=90)
    assert r.status_code == 200, f"AI plan failed: {r.status_code} {r.text}"
    plan = r.json().get("plan", "")
    assert isinstance(plan, str)
    assert len(plan) > 50, f"Plan too short: {plan!r}"


# ---- Dashboard ----
def test_dashboard(session, auth_headers):
    r = session.get(f"{API}/dashboard/me", headers=auth_headers, timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "user" in data and "history" in data and "has_initial_eval" in data
    assert len(data["history"]) >= 2


# ---- Leaderboard ----
def test_leaderboard(session):
    r = session.get(f"{API}/leaderboard", timeout=10)
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list)
    if len(users) >= 2:
        pts = [u.get("points", 0) for u in users]
        assert pts == sorted(pts, reverse=True), "Leaderboard not sorted desc by points"


# ---- Payments ----
def test_checkout_invalid_package(session, auth_headers):
    r = session.post(
        f"{API}/payments/checkout",
        headers=auth_headers,
        json={"package_id": "nonexistent", "origin_url": "https://example.com"},
        timeout=20,
    )
    assert r.status_code == 400


def test_checkout_valid(session, auth_headers):
    r = session.post(
        f"{API}/payments/checkout",
        headers=auth_headers,
        json={"package_id": "starter", "origin_url": "https://example.com"},
        timeout=30,
    )
    assert r.status_code == 200, f"checkout failed: {r.status_code} {r.text}"
    data = r.json()
    assert "url" in data and "session_id" in data
    assert data["url"].startswith("http")
    # Save for status test
    pytest.session_id = data["session_id"]


def test_payment_status(session, auth_headers):
    sid = getattr(pytest, "session_id", None)
    if not sid:
        pytest.skip("No session id from previous test")
    r = session.get(f"{API}/payments/status/{sid}", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert "payment_status" in data and "status" in data and "package_id" in data
    assert data["package_id"] == "starter"


def test_payment_status_invalid(session):
    r = session.get(f"{API}/payments/status/nonexistent_session_xyz", timeout=10)
    assert r.status_code == 404
