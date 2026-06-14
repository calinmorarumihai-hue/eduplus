from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import jwt
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import stripe
from openai import AsyncOpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Inițializăm clienții standard folosind cheile din .env
openai_client = AsyncOpenAI(api_key=os.getenv("EMERGENT_LLM_KEY"))
stripe.api_key = os.getenv("STRIPE_API_KEY")

from seed_data import ROMANA_QUESTIONS, MATEMATICA_QUESTIONS, get_live_sessions_seed
from email_service import send_email, render_parent_link_notify
from scheduler import start_scheduler
import secrets
import string

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24 * 7

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# ============= MODELS =============
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    grade: Optional[str] = "Clasa a VIII-a"
    role: Optional[str] = "student"  # "student" or "parent"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ParentLinkRequest(BaseModel):
    code: str


class QuestionAdmin(BaseModel):
    subject: str  # romana | matematica
    category: str
    question: str
    options: List[str]
    correct: int
    is_initial: bool = False


class PackageAdmin(BaseModel):
    id: str
    name: str
    price: float
    currency: str = "ron"
    description: str
    features: List[str]
    popular: bool = False


class TeamAdmin(BaseModel):
    name: str
    subject: str
    bio: str
    fun_fact: str
    image: str


class SessionAdmin(BaseModel):
    title: str
    professor: str
    subject: str
    description: str
    date: str  # ISO
    duration_min: int = 60
    zoom_link: str
    required_package: str = "premium"  # premium | standard | none
    spots_left: int = 20


class UserPublic(BaseModel):
    id: str
    email: str
    full_name: str
    grade: str
    score_romana: int = 0
    score_matematica: int = 0
    total_tests: int = 0
    points: int = 0
    created_at: str


class TestAnswer(BaseModel):
    question_id: str
    selected: int


class TestSubmit(BaseModel):
    subject: str  # "romana" or "matematica"
    is_initial: bool = False
    is_simulation: bool = False
    category: Optional[str] = None
    answers: List[TestAnswer]


class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str


class SessionRegister(BaseModel):
    session_id: str


# ============= AUTH HELPERS =============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_jwt(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict[str, Any]:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["user_id"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_admin_user(user: Dict = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acces doar pentru admin")
    return user


def user_public(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "grade": user.get("grade", "Clasa a VIII-a"),
        "role": user.get("role", "student"),
        "score_romana": user.get("score_romana", 0),
        "score_matematica": user.get("score_matematica", 0),
        "total_tests": user.get("total_tests", 0),
        "points": user.get("points", 0),
        "current_streak": user.get("current_streak", 0),
        "longest_streak": user.get("longest_streak", 0),
        "medals": user.get("medals", 0),
        "weekly_points": user.get("weekly_points", 0),
        "purchased_packages": user.get("purchased_packages", []),
        "children": user.get("children", []),
        "parents": user.get("parents", []),
        "parent_code": user.get("parent_code"),
        "created_at": user.get("created_at", ""),
    }


# ============= AUTH ROUTES =============
@api_router.post("/auth/register")
async def register(payload: UserRegister):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email deja inregistrat")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "grade": payload.grade or "Clasa a VIII-a",
        "role": payload.role if payload.role in ("student", "parent") else "student",
        "score_romana": 0,
        "score_matematica": 0,
        "total_tests": 0,
        "points": 0,
        "weekly_points": 0,
        "current_streak": 0,
        "longest_streak": 0,
        "medals": 0,
        "last_test_date": None,
        "has_initial_eval": False,
        "ai_plan": None,
        "purchased_packages": [],
        "registered_sessions": [],
        "children": [],
        "parents": [],
        "parent_code": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_jwt(user_id)
    return {"token": token, "user": user_public(user_doc)}


@api_router.post("/auth/login")
async def login(payload: UserLogin):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă")
    token = create_jwt(user["id"])
    return {"token": token, "user": user_public(user)}


@api_router.get("/auth/me")
async def me(user: Dict = Depends(get_current_user)):
    return user_public(user)


# ============= QUESTIONS =============
@api_router.get("/questions/{subject}")
async def get_questions(subject: str, initial: bool = False, category: Optional[str] = None, limit: int = 100):
    filter_ = {"subject": subject}
    if initial:
        filter_["is_initial"] = True
    if category:
        filter_["category"] = category
    questions = await db.questions.find(filter_, {"_id": 0, "correct": 0}).to_list(limit)
    return questions


