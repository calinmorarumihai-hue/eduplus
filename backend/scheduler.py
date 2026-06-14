"""Background scheduler for Edu Plus.
- Weekly reset of weekly_points every Monday 00:00 Europe/Bucharest.
- Live session email reminders ~1h before start (check every 5 min)."""
import logging
import os
from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
import pytz
from motor.motor_asyncio import AsyncIOMotorDatabase

from email_service import send_email, render_session_reminder

logger = logging.getLogger(__name__)

BUCHAREST_TZ = pytz.timezone("Europe/Bucharest")


async def reset_weekly_points(db: AsyncIOMotorDatabase):
    """Reset weekly_points for all users. Runs Monday 00:00 Europe/Bucharest."""
    result = await db.users.update_many({}, {"$set": {"weekly_points": 0}})
    logger.info(f"⏰ [CRON] Weekly points reset for {result.modified_count} users")


async def send_session_reminders(db: AsyncIOMotorDatabase):
    """Find live sessions starting in 55-65 min, email registered users."""
    now = datetime.now(timezone.utc)
    window_start = now + timedelta(minutes=55)
    window_end = now + timedelta(minutes=65)
    window_start_iso = window_start.isoformat()
    window_end_iso = window_end.isoformat()

    sessions = await db.live_sessions.find(
        {"date": {"$gte": window_start_iso, "$lte": window_end_iso}}, {"_id": 0}
    ).to_list(100)

    for s in sessions:
        # Skip if already notified
        if s.get("reminder_sent"):
            continue
        users = await db.users.find(
            {"registered_sessions": s["id"]}, {"_id": 0, "email": 1, "full_name": 1}
        ).to_list(500)
        for u in users:
            subject, html, text = render_session_reminder(u["full_name"], s)
            send_email(u["email"], subject, html, text)
        await db.live_sessions.update_one({"id": s["id"]}, {"$set": {"reminder_sent": True}})
        if users:
            logger.info(f"⏰ Sent {len(users)} reminders for session {s['title']}")


def start_scheduler(db: AsyncIOMotorDatabase) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone=BUCHAREST_TZ)
    # Weekly reset: Mondays at 00:00 Bucharest time
    scheduler.add_job(
        reset_weekly_points,
        CronTrigger(day_of_week="mon", hour=0, minute=0, timezone=BUCHAREST_TZ),
        args=[db],
        id="weekly_reset",
        replace_existing=True,
    )
    # Session reminders: every 5 minutes
    scheduler.add_job(
        send_session_reminders,
        IntervalTrigger(minutes=5),
        args=[db],
        id="session_reminders",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("✅ Background scheduler started (weekly reset Mon 00:00 Bucharest, reminders every 5min)")
    return scheduler
