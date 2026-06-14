"""Mock email service for Edu Plus. Logs emails to console.
Replace `send_email` body with a real provider (Resend, SendGrid) when ready."""
import logging

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body_html: str, body_text: str = "") -> bool:
    """Mock email sender. Logs payload, returns True."""
    logger.info("=" * 60)
    logger.info("📧 [MOCK EMAIL]")
    logger.info(f"  To: {to}")
    logger.info(f"  Subject: {subject}")
    logger.info(f"  Body (text): {body_text[:200]}")
    logger.info("=" * 60)
    return True


def render_session_reminder(user_name: str, session: dict) -> tuple[str, str, str]:
    """Returns (subject, html, text) for live session reminder."""
    subject = f"⏰ Sesiunea „{session['title']}” începe într-o oră!"
    text = (
        f"Salut, {user_name}!\n\n"
        f"Îți reamintim că sesiunea ta live începe într-o oră.\n\n"
        f"Titlu: {session['title']}\n"
        f"Profesor: {session['professor']}\n"
        f"Durată: {session['duration_min']} min\n"
        f"Link Zoom: {session['zoom_link']}\n\n"
        f"Ne vedem acolo! 🌊\n— Echipa Edu Plus"
    )
    html = f"""
    <div style="font-family:DM Sans,sans-serif;max-width:600px;margin:auto;background:#f8fafc;padding:32px;border-radius:24px">
      <h1 style="font-family:Outfit,sans-serif;color:#1e40af">Sesiunea ta începe în 1 oră! 🌊</h1>
      <p>Salut, <strong>{user_name}</strong>!</p>
      <p>Sesiunea live <strong>„{session['title']}”</strong> cu <strong>{session['professor']}</strong> începe într-o oră.</p>
      <p>Durată: {session['duration_min']} minute</p>
      <a href="{session['zoom_link']}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">Deschide Zoom</a>
      <p style="margin-top:24px;color:#64748b;font-size:14px">— Echipa Edu Plus</p>
    </div>
    """
    return subject, html, text


def render_parent_link_notify(child_name: str, parent_name: str) -> tuple[str, str, str]:
    subject = "Părinte conectat la contul tău Edu Plus"
    text = (
        f"Salut, {child_name}!\n\n"
        f"{parent_name} a fost conectat ca părinte la contul tău. "
        f"Părintele tău poate vedea progresul tău la teste și scorurile.\n\n"
        f"Dacă nu recunoști persoana, contactează-ne imediat.\n"
        f"— Echipa Edu Plus"
    )
    html = f"<div style='font-family:DM Sans,sans-serif'><h2>Părinte conectat</h2><p>Salut, {child_name}! <strong>{parent_name}</strong> are acum acces la progresul tău.</p></div>"
    return subject, html, text