@api_router.get("/categories/{subject}")
async def get_categories(subject: str):
    cats = await db.questions.distinct("category", {"subject": subject})
    out = []
    for c in cats:
        if not c:
            continue
        count = await db.questions.count_documents({"subject": subject, "category": c})
        out.append({"category": c, "count": count})
    return sorted(out, key=lambda x: x["category"])


@api_router.get("/exam/{subject}")
async def get_exam(subject: str, limit: int = 25):
    pipeline = [
        {"$match": {"subject": subject}},
        {"$sample": {"size": limit}},
        {"$project": {"_id": 0, "correct": 0}},
    ]
    questions = await db.questions.aggregate(pipeline).to_list(limit)
    return questions


@api_router.post("/test/submit")
async def submit_test(payload: TestSubmit, user: Dict = Depends(get_current_user)):
    correct = 0
    total = len(payload.answers)
    for ans in payload.answers:
        q = await db.questions.find_one({"id": ans.question_id})
        if q and q.get("correct") == ans.selected:
            correct += 1
    score = round((correct / total) * 100) if total > 0 else 0
    multiplier = 2 if payload.is_simulation else 1
    points_earned = correct * 10 * multiplier

    attempt = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "subject": payload.subject,
        "category": payload.category,
        "is_initial": payload.is_initial,
        "is_simulation": payload.is_simulation,
        "score": score,
        "correct": correct,
        "total": total,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.test_attempts.insert_one(attempt)

    # Streak logic
    today = datetime.now(timezone.utc).date()
    user_full = await db.users.find_one({"id": user["id"]})
    last_date_str = user_full.get("last_test_date")
    current_streak = user_full.get("current_streak", 0)
    longest_streak = user_full.get("longest_streak", 0)

    if last_date_str:
        last_date = datetime.fromisoformat(last_date_str).date()
        if last_date == today:
            pass  # streak stays
        elif (today - last_date).days == 1:
            current_streak += 1
        else:
            current_streak = 1
    else:
        current_streak = 1
    longest_streak = max(longest_streak, current_streak)

    # Medals: 1 medal per 5 tests completed
    new_total_tests = user_full.get("total_tests", 0) + 1
    medals = new_total_tests // 5

    update = {
        "$inc": {"total_tests": 1, "points": points_earned, "weekly_points": points_earned},
        "$set": {
            f"score_{payload.subject}": score,
            "last_test_date": today.isoformat(),
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "medals": medals,
        },
    }
    if payload.is_initial:
        update["$set"]["has_initial_eval"] = True
    await db.users.update_one({"id": user["id"]}, update)

    return {
        "score": score,
        "correct": correct,
        "total": total,
        "points_earned": points_earned,
        "current_streak": current_streak,
        "medals": medals,
    }


@api_router.post("/ai/study-plan")
async def generate_study_plan(user: Dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user["id"]})
    if not user_doc.get("has_initial_eval"):
        raise HTTPException(
            status_code=400,
            detail="Completează mai întâi evaluarea inițială",
        )

    score_r = user_doc.get("score_romana", 0)
    score_m = user_doc.get("score_matematica", 0)

    prompt = f"""Ești un profesor expert care pregătește elevi pentru Evaluarea Națională (clasa a VIII-a) din România.
Elevul a obținut următoarele scoruri la evaluarea inițială:
- Limba și literatura română: {score_r}/100
- Matematică: {score_m}/100

Creează un plan personalizat de studiu pentru elev. Răspunde DOAR în limba română, structurat astfel:
1. Diagnostic scurt (2-3 propoziții despre nivelul actual)
2. Obiective săptămânale pentru Română (3 obiective concrete)
3. Obiective săptămânale pentru Matematică (3 obiective concrete)
4. Recomandări de studiu (3-5 sfaturi practice)
5. Motivație finală (1-2 propoziții încurajatoare)

Folosește un ton prietenos, încurajator, potrivit pentru un elev de clasa a VIII-a. Răspunsul să fie maxim 350 de cuvinte."""

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Ești un mentor educațional pentru elevii români."},
                {"role": "user", "content": prompt}
            ]
        )
        plan_text = response.choices[0].message.content
    except Exception as e:
        logger.error(f"AI error: {e}")
        raise HTTPException(status_code=500, detail="Eroare la generarea planului AI")

    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"ai_plan": plan_text, "ai_plan_generated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"plan": plan_text}


