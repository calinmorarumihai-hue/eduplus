"""Iteration 2 backend tests: categories, exam, streaks, medals, live sessions, weekly leaderboard."""
import os
import uuid
from datetime import datetime, timezone, timedelta
import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def user_a(session):
    """A free user (no premium)."""
    email = f"test.iter2.a.{uuid.uuid4().hex[:8]}@eduplus.ro"
    r = session.post(f"{API}/auth/register", json={"email": email, "password": "Test123!", "full_name": "Iter2 A"}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "token": data["token"], "user": data["user"]}


@pytest.fixture(scope="module")
def hdr_a(user_a):
    return {"Authorization": f"Bearer {user_a['token']}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def user_b(session):
    """A second user used to test premium-restricted session registration."""
    email = f"test.iter2.b.{uuid.uuid4().hex[:8]}@eduplus.ro"
    r = session.post(f"{API}/auth/register", json={"email": email, "password": "Test123!", "full_name": "Iter2 B"}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "token": data["token"], "user": data["user"]}


@pytest.fixture(scope="module")
def hdr_b(user_b):
    return {"Authorization": f"Bearer {user_b['token']}", "Content-Type": "application/json"}


# ============ Question bank / Categories ============
ROMANA_CATS = {"gramatica", "literatura", "vocabular", "fonetica", "sintaxa"}
MATE_CATS = {"algebra", "aritmetica", "geometrie", "ecuatii", "procente"}


def test_categories_romana(session):
    r = session.get(f"{API}/categories/romana", timeout=10)
    assert r.status_code == 200
    cats = r.json()
    assert isinstance(cats, list) and len(cats) == 5
    names = {c["category"] for c in cats}
    assert names == ROMANA_CATS, f"Got {names}"
    total = sum(c["count"] for c in cats)
    assert total == 50, f"Expected 50 questions, got {total}"


def test_categories_matematica(session):
    r = session.get(f"{API}/categories/matematica", timeout=10)
    assert r.status_code == 200
    cats = r.json()
    assert len(cats) == 5
    names = {c["category"] for c in cats}
    assert names == MATE_CATS, f"Got {names}"
    total = sum(c["count"] for c in cats)
    assert total == 50


def test_questions_by_category_romana(session):
    r = session.get(f"{API}/questions/romana?category=gramatica", timeout=10)
    assert r.status_code == 200
    qs = r.json()
    assert len(qs) > 0
    for q in qs:
        assert q["category"] == "gramatica"
        assert "correct" not in q


def test_questions_by_category_mate(session):
    r = session.get(f"{API}/questions/matematica?category=algebra", timeout=10)
    assert r.status_code == 200
    qs = r.json()
    assert len(qs) > 0
    for q in qs:
        assert q["category"] == "algebra"
        assert "correct" not in q


# ============ Exam mode ============
def test_exam_romana(session):
    r = session.get(f"{API}/exam/romana?limit=25", timeout=10)
    assert r.status_code == 200
    qs = r.json()
    assert len(qs) == 25
    for q in qs:
        assert "correct" not in q
        assert "options" in q and "question" in q
    # randomness sanity: not all the same ids on repeat
    r2 = session.get(f"{API}/exam/romana?limit=25", timeout=10).json()
    ids1 = [q["id"] for q in qs]
    ids2 = [q["id"] for q in r2]
    assert ids1 != ids2 or len(set(ids1)) == 25  # at least all unique


def test_exam_mate(session):
    r = session.get(f"{API}/exam/matematica?limit=25", timeout=10)
    assert r.status_code == 200
    qs = r.json()
    assert len(qs) == 25
    for q in qs:
        assert "correct" not in q


# ============ Submit with simulation, streak, medals ============
def test_submit_simulation_doubles_points(session, hdr_a):
    # Get 5 exam questions, submit with is_simulation=true; we don't need any correct
    qs = session.get(f"{API}/exam/romana?limit=5", timeout=10).json()
    answers = [{"question_id": q["id"], "selected": 0} for q in qs]
    r = session.post(f"{API}/test/submit", headers=hdr_a,
                     json={"subject": "romana", "is_simulation": True, "answers": answers, "category": "mixed"}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "current_streak" in data and "medals" in data
    # points = correct * 10 * 2
    assert data["points_earned"] == data["correct"] * 20, f"Expected double points, got {data}"
    assert data["current_streak"] >= 1


def test_submit_returns_streak_medals(session, hdr_a):
    qs = session.get(f"{API}/questions/romana?initial=true", timeout=10).json()
    answers = [{"question_id": q["id"], "selected": 0} for q in qs]
    r = session.post(f"{API}/test/submit", headers=hdr_a,
                     json={"subject": "romana", "is_initial": False, "answers": answers}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "current_streak" in data
    assert "medals" in data
    assert isinstance(data["current_streak"], int)
    assert isinstance(data["medals"], int)
    # Same day → streak stays at 1
    assert data["current_streak"] == 1


def test_medals_increment_every_5(session, hdr_b):
    """Submit 5 tests, medals should go 0,0,0,0,1."""
    qs = session.get(f"{API}/questions/romana?initial=true", timeout=10).json()
    answers = [{"question_id": q["id"], "selected": 0} for q in qs]
    medals_seen = []
    for i in range(5):
        r = session.post(f"{API}/test/submit", headers=hdr_b,
                         json={"subject": "romana", "is_initial": False, "answers": answers}, timeout=15)
        assert r.status_code == 200
        medals_seen.append(r.json()["medals"])
    # total_tests=5 → medals=1 on 5th submit
    assert medals_seen[-1] == 1, f"Expected last medals=1, got sequence {medals_seen}"
    # First submits should be 0
    assert medals_seen[0] == 0


def test_category_stored_in_attempts(session, hdr_b):
    qs = session.get(f"{API}/questions/matematica?category=algebra", timeout=10).json()[:3]
    answers = [{"question_id": q["id"], "selected": 0} for q in qs]
    r = session.post(f"{API}/test/submit", headers=hdr_b,
                     json={"subject": "matematica", "category": "algebra", "answers": answers}, timeout=15)
    assert r.status_code == 200
    # Verify via dashboard history
    dash = session.get(f"{API}/dashboard/me", headers=hdr_b, timeout=10).json()
    assert any(a.get("category") == "algebra" for a in dash["history"]), "category not persisted in test_attempts"


# ============ Leaderboards ============
def test_leaderboard_has_new_fields(session, hdr_a):
    # ensure at least our user has submitted
    r = session.get(f"{API}/leaderboard", timeout=10)
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list)
    if users:
        u = users[0]
        for field in ("current_streak", "longest_streak", "medals", "weekly_points"):
            assert field in u, f"Missing {field} in leaderboard entry: {u}"


def test_weekly_leaderboard(session):
    r = session.get(f"{API}/leaderboard/weekly", timeout=10)
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list)
    for u in users:
        assert u.get("weekly_points", 0) > 0
        assert "current_streak" in u and "medals" in u
    if len(users) >= 2:
        pts = [u["weekly_points"] for u in users]
        assert pts == sorted(pts, reverse=True), "weekly leaderboard not sorted desc"


# ============ Live sessions ============
def test_live_sessions_requires_auth(session):
    r = session.get(f"{API}/live-sessions", timeout=10)
    assert r.status_code in (401, 403)


def test_live_sessions_list(session, hdr_a):
    r = session.get(f"{API}/live-sessions", headers=hdr_a, timeout=10)
    assert r.status_code == 200
    sessions_list = r.json()
    assert len(sessions_list) == 4, f"Expected 4 seeded sessions, got {len(sessions_list)}"
    for s in sessions_list:
        assert "can_attend" in s and "is_registered" in s
        assert "title" in s and "professor" in s and "zoom_link" in s
        assert s["is_registered"] is False
    # Free user: only the 'standard' session should be can_attend=true
    free_attendable = [s for s in sessions_list if s["can_attend"]]
    assert len(free_attendable) >= 1
    # at least one premium-only session exists (can_attend=false for free user)
    blocked = [s for s in sessions_list if not s["can_attend"]]
    assert len(blocked) == 3


def test_register_premium_session_forbidden(session, hdr_a):
    sessions_list = session.get(f"{API}/live-sessions", headers=hdr_a, timeout=10).json()
    premium = next(s for s in sessions_list if s.get("required_package") == "premium")
    r = session.post(f"{API}/live-sessions/register", headers=hdr_a,
                     json={"session_id": premium["id"]}, timeout=10)
    assert r.status_code == 403


def test_register_standard_session_ok(session, hdr_a):
    sessions_list = session.get(f"{API}/live-sessions", headers=hdr_a, timeout=10).json()
    standard = next((s for s in sessions_list if s.get("required_package") != "premium"), None)
    assert standard is not None, "No standard session in seed"
    r = session.post(f"{API}/live-sessions/register", headers=hdr_a,
                     json={"session_id": standard["id"]}, timeout=10)
    assert r.status_code == 200
    # Verify is_registered now true
    sessions_list2 = session.get(f"{API}/live-sessions", headers=hdr_a, timeout=10).json()
    target = next(s for s in sessions_list2 if s["id"] == standard["id"])
    assert target["is_registered"] is True


def test_register_invalid_session(session, hdr_a):
    r = session.post(f"{API}/live-sessions/register", headers=hdr_a,
                     json={"session_id": "nonexistent-xyz"}, timeout=10)
    assert r.status_code == 404


def test_dashboard_has_upcoming_sessions(session, hdr_a):
    r = session.get(f"{API}/dashboard/me", headers=hdr_a, timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "upcoming_sessions" in data
    assert isinstance(data["upcoming_sessions"], list)
    assert len(data["upcoming_sessions"]) <= 3
    for s in data["upcoming_sessions"]:
        assert "can_attend" in s and "is_registered" in s


# ============ Question count sanity ============
def test_total_questions_seeded():
    r = requests.get(f"{API}/categories/romana", timeout=10).json()
    r2 = requests.get(f"{API}/categories/matematica", timeout=10).json()
    total = sum(c["count"] for c in r) + sum(c["count"] for c in r2)
    assert total == 100, f"Expected 100 total questions (50 RO + 50 MAT), got {total}"


# ============ Streak logic: same-day stays at 1 ============
def test_streak_same_day_stays(session):
    """Register fresh user, submit twice same day → streak stays at 1."""
    email = f"test.streak.{uuid.uuid4().hex[:8]}@eduplus.ro"
    reg = session.post(f"{API}/auth/register",
                       json={"email": email, "password": "Test123!", "full_name": "Streak User"}, timeout=20)
    hdr = {"Authorization": f"Bearer {reg.json()['token']}", "Content-Type": "application/json"}
    qs = session.get(f"{API}/questions/romana?initial=true", timeout=10).json()
    answers = [{"question_id": q["id"], "selected": 0} for q in qs]
    r1 = session.post(f"{API}/test/submit", headers=hdr,
                      json={"subject": "romana", "answers": answers}, timeout=15).json()
    r2 = session.post(f"{API}/test/submit", headers=hdr,
                      json={"subject": "romana", "answers": answers}, timeout=15).json()
    assert r1["current_streak"] == 1
    assert r2["current_streak"] == 1, f"Same day should keep streak at 1, got {r2['current_streak']}"
