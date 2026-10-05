from __future__ import annotations

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger("vertaix.email")


def send_password_reset_email(email: str, token: str) -> bool:
    """
    Sends a password reset email to the given recipient.
    If SMTP server configuration is missing, logs link for development.
    """
    frontend_base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
    reset_url = f"{frontend_base_url}/reset-password?token={token}"

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    email_from = os.getenv("EMAIL_FROM", "noreply@vertaix.local")

    subject = "VertAIx - Password Reset Request"
    text_content = (
        f"Hello,\n\n"
        f"A password reset request was submitted for your VertAIx account.\n\n"
        f"To reset your password, visit the following link (valid for 1 hour):\n"
        f"{reset_url}\n\n"
        f"If you did not request this, you can safely ignore this email.\n\n"
        f"VertAIx Posture Monitoring Team"
    )

    if not smtp_host:
        logger.info("[DEV EMAIL] Password reset requested for %s: %s", email, reset_url)
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = email_from
        msg["To"] = email
        msg.attach(MIMEText(text_content, "plain"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.sendmail(email_from, [email], msg.as_string())
        logger.info("Password reset email successfully dispatched to %s", email)
        return True
    except Exception as exc:
        logger.error("Failed to deliver reset email to %s: %s", email, exc)
        return False
