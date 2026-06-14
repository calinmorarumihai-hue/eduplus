"""Iteration 4 backend tests: Admin panel CRUD + analytics.

Covers:
- POST /api/auth/login admin credentials -> role='admin'
- GET /api/admin/stats: 401 anon, 403 student, 200 admin (validates keys/types)
- GET /api/admin/questions (admin only, filter by subject, exposes 'correct')
- POST/PUT/DELETE /api/admin/questions
- GET/POST/PUT/DELETE /api/admin/packages, 400 on duplicate id, 404 on unknown
- Public GET /api/packages reflects admin updates and uses db.packages
- POST /api/payments/checkout: 400 on invalid package_id; valid -> creates session
- GET/POST/PUT/DELETE /api/admin/team
- GET/POST/PUT/DELETE /api/admin/sessions (PUT excludes reminder_sent)
- 401 (no auth) and 403 (non-admin) on every /api/admin/* route
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "calinmorarumihai@gmail.com"
ADMIN_PASS = "EduPlus@Admin2026!"


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin", f"expected role=admin got {data['user'].get('role')}"
    return data["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def student_token(s):
    email = f"test.iter4.student.{uuid.uuid4().hex[:8]}@eduplus.ro"
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "Test123!", "full_name": "Iter4 Student", "role": "student"
    }, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def student_headers(student_token):
    return {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}


# ---------- auth/role ----------
class TestAdminLogin:
    def test_admin_login_returns_role_admin(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and isinstance(d["token"], str) and len(d["token"]) > 20
        assert d["user"]["role"] == "admin"
        assert d["user"]["email"] == ADMIN_EMAIL


# ---------- /admin/stats ----------
class TestAdminStats:
    def test_stats_unauth_401(self, s):
        r = s.get(f"{API}/admin/stats", timeout=10)
        assert r.status_code == 401

    def test_stats_student_403(self, s, student_headers):
        r = s.get(f"{API}/admin/stats", headers=student_headers, timeout=10)
        assert r.status_code == 403

    def test_stats_admin_200(self, s, admin_headers):
        r = s.get(f"{API}/admin/stats", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in [
            "total_students", "total_parents", "total_tests_taken", "total_questions",
            "paid_transactions", "revenue_ron", "avg_score_romana", "avg_score_matematica", "top_users"
        ]:
            assert k in d, f"missing key {k}"
        assert isinstance(d["top_users"], list)
        assert len(d["top_users"]) <= 5
        assert isinstance(d["total_questions"], int) and d["total_questions"] >= 0
        assert isinstance(d["revenue_ron"], (int, float))


# ---------- /admin/questions ----------
class TestAdminQuestions:
    def test_list_unauth_401(self, s):
        assert s.get(f"{API}/admin/questions", timeout=10).status_code == 401

    def test_list_student_403(self, s, student_headers):
        assert s.get(f"{API}/admin/questions", headers=student_headers, timeout=10).status_code == 403

    def test_list_admin_with_subject_filter(self, s, admin_headers):
        r = s.get(f"{API}/admin/questions?subject=romana", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        qs = r.json()
        assert isinstance(qs, list) and len(qs) > 0
        assert all(q["subject"] == "romana" for q in qs)
        # admin endpoint must expose 'correct'
        assert all("correct" in q for q in qs[:5])

    def test_create_update_delete_question(self, s, admin_headers):
        payload = {
            "subject": "romana", "category": "TEST_iter4",
            "question": "TEST_iter4 Q?",
            "options": ["a", "b", "c", "d"], "correct": 2, "is_initial": False,
        }
        r = s.post(f"{API}/admin/questions", json=payload, headers=admin_headers, timeout=10)
        assert r.status_code == 200, r.text
        qid = r.json()["id"]
        assert isinstance(qid, str) and len(qid) > 0

        # verify via GET
        r2 = s.get(f"{API}/admin/questions?subject=romana", headers=admin_headers, timeout=15)
        assert any(q["id"] == qid and q["question"] == "TEST_iter4 Q?" for q in r2.json())

        # update
        updated = {**payload, "question": "TEST_iter4 Q? updated", "correct": 0}
        r3 = s.put(f"{API}/admin/questions/{qid}", json=updated, headers=admin_headers, timeout=10)
        assert r3.status_code == 200
        r4 = s.get(f"{API}/admin/questions?subject=romana", headers=admin_headers, timeout=15)
        match = [q for q in r4.json() if q["id"] == qid]
        assert match and match[0]["question"] == "TEST_iter4 Q? updated" and match[0]["correct"] == 0

        # 404 unknown update
        r5 = s.put(f"{API}/admin/questions/no-such-id", json=updated, headers=admin_headers, timeout=10)
        assert r5.status_code == 404

        # delete
        r6 = s.delete(f"{API}/admin/questions/{qid}", headers=admin_headers, timeout=10)
        assert r6.status_code == 200
        r7 = s.delete(f"{API}/admin/questions/{qid}", headers=admin_headers, timeout=10)
        assert r7.status_code == 404


# ---------- /admin/packages + public sync ----------
class TestAdminPackages:
    def test_list_unauth_401(self, s):
        assert s.get(f"{API}/admin/packages", timeout=10).status_code == 401

    def test_list_student_403(self, s, student_headers):
        assert s.get(f"{API}/admin/packages", headers=student_headers, timeout=10).status_code == 403

    def test_admin_list_has_three_defaults(self, s, admin_headers):
        r = s.get(f"{API}/admin/packages", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        ids = {p["id"] for p in r.json()}
        assert {"starter", "standard", "premium"}.issubset(ids)

    def test_public_packages_from_db(self, s):
        r = s.get(f"{API}/packages", timeout=10)
        assert r.status_code == 200
        pkgs = r.json()
        ids = {p["id"] for p in pkgs}
        assert {"starter", "standard", "premium"}.issubset(ids)
        # sorted by price ascending
        prices = [p["price"] for p in pkgs]
        assert prices == sorted(prices)

    def test_update_package_reflects_in_public(self, s, admin_headers):
        # fetch current standard
        r = s.get(f"{API}/admin/packages", headers=admin_headers, timeout=10)
        std = next(p for p in r.json() if p["id"] == "standard")
        orig_price = std["price"]
        new_price = orig_price + 1.0
        payload = {**std, "price": new_price}
        r2 = s.put(f"{API}/admin/packages/standard", json=payload, headers=admin_headers, timeout=10)
        assert r2.status_code == 200

        # public GET reflects new price
        r3 = s.get(f"{API}/packages", timeout=10)
        assert r3.status_code == 200
        pub_std = next(p for p in r3.json() if p["id"] == "standard")
        assert pub_std["price"] == new_price

        # restore
        r4 = s.put(f"{API}/admin/packages/standard", json={**std, "price": orig_price}, headers=admin_headers, timeout=10)
        assert r4.status_code == 200

    def test_create_duplicate_400_and_404(self, s, admin_headers):
        body = {
            "id": "starter", "name": "dup", "price": 1.0, "currency": "ron",
            "description": "x", "features": ["a"], "popular": False,
        }
        r = s.post(f"{API}/admin/packages", json=body, headers=admin_headers, timeout=10)
        assert r.status_code == 400

        r2 = s.put(f"{API}/admin/packages/__nope__", json=body, headers=admin_headers, timeout=10)
        assert r2.status_code == 404
        r3 = s.delete(f"{API}/admin/packages/__nope__", headers=admin_headers, timeout=10)
        assert r3.status_code == 404

    def test_create_and_delete_custom_package(self, s, admin_headers):
        pid = f"test_iter4_{uuid.uuid4().hex[:6]}"
        body = {
            "id": pid, "name": "TEST_iter4 pkg", "price": 9.99, "currency": "ron",
            "description": "test pkg", "features": ["f1", "f2"], "popular": False,
        }
        r = s.post(f"{API}/admin/packages", json=body, headers=admin_headers, timeout=10)
        assert r.status_code == 200
        # public reflects it
        r2 = s.get(f"{API}/packages", timeout=10)
        assert any(p["id"] == pid for p in r2.json())
        # delete
        r3 = s.delete(f"{API}/admin/packages/{pid}", headers=admin_headers, timeout=10)
        assert r3.status_code == 200
        r4 = s.get(f"{API}/packages", timeout=10)
        assert not any(p["id"] == pid for p in r4.json())


# ---------- /payments/checkout uses DB packages ----------
class TestCheckoutDbPackages:
    def test_invalid_package_400(self, s, student_headers):
        r = s.post(f"{API}/payments/checkout", json={
            "package_id": "nonexistent_pkg_xyz", "origin_url": BASE_URL
        }, headers=student_headers, timeout=15)
        assert r.status_code == 400

    def test_valid_package_creates_session(self, s, student_headers):
        r = s.post(f"{API}/payments/checkout", json={
            "package_id": "starter", "origin_url": BASE_URL
        }, headers=student_headers, timeout=30)
        # 200 on success, but tolerate upstream stripe outage with 5xx (not a validation bug)
        assert r.status_code == 200, f"checkout failed: {r.status_code} {r.text}"
        d = r.json()
        assert "url" in d and d["url"].startswith("http")
        assert "session_id" in d


# ---------- /admin/team ----------
class TestAdminTeam:
    def test_unauth_403(self, s, student_headers):
        assert s.get(f"{API}/admin/team", timeout=10).status_code == 401
        assert s.get(f"{API}/admin/team", headers=student_headers, timeout=10).status_code == 403

    def test_team_crud(self, s, admin_headers):
        r = s.get(f"{API}/admin/team", headers=admin_headers, timeout=10)
        assert r.status_code == 200 and isinstance(r.json(), list)

        body = {
            "name": "TEST_iter4 Prof", "subject": "Matematică",
            "bio": "bio", "fun_fact": "ff", "image": "https://example.com/x.jpg",
        }
        r2 = s.post(f"{API}/admin/team", json=body, headers=admin_headers, timeout=10)
        assert r2.status_code == 200
        tid = r2.json()["id"]

        r3 = s.put(f"{API}/admin/team/{tid}", json={**body, "bio": "bio2"}, headers=admin_headers, timeout=10)
        assert r3.status_code == 200
        r3b = s.put(f"{API}/admin/team/no-such", json=body, headers=admin_headers, timeout=10)
        assert r3b.status_code == 404

        r4 = s.delete(f"{API}/admin/team/{tid}", headers=admin_headers, timeout=10)
        assert r4.status_code == 200
        r5 = s.delete(f"{API}/admin/team/{tid}", headers=admin_headers, timeout=10)
        assert r5.status_code == 404


# ---------- /admin/sessions ----------
class TestAdminSessions:
    def test_unauth_403(self, s, student_headers):
        assert s.get(f"{API}/admin/sessions", timeout=10).status_code == 401
        assert s.get(f"{API}/admin/sessions", headers=student_headers, timeout=10).status_code == 403

    def test_sessions_crud_excludes_reminder_sent(self, s, admin_headers):
        body = {
            "title": "TEST_iter4 Live", "professor": "Prof T",
            "subject": "matematica", "description": "desc",
            "date": "2030-01-01T10:00:00+00:00", "duration_min": 60,
            "zoom_link": "https://zoom.us/j/test", "required_package": "premium",
            "spots_left": 20,
        }
        r = s.post(f"{API}/admin/sessions", json=body, headers=admin_headers, timeout=10)
        assert r.status_code == 200, r.text
        sid = r.json()["id"]
        # Created doc has reminder_sent=False
        assert r.json().get("reminder_sent") is False

        # PUT MUST NOT include reminder_sent (per SessionAdmin model)
        r2 = s.put(f"{API}/admin/sessions/{sid}", json={**body, "title": "TEST_iter4 Live v2"},
                   headers=admin_headers, timeout=10)
        assert r2.status_code == 200, r2.text

        r2b = s.put(f"{API}/admin/sessions/no-such", json=body, headers=admin_headers, timeout=10)
        assert r2b.status_code == 404

        r3 = s.delete(f"{API}/admin/sessions/{sid}", headers=admin_headers, timeout=10)
        assert r3.status_code == 200
        r4 = s.delete(f"{API}/admin/sessions/{sid}", headers=admin_headers, timeout=10)
        assert r4.status_code == 404


# ---------- exhaustive 401/403 sweep ----------
class TestAdminAuthGating:
    ADMIN_GET = [
        "/admin/stats", "/admin/questions", "/admin/packages", "/admin/team", "/admin/sessions",
    ]

    @pytest.mark.parametrize("path", ADMIN_GET)
    def test_unauth_401(self, s, path):
        assert s.get(f"{API}{path}", timeout=10).status_code == 401

    @pytest.mark.parametrize("path", ADMIN_GET)
    def test_student_403(self, s, student_headers, path):
        assert s.get(f"{API}{path}", headers=student_headers, timeout=10).status_code == 403


# ---------- Regression: existing flows still work ----------
class TestRegression:
    def test_root(self, s):
        assert s.get(f"{API}/", timeout=10).status_code == 200

    def test_public_team(self, s):
        r = s.get(f"{API}/team", timeout=10)
        assert r.status_code == 200 and isinstance(r.json(), list)

    def test_leaderboard(self, s):
        r = s.get(f"{API}/leaderboard", timeout=10)
        assert r.status_code == 200 and isinstance(r.json(), list)

    def test_questions_public_strips_correct(self, s):
        r = s.get(f"{API}/questions/romana?initial=true&limit=5", timeout=10)
        assert r.status_code == 200
        for q in r.json():
            assert "correct" not in q

    def test_categories(self, s):
        r = s.get(f"{API}/categories/matematica", timeout=10)
        assert r.status_code == 200 and isinstance(r.json(), list)

    def test_me_with_student(self, s, student_headers):
        r = s.get(f"{API}/auth/me", headers=student_headers, timeout=10)
        assert r.status_code == 200
        assert r.json()["role"] == "student"

    def test_dashboard_me(self, s, student_headers):
        r = s.get(f"{API}/dashboard/me", headers=student_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ["user", "history", "has_initial_eval", "upcoming_sessions"]:
            assert k in d