@api_router.get("/dashboard/me")
async def dashboard(user: Dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    attempts = await db.test_attempts.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    sessions = await db.live_sessions.find({}, {"_id": 0}).sort("date", 1).limit(3).to_list(3)
    has_premium = "premium" in user_doc.get("purchased_packages", [])
    registered = set(user_doc.get("registered_sessions", []))
    for s in sessions:
        s["can_attend"] = has_premium or s.get("required_package") != "premium"
        s["is_registered"] = s["id"] in registered
    return {
        "user": user_public(user_doc),
        "ai_plan": user_doc.get("ai_plan"),
        "history": attempts,
        "has_initial_eval": user_doc.get("has_initial_eval", False),
        "upcoming_sessions": sessions,
    }


# ============= LEADERBOARD =============
@api_router.get("/leaderboard")
async def leaderboard():
    users = await db.users.find(
        {},
        {
            "_id": 0,
            "id": 1,
            "full_name": 1,
            "points": 1,
            "score_romana": 1,
            "score_matematica": 1,
            "total_tests": 1,
            "current_streak": 1,
            "longest_streak": 1,
            "medals": 1,
            "weekly_points": 1,
        },
    ).sort("points", -1).limit(50).to_list(50)
    return users


@api_router.get("/leaderboard/weekly")
async def weekly_leaderboard():
    users = await db.users.find(
        {"weekly_points": {"$gt": 0}},
        {"_id": 0, "id": 1, "full_name": 1, "weekly_points": 1, "current_streak": 1, "medals": 1},
    ).sort("weekly_points", -1).limit(20).to_list(20)
    return users


# ============= LIVE SESSIONS =============
@api_router.get("/live-sessions")
async def list_live_sessions(user: Dict = Depends(get_current_user)):
    sessions = await db.live_sessions.find({}, {"_id": 0}).sort("date", 1).to_list(50)
    has_premium = "premium" in user.get("purchased_packages", [])
    registered = set(user.get("registered_sessions", []))
    for s in sessions:
        s["can_attend"] = has_premium or s.get("required_package") != "premium"
        s["is_registered"] = s["id"] in registered
    return sessions


@api_router.post("/live-sessions/register")
async def register_session(payload: SessionRegister, user: Dict = Depends(get_current_user)):
    session = await db.live_sessions.find_one({"id": payload.session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Sesiune inexistentă")
    if session.get("required_package") == "premium" and "premium" not in user.get("purchased_packages", []):
        raise HTTPException(status_code=403, detail="Sesiunea necesită pachetul Premium")
    await db.users.update_one(
        {"id": user["id"]},
        {"$addToSet": {"registered_sessions": payload.session_id}},
    )
    return {"ok": True, "session": session}


# ============= TEAM =============
@api_router.get("/team")
async def get_team():
    team = await db.team.find({}, {"_id": 0}).to_list(50)
    return team


# ============= PACKAGES =============
DEFAULT_PACKAGES = [
    {
        "id": "starter",
        "name": "Starter",
        "price": 49.0,
        "currency": "ron",
        "description": "Incepe pregătirea cu pași mici",
        "features": [
            "Evaluare inițială gratuită",
            "20 de teste de antrenament/lună",
            "Acces la leaderboard",
            "Suport prin email",
        ],
        "popular": False,
    },
    {
        "id": "standard",
        "name": "Standard",
        "price": 99.0,
        "currency": "ron",
        "description": "Cel mai popular pentru elevii motivați",
        "features": [
            "Evaluare inițială + 3 evaluări recapitulative",
            "Teste nelimitate Română și Matematică",
            "Strategie AI personalizată săptămânal",
            "Acces la leaderboard premium",
            "Suport prioritar",
        ],
        "popular": True,
    },
    {
        "id": "premium",
        "name": "Premium",
        "price": 199.0,
        "currency": "ron",
        "description": "Pregătire completă, fără compromisuri",
        "features": [
            "Toate beneficiile pachetului Standard",
            "Sesiuni live cu profesori (4/lună)",
            "Plan AI ultra-personalizat zilnic",
            "Materiale exclusive și simulări",
            "Garanție: progres vizibil in 30 zile",
        ],
        "popular": False,
    },
]


@api_router.get("/packages")
async def list_packages():
    pkgs = await db.packages.find({}, {"_id": 0}).to_list(50)
    pkgs.sort(key=lambda p: p.get("price", 0))
    return pkgs


@api_router.post("/payments/checkout")
async def create_checkout(
    payload: CheckoutRequest,
    http_request: Request,
    user: Dict = Depends(get_current_user),
):
    pkg = await db.packages.find_one({"id": payload.package_id}, {"_id": 0})
    if not pkg:
        raise HTTPException(status_code=400, detail="Pachet invalid")

    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pachete"

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': pkg.get("currency", "ron"),
                    'product_data': {
                        'name': pkg["name"],
                        'description': pkg.get("description", ""),
                    },
                    'unit_amount': int(pkg["price"] * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user["id"],
                "user_email": user["email"],
                "package_id": pkg["id"],
            },
        )
    except Exception as e:
        logger.error(f"Stripe session creation error: {e}")
        raise HTTPException(status_code=500, detail="Eroare la inițierea sesiunii de plată")

    await db.payment_transactions.insert_one(
        {
            "id": str(uuid.uuid4()),
            "session_id": session.id,
            "user_id": user["id"],
            "user_email": user["email"],
            "package_id": pkg["id"],
            "amount": pkg["price"],
            "currency": pkg["currency"],
            "payment_status": "pending",
            "status": "initiated",
            "metadata": {
                "user_id": user["id"],
                "user_email": user["email"],
                "package_id": pkg["id"],
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return {"url": session.url, "session_id": session.id}


@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str, http_request: Request):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Tranzacție inexistentă")

    if tx.get("payment_status") == "paid":
        return {"payment_status": "paid", "status": tx["status"], "package_id": tx["package_id"]}

    try:
        session = stripe.checkout.Session.retrieve(session_id)
        payment_status = session.payment_status
        status_val = session.status
    except Exception as e:
        logger.error(f"Stripe retrieve error: {e}")
        raise HTTPException(status_code=400, detail="Eroare la verificarea plății cu Stripe")

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": payment_status, "status": status_val}},
    )

    if payment_status == "paid" and tx.get("payment_status") != "paid":
        await db.users.update_one(
            {"id": tx["user_id"]},
            {"$addToSet": {"purchased_packages": tx["package_id"]}},
        )

    return {
        "payment_status": payment_status,
        "status": status_val,
        "package_id": tx["package_id"],
    }


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    
    try:
        if endpoint_secret:
            event = stripe.Webhook.construct_event(body, sig, endpoint_secret)
        else:
            import json
            event = json.loads(body)
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook invalid")

    event_type = event.get("type") if isinstance(event, dict) else event.type
    event_data = event.get("data") if isinstance(event, dict) else event.data

    if event_type == "checkout.session.completed":
        session = event_data.get("object") if isinstance(event_data, dict) else event_data.object
        session_id = session.get("id") if isinstance(session, dict) else session.id
        payment_status = session.get("payment_status") if isinstance(session, dict) else session.payment_status
        
        if session_id:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": payment_status, "status": "completed"}},
            )
            if payment_status == "paid":
                tx = await db.payment_transactions.find_one({"session_id": session_id})
                if tx:
                    await db.users.update_one(
                        {"id": tx["user_id"]},
                        {"$addToSet": {"purchased_packages": tx["package_id"]}},
                    )
    return {"received": True}


# ============= PARENT MODE =============
def gen_code(length: int = 6) -> str:
    return "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))


@api_router.post("/parent/generate-code")
async def generate_parent_code(user: Dict = Depends(get_current_user)):
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Doar elevii pot genera un cod")
    code = gen_code(6)
    await db.users.update_one({"id": user["id"]}, {"$set": {"parent_code": code}})
    return {"code": code}


@api_router.post("/parent/link")
async def parent_link(payload: ParentLinkRequest, user: Dict = Depends(get_current_user)):
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Doar părinții pot lega un cont copil")
    child = await db.users.find_one({"parent_code": payload.code.upper().strip(), "role": "student"})
    if not child:
        raise HTTPException(status_code=404, detail="Cod invalid sau expirat")
    if child["id"] in user.get("children", []):
        return {"already_linked": True, "child_id": child["id"]}
    await db.users.update_one({"id": user["id"]}, {"$addToSet": {"children": child["id"]}})
    await db.users.update_one(
        {"id": child["id"]},
        {"$addToSet": {"parents": user["id"]}, "$set": {"parent_code": None}},
    )
    subject, html, text = render_parent_link_notify(child["full_name"], user["full_name"])
    send_email(child["email"], subject, html, text)
    return {"ok": True, "child_id": child["id"], "child_name": child["full_name"]}


def _child_summary(child: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": child["id"],
        "full_name": child["full_name"],
        "email": child["email"],
        "grade": child.get("grade"),
        "score_romana": child.get("score_romana", 0),
        "score_matematica": child.get("score_matematica", 0),
        "points": child.get("points", 0),
        "weekly_points": child.get("weekly_points", 0),
        "total_tests": child.get("total_tests", 0),
        "current_streak": child.get("current_streak", 0),
        "longest_streak": child.get("longest_streak", 0),
        "medals": child.get("medals", 0),
        "has_initial_eval": child.get("has_initial_eval", False),
        "ai_plan": child.get("ai_plan"),
    }


@api_router.get("/parent/children")
async def list_children(user: Dict = Depends(get_current_user)):
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Acces doar pentru părinți")
    ids = user.get("children", [])
    if not ids:
        return []
    children = await db.users.find({"id": {"$in": ids}}, {"_id": 0, "password_hash": 0}).to_list(50)
    return [_child_summary(c) for c in children]


@api_router.get("/parent/child/{child_id}")
async def get_child(child_id: str, user: Dict = Depends(get_current_user)):
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Acces doar pentru părinți")
    if child_id not in user.get("children", []):
        raise HTTPException(status_code=403, detail="Nu ai acces la acest copil")
    child = await db.users.find_one({"id": child_id}, {"_id": 0, "password_hash": 0})
    if not child:
        raise HTTPException(status_code=404, detail="Copil inexistent")
    attempts = await db.test_attempts.find({"user_id": child_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"child": _child_summary(child), "history": attempts}


@api_router.post("/parent/unlink/{child_id}")
async def unlink_child(child_id: str, user: Dict = Depends(get_current_user)):
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Acces doar pentru părinți")
    await db.users.update_one({"id": user["id"]}, {"$pull": {"children": child_id}})
    await db.users.update_one({"id": child_id}, {"$pull": {"parents": user["id"]}})
    return {"ok": True}


# ============= ADMIN ENDPOINTS =============
@api_router.get("/admin/questions")
async def admin_list_questions(admin: Dict = Depends(get_admin_user), subject: Optional[str] = None):
    f = {}
    if subject:
        f["subject"] = subject
    qs = await db.questions.find(f, {"_id": 0}).sort([("subject", 1), ("category", 1)]).to_list(2000)
    return qs


@api_router.post("/admin/questions")
async def admin_create_question(payload: QuestionAdmin, admin: Dict = Depends(get_admin_user)):
    doc = {"id": str(uuid.uuid4()), **payload.model_dump()}
    await db.questions.insert_one(doc)
    return {**doc, "_id": None}


@api_router.put("/admin/questions/{qid}")
async def admin_update_question(qid: str, payload: QuestionAdmin, admin: Dict = Depends(get_admin_user)):
    res = await db.questions.update_one({"id": qid}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Intrebare inexistentă")
    return {"ok": True}


@api_router.delete("/admin/questions/{qid}")
async def admin_delete_question(qid: str, admin: Dict = Depends(get_admin_user)):
    res = await db.questions.delete_one({"id": qid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Intrebare inexistentă")
    return {"ok": True}


@api_router.get("/admin/packages")
async def admin_list_packages(admin: Dict = Depends(get_admin_user)):
    pkgs = await db.packages.find({}, {"_id": 0}).to_list(50)
    return pkgs


@api_router.post("/admin/packages")
async def admin_create_package(payload: PackageAdmin, admin: Dict = Depends(get_admin_user)):
    existing = await db.packages.find_one({"id": payload.id})
    if existing:
        raise HTTPException(status_code=400, detail="ID pachet deja folosit")
    doc = payload.model_dump()
    await db.packages.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/packages/{pkg_id}")
async def admin_update_package(pkg_id: str, payload: PackageAdmin, admin: Dict = Depends(get_admin_user)):
    res = await db.packages.update_one({"id": pkg_id}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pachet inexistent")
    return {"ok": True}


@api_router.delete("/admin/packages/{pkg_id}")
async def admin_delete_package(pkg_id: str, admin: Dict = Depends(get_admin_user)):
    res = await db.packages.delete_one({"id": pkg_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pachet inexistent")
    return {"ok": True}


@api_router.get("/admin/team")
async def admin_list_team(admin: Dict = Depends(get_admin_user)):
    return await db.team.find({}, {"_id": 0}).to_list(100)


@api_router.post("/admin/team")
async def admin_create_team(payload: TeamAdmin, admin: Dict = Depends(get_admin_user)):
    doc = {"id": str(uuid.uuid4()), **payload.model_dump()}
    await db.team.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/team/{tid}")
async def admin_update_team(tid: str, payload: TeamAdmin, admin: Dict = Depends(get_admin_user)):
    res = await db.team.update_one({"id": tid}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Membru inexistent")
    return {"ok": True}


@api_router.delete("/admin/team/{tid}")
async def admin_delete_team(tid: str, admin: Dict = Depends(get_admin_user)):
    res = await db.team.delete_one({"id": tid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Membru inexistent")
    return {"ok": True}


@api_router.get("/admin/sessions")
async def admin_list_sessions(admin: Dict = Depends(get_admin_user)):
    return await db.live_sessions.find({}, {"_id": 0}).sort("date", 1).to_list(200)


@api_router.post("/admin/sessions")
async def admin_create_session(payload: SessionAdmin, admin: Dict = Depends(get_admin_user)):
    doc = {"id": str(uuid.uuid4()), "reminder_sent": False, **payload.model_dump()}
    await db.live_sessions.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/sessions/{sid}")
async def admin_update_session(sid: str, payload: SessionAdmin, admin: Dict = Depends(get_admin_user)):
    res = await db.live_sessions.update_one({"id": sid}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sesiune inexistentă")
    return {"ok": True}


@api_router.delete("/admin/sessions/{sid}")
async def admin_delete_session(sid: str, admin: Dict = Depends(get_admin_user)):
    res = await db.live_sessions.delete_one({"id": sid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sesiune inexistentă")
    return {"ok": True}


@api_router.get("/admin/stats")
async def admin_stats(admin: Dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({"role": "student"})
    total_parents = await db.users.count_documents({"role": "parent"})
    total_tests = await db.test_attempts.count_documents({})
    total_questions = await db.questions.count_documents({})
    paid_tx = await db.payment_transactions.count_documents({"payment_status": "paid"})
    
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    revenue = 0.0
    async for d in db.payment_transactions.aggregate(pipeline):
        revenue = d["total"]

    pipeline_avg_ro = [{"$match": {"role": "student", "score_romana": {"$gt": 0}}}, {"$group": {"_id": None, "avg": {"$avg": "$score_romana"}}}]
    pipeline_avg_mat = [{"$match": {"role": "student", "score_matematica": {"$gt": 0}}}, {"$group": {"_id": None, "avg": {"$avg": "$score_matematica"}}}]
    avg_ro = 0
    async for d in db.users.aggregate(pipeline_avg_ro):
        avg_ro = round(d["avg"] or 0, 1)
    avg_mat = 0
    async for d in db.users.aggregate(pipeline_avg_mat):
        avg_mat = round(d["avg"] or 0, 1)

    top_users = await db.users.find(
        {"role": "student"}, {"_id": 0, "id": 1, "full_name": 1, "points": 1, "email": 1}
    ).sort("points", -1).limit(5).to_list(5)

    return {
        "total_students": total_users,
        "total_parents": total_parents,
        "total_tests_taken": total_tests,
        "total_questions": total_questions,
        "paid_transactions": paid_tx,
        "revenue_ron": round(revenue, 2),
        "avg_score_romana": avg_ro,
        "avg_score_matematica": avg_mat,
        "top_users": top_users,
    }


# ============= SEED DATA =============
@app.on_event("startup")
async def seed_data():
    if await db.team.count_documents({}) == 0:
        team = [
            {
                "id": str(uuid.uuid4()),
                "name": "Prof. Ioana Marinescu",
                "subject": "Limba și literatura română",
                "bio": "12 ani experiență, autoare manuale auxiliare. Pasionată de poezia interbelică.",
                "fun_fact": "Citește 2 cărți pe săptămână.",
                "image": "https://images.pexels.com/photos/8423069/pexels-photo-8423069.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Prof. Andrei Popescu",
                "subject": "Matematică",
                "bio": "15 ani la catedră, mentor olimpici. Demistifică geometria pentru oricine.",
                "fun_fact": "Rezolvă cuburi Rubik in sub 1 minut.",
                "image": "https://images.pexels.com/photos/5553633/pexels-photo-5553633.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Prof. Elena Dumitrescu",
                "subject": "Limba și literatura română",
                "bio": "Profesor gradul I, specializată in comunicare și redactare.",
                "fun_fact": "Scrie un blog literar de 5 ani.",
                "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=80",
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Prof. Mihai Ionescu",
                "subject": "Matematică",
                "bio": "Pasionat de algebră și probleme de combinatorică. Predă cu drag de 10 ani.",
                "fun_fact": "Maratonist amator in timpul liber.",
                "image": "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=900&q=80",
            },
        ]
        await db.team.insert_many(team)

    uncategorized = await db.questions.count_documents({"category": {"$exists": False}})
    total_q = await db.questions.count_documents({})
    if uncategorized > 0 or total_q < 100:
        await db.questions.delete_many({})
        all_q = []
        for q in ROMANA_QUESTIONS:
            all_q.append({
                "id": str(uuid.uuid4()),
                "subject": "romana",
                "is_initial": q.get("is_initial", False),
                "category": q["category"],
                "question": q["question"],
                "options": q["options"],
                "correct": q["correct"],
            })
        for q in MATEMATICA_QUESTIONS:
            all_q.append({
                "id": str(uuid.uuid4()),
                "subject": "matematica",
                "is_initial": q.get("is_initial", False),
                "category": q["category"],
                "question": q["question"],
                "options": q["options"],
                "correct": q["correct"],
            })
        await db.questions.insert_many(all_q)
        logger.info(f"Seeded {len(all_q)} questions ({len(ROMANA_QUESTIONS)} RO + {len(MATEMATICA_QUESTIONS)} MAT)")

    if await db.live_sessions.count_documents({}) == 0:
        sessions = get_live_sessions_seed()
        for s in sessions:
            s["id"] = str(uuid.uuid4())
        await db.live_sessions.insert_many(sessions)
        logger.info(f"Seeded {len(sessions)} live sessions")

    if await db.packages.count_documents({}) == 0:
        await db.packages.insert_many([{**p} for p in DEFAULT_PACKAGES])
        logger.info(f"Seeded {len(DEFAULT_PACKAGES)} packages")

    admin_email = "calinmorarumihai@gmail.com"
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password("EduPlus@Admin2026!"),
            "full_name": "Călin Morariu Mihai",
            "grade": "Admin",
            "role": "admin",
            "score_romana": 0,
            "score_matematica": 0,
            "total_tests": 0,
            "points": 0,
            "weekly_points": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "medals": 0,
            "last_test_date": None,
            "has_initial_eval": False,
            "ai_plan": None,
            "purchased_packages": [],
            "registered_sessions": [],
            "children": [],
            "parents": [],
            "parent_code": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin user: {admin_email}")

    await db.users.update_many(
        {"current_streak": {"$exists": False}},
        {"$set": {
            "current_streak": 0,
            "longest_streak": 0,
            "medals": 0,
            "weekly_points": 0,
            "last_test_date": None,
            "registered_sessions": [],
        }},
    )
    await db.users.update_many(
        {"role": {"$exists": False}},
        {"$set": {"role": "student", "children": [], "parents": [], "parent_code": None}},
    )

    if not hasattr(app.state, "scheduler") or app.state.scheduler is None:
        app.state.scheduler = start_scheduler(db)

    logger.info("Seed data ready")


@api_router.get("/")
async def root():
    return {"message": "Edu Plus API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    if hasattr(app.state, "scheduler") and app.state.scheduler is not None:
        app.state.scheduler.shutdown(wait=False)
    client.close()
