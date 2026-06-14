"""Iteration 3 backend tests: Parent mode, scheduler, email service.

Covers:
- POST /api/auth/register with role='parent' / 'student'
- POST /api/parent/generate-code (student vs parent)
- POST /api/parent/link (valid/invalid/duplicate/student role)
- GET /api/parent/children
- GET /api/parent/child/{id} (linked vs not-linked)
- POST /api/parent/unlink/{id}
- GET /api/auth/me returns role
- email_service.send_email mock
- scheduler module imports
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _register(session, role=None, full_name=None):
    email = f"test.iter3.{role or 'student'}.{uuid.uuid4().hex[:8]}@eduplus.ro"
    body = {"email": email, "password": "Test123!", "full_name": full_name or f"Iter3 {role or 'student'}"}
    if role:
        body["role"] = role
    r = session.post(f"{API}/auth/register", json=body, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "token": data["token"], "user": data["user"]}


def _hdr(u):
    return {"Authorization": f"Bearer {u['token']}", "Content-Type": "application/json"}


# ============ Registration with role ============
def test_register_default_role_is_student(session):
    u = _register(session)
    assert u["user"].get("role") == "student"
    assert u["user"].get("children") == []
    assert u["user"].get("parents") == []
    assert u["user"].get("parent_code") is None


def test_register_with_role_parent(session):
    u = _register(session, role="parent")
    assert u["user"]["role"] == "parent"
    assert u["user"]["children"] == []
    assert u["user"]["parent_code"] is None


def test_register_with_role_student_explicit(session):
    u = _register(session, role="student")
    assert u["user"]["role"] == "student"


# ============ /api/auth/me returns role ============
def test_me_returns_role_for_student(session):
    u = _register(session)
    r = session.get(f"{API}/auth/me", headers=_hdr(u), timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["role"] == "student"
    assert "children" in body and "parents" in body


def test_me_returns_role_for_parent(session):
    u = _register(session, role="parent")
    r = session.get(f"{API}/auth/me", headers=_hdr(u), timeout=10)
    assert r.status_code == 200
    assert r.json()["role"] == "parent"


# ============ /api/parent/generate-code ============
def test_generate_code_as_student_returns_6char(session):
    u = _register(session)
    r = session.post(f"{API}/parent/generate-code", headers=_hdr(u), timeout=10)
    assert r.status_code == 200
    code = r.json().get("code")
    assert isinstance(code, str) and len(code) == 6
    # Verify it persisted on the user via /auth/me
    me = session.get(f"{API}/auth/me", headers=_hdr(u), timeout=10).json()
    assert me.get("parent_code") == code


def test_generate_code_as_parent_forbidden(session):
    p = _register(session, role="parent")
    r = session.post(f"{API}/parent/generate-code", headers=_hdr(p), timeout=10)
    assert r.status_code == 403


# ============ /api/parent/link ============
def test_parent_link_valid_code(session):
    student = _register(session, role="student", full_name="Alice Child")
    parent = _register(session, role="parent", full_name="Bob Parent")
    code = session.post(f"{API}/parent/generate-code", headers=_hdr(student), timeout=10).json()["code"]
    r = session.post(f"{API}/parent/link", headers=_hdr(parent), json={"code": code}, timeout=10)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True
    assert body.get("child_id") == student["user"]["id"]

    # Verify two-way linking
    parent_me = session.get(f"{API}/auth/me", headers=_hdr(parent), timeout=10).json()
    assert student["user"]["id"] in parent_me["children"]

    child_me = session.get(f"{API}/auth/me", headers=_hdr(student), timeout=10).json()
    assert parent["user"]["id"] in child_me["parents"]
    # Code invalidated
    assert child_me["parent_code"] is None


def test_parent_link_invalid_code(session):
    parent = _register(session, role="parent")
    r = session.post(f"{API}/parent/link", headers=_hdr(parent), json={"code": "ZZZZZZ"}, timeout=10)
    assert r.status_code == 404


def test_parent_link_duplicate_returns_already_linked(session):
    student = _register(session, role="student")
    parent = _register(session, role="parent")
    code = session.post(f"{API}/parent/generate-code", headers=_hdr(student), timeout=10).json()["code"]
    r1 = session.post(f"{API}/parent/link", headers=_hdr(parent), json={"code": code}, timeout=10)
    assert r1.status_code == 200
    # Student needs a new code to attempt re-link; old code is now invalidated.
    # Generate again and call link again with same parent → already linked
    code2 = session.post(f"{API}/parent/generate-code", headers=_hdr(student), timeout=10).json()["code"]
    r2 = session.post(f"{API}/parent/link", headers=_hdr(parent), json={"code": code2}, timeout=10)
    assert r2.status_code == 200
    assert r2.json().get("already_linked") is True


def test_parent_link_as_student_forbidden(session):
    s1 = _register(session, role="student")
    s2 = _register(session, role="student")
    code = session.post(f"{API}/parent/generate-code", headers=_hdr(s1), timeout=10).json()["code"]
    r = session.post(f"{API}/parent/link", headers=_hdr(s2), json={"code": code}, timeout=10)
    assert r.status_code == 403


# ============ /api/parent/children ============
def test_get_children_as_parent_returns_stats(session):
    student = _register(session, role="student", full_name="Stats Child")
    parent = _register(session, role="parent")
    code = session.post(f"{API}/parent/generate-code", headers=_hdr(student), timeout=10).json()["code"]
    session.post(f"{API}/parent/link", headers=_hdr(parent), json={"code": code}, timeout=10)
    r = session.get(f"{API}/parent/children", headers=_hdr(parent), timeout=10)
    assert r.status_code == 200
    children = r.json()
    assert isinstance(children, list) and len(children) == 1
    c = children[0]
    for field in ("id", "full_name", "score_romana", "score_matematica", "points",
                  "current_streak", "medals", "weekly_points", "longest_streak", "total_tests"):
        assert field in c, f"Missing field {field}"
    assert c["full_name"] == "Stats Child"
    assert c["id"] == student["user"]["id"]


def test_get_children_as_student_forbidden(session):
    s = _register(session, role="student")
    r = session.get(f"{API}/parent/children", headers=_hdr(s), timeout=10)
    assert r.status_code == 403


def test_get_children_empty_for_unlinked_parent(session):
    p = _register(session, role="parent")
    r = session.get(f"{API}/parent/children", headers=_hdr(p), timeout=10)
    assert r.status_code == 200
    assert r.json() == []


# ============ /api/parent/child/{id} ============
def test_get_child_as_linked_parent(session):
    student = _register(session, role="student", full_name="Detail Child")
    parent = _register(session, role="parent")
    code = session.post(f"{API}/parent/generate-code", headers=_hdr(student), timeout=10).json()["code"]
    session.post(f"{API}/parent/link", headers=_hdr(parent), json={"code": code}, timeout=10)

    # Have child submit a test for history
    qs = session.get(f"{API}/questions/romana?initial=true", timeout=10).json()
    answers = [{"question_id": q["id"], "selected": 0} for q in qs[:3]]
    session.post(f"{API}/test/submit", headers=_hdr(student),
                 json={"subject": "romana", "answers": answers}, timeout=15)

    r = session.get(f"{API}/parent/child/{student['user']['id']}", headers=_hdr(parent), timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "child" in data and "history" in data
    assert data["child"]["id"] == student["user"]["id"]
    assert isinstance(data["history"], list)
    assert len(data["history"]) >= 1


def test_get_child_as_unlinked_parent_forbidden(session):
    student = _register(session, role="student")
    parent_other = _register(session, role="parent")
    r = session.get(f"{API}/parent/child/{student['user']['id']}",
                    headers=_hdr(parent_other), timeout=10)
    assert r.status_code == 403


def test_get_child_as_student_forbidden(session):
    other_student = _register(session, role="student")
    requester = _register(session, role="student")
    r = session.get(f"{API}/parent/child/{other_student['user']['id']}",
                    headers=_hdr(requester), timeout=10)
    assert r.status_code == 403


# ============ /api/parent/unlink/{id} ============
def test_unlink_removes_both_ways(session):
    student = _register(session, role="student")
    parent = _register(session, role="parent")
    code = session.post(f"{API}/parent/generate-code", headers=_hdr(student), timeout=10).json()["code"]
    session.post(f"{API}/parent/link", headers=_hdr(parent), json={"code": code}, timeout=10)

    # Confirm linked
    pme = session.get(f"{API}/auth/me", headers=_hdr(parent), timeout=10).json()
    assert student["user"]["id"] in pme["children"]

    r = session.post(f"{API}/parent/unlink/{student['user']['id']}", headers=_hdr(parent), timeout=10)
    assert r.status_code == 200
    assert r.json().get("ok") is True

    # Verify removed from parent
    pme2 = session.get(f"{API}/auth/me", headers=_hdr(parent), timeout=10).json()
    assert student["user"]["id"] not in pme2["children"]
    # Verify removed from child
    cme = session.get(f"{API}/auth/me", headers=_hdr(student), timeout=10).json()
    assert parent["user"]["id"] not in cme["parents"]

    # After unlink: parent should no longer see child
    r2 = session.get(f"{API}/parent/child/{student['user']['id']}", headers=_hdr(parent), timeout=10)
    assert r2.status_code == 403


# ============ Email service mock ============
def test_email_service_mock_returns_true():
    from email_service import send_email, render_parent_link_notify, render_session_reminder
    assert send_email("test@example.com", "Subject", "<p>html</p>", "text") is True
    subj, html, text = render_parent_link_notify("Child", "Parent")
    assert "Child" in text and "Parent" in text
    s2, h2, t2 = render_session_reminder("Alice", {
        "title": "Algebră", "professor": "Prof X", "duration_min": 60, "zoom_link": "https://zoom.us/x"
    })
    assert "Algebră" in s2 and "Alice" in t2


def test_scheduler_module_imports():
    import scheduler  # noqa: F401
    assert hasattr(scheduler, "start_scheduler")
    assert hasattr(scheduler, "reset_weekly_points")
    assert hasattr(scheduler, "send_session_reminders")
