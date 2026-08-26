"""
Email utility module for sending emails via SMTP
Retrieves SMTP settings from admin_settings collection in database
"""
import smtplib
import ssl
import asyncio
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

_db = None

def set_database(database):
    global _db
    _db = database

async def get_smtp_settings():
    """Get SMTP settings from database"""
    if _db is None:
        return None
    
    settings = await _db.admin_settings.find_one({"type": "smtp"})
    if not settings:
        return None
    
    return {
        "host": settings.get("smtp_host", ""),
        "port": settings.get("smtp_port", 587),
        "username": settings.get("smtp_username", ""),
        "password": settings.get("smtp_password", ""),
        "from_email": settings.get("from_email", ""),
        "from_name": settings.get("from_name", "123Bots"),
        "use_tls": settings.get("use_tls", True),
    }

def send_email_sync(smtp_settings: dict, to_email: str, subject: str, html_content: str, text_content: str = None):
    """Synchronous email sending function"""
    if not smtp_settings or not smtp_settings.get("host"):
        raise Exception("SMTP not configured")
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{smtp_settings['from_name']} <{smtp_settings['from_email']}>"
    msg["To"] = to_email
    
    # Add plain text version
    if text_content:
        part1 = MIMEText(text_content, "plain")
        msg.attach(part1)
    
    # Add HTML version
    part2 = MIMEText(html_content, "html")
    msg.attach(part2)
    
    # Send the email
    context = ssl.create_default_context()
    
    try:
        if smtp_settings.get("use_tls", True):
            with smtplib.SMTP(smtp_settings["host"], smtp_settings["port"]) as server:
                server.starttls(context=context)
                if smtp_settings.get("username") or smtp_settings.get("password"):
                    server.login(smtp_settings["username"], smtp_settings["password"])
                server.sendmail(smtp_settings["from_email"], to_email, msg.as_string())
        else:
            with smtplib.SMTP(smtp_settings["host"], smtp_settings["port"]) as server:
                if smtp_settings.get("username") or smtp_settings.get("password"):
                    server.login(smtp_settings["username"], smtp_settings["password"])
                server.sendmail(smtp_settings["from_email"], to_email, msg.as_string())
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        raise

async def send_email(to_email: str, subject: str, html_content: str, text_content: str = None):
    """Async wrapper for sending email"""
    smtp_settings = await get_smtp_settings()
    if not smtp_settings or not smtp_settings.get("host"):
        logger.warning("SMTP not configured, email not sent")
        return False
    
    try:
        # Run sync email in thread pool
        await asyncio.to_thread(send_email_sync, smtp_settings, to_email, subject, html_content, text_content)
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False

async def send_verification_email(to_email: str, verification_code: str, user_name: str = ""):
    """Send email verification email"""
    subject = "Verify Your 123Bots Account"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">123Bots</h1>
                                <p style="color: #c4b5fd; margin: 10px 0 0 0; font-size: 14px;">Commercial Cleaning Robots</p>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email</h2>
                                <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Hi{' ' + user_name if user_name else ''},<br><br>
                                    Thank you for registering with 123Bots. To complete your registration and access product pricing, please enter the verification code below:
                                </p>
                                
                                <!-- Verification Code Box -->
                                <div style="background-color: #f1f5f9; border: 2px dashed #7c3aed; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                                    <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">Your Verification Code</p>
                                    <p style="color: #7c3aed; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: monospace;">{verification_code}</p>
                                </div>
                                
                                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                                    This code will expire in <strong>15 minutes</strong>.<br>
                                    If you didn't create an account, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                    FOR RESEARCH USE ONLY • NOT FOR HUMAN CONSUMPTION
                                </p>
                                <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">
                                    © 2026 123Bots. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    text_content = f"""
    123Bots - Verify Your Email
    
    Hi{' ' + user_name if user_name else ''},
    
    Thank you for registering with 123Bots. To complete your registration, please enter this verification code:
    
    {verification_code}
    
    This code will expire in 15 minutes.
    
    If you didn't create an account, you can safely ignore this email.
    
    FOR RESEARCH USE ONLY - NOT FOR HUMAN CONSUMPTION
    © 2026 123Bots
    """
    
    return await send_email(to_email, subject, html_content, text_content)


async def send_two_factor_email(to_email: str, verification_code: str, user_name: str = "", purpose: str = "login"):
    purpose_label = "sign in" if purpose == "login" else "enable two-step verification"
    subject = "Your 123Bots security code"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#fff7f0;color:#2c1810;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#fff7f0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #ffd9bf;box-shadow:0 10px 30px rgba(44,24,16,0.08);">
                        <tr>
                            <td style="padding:32px 36px;background:linear-gradient(135deg,#2c1810 0%,#5c2f12 55%,#ff8c42 100%);text-align:left;">
                                <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ffd9bf;">123Bots</p>
                                <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;">Your security code is ready</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:36px;">
                                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#5c3b2a;">Hi{' ' + user_name if user_name else ''}, use the code below to {purpose_label} for your 123Bots account.</p>
                                <div style="margin:28px 0;padding:24px;border-radius:16px;background:#fff2e8;border:2px dashed #ff8c42;text-align:center;">
                                    <p style="margin:0 0 10px 0;font-size:13px;color:#8b5a3c;text-transform:uppercase;letter-spacing:1.5px;">6-digit security code</p>
                                    <p style="margin:0;font-size:38px;font-weight:700;letter-spacing:10px;color:#c45508;font-family:monospace;">{verification_code}</p>
                                </div>
                                <p style="margin:0;font-size:14px;line-height:1.6;color:#8b5a3c;">This code expires in <strong>10 minutes</strong>. If this wasn’t you, please reset your password and review your account security.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:24px 36px;background:#fffaf6;border-top:1px solid #ffe7d4;">
                                <p style="margin:0;font-size:12px;line-height:1.6;color:#9a6a4c;">For your protection, never share this code with anyone.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    text_content = (
        f"123Bots\n\n"
        f"Hi{' ' + user_name if user_name else ''},\n\n"
        f"Use this code to {purpose_label}:\n\n"
        f"{verification_code}\n\n"
        "This code expires in 10 minutes."
    )

    return await send_email(to_email, subject, html_content, text_content)


_TZ_ABBREVIATIONS = {
    "America/New_York": "ET",
    "America/Chicago": "CT",
    "America/Denver": "MT",
    "America/Phoenix": "MT",
    "America/Los_Angeles": "PT",
    "America/Anchorage": "AKT",
    "Pacific/Honolulu": "HT",
}


def _format_meeting_datetime(date_str: str, time_str: str, tz_name: str = "") -> str:
    """Best-effort 'August 21, 2026 at 9:00 AM ET' formatting; falls back to the raw strings."""
    parsed_date = None
    for fmt in ("%Y-%m-%d",):
        try:
            parsed_date = datetime.strptime(date_str, fmt)
            break
        except (ValueError, TypeError):
            continue

    parsed_time = None
    for fmt in ("%H:%M", "%I:%M %p", "%I:%M%p"):
        try:
            parsed_time = datetime.strptime(time_str.strip(), fmt)
            break
        except (ValueError, TypeError):
            continue

    tz_abbr = _TZ_ABBREVIATIONS.get(tz_name, "")
    suffix = f" {tz_abbr}" if tz_abbr else ""

    date_part = f"{parsed_date.strftime('%B')} {parsed_date.day}, {parsed_date.year}" if parsed_date else date_str
    if parsed_time:
        hour_12 = parsed_time.hour % 12 or 12
        time_part = f"{hour_12}:{parsed_time.strftime('%M %p')}"
    else:
        time_part = time_str
    return f"{date_part} at {time_part}{suffix}"


def build_meeting_invite_email(
    guest_name: str,
    title: str,
    date_str: str,
    time_str: str,
    duration_minutes: int,
    host_email: str,
    video_link: str = "",
    room_path: str = "",
    timezone_name: str = "",
    is_saysme_room: bool = True,
):
    """Dark-themed meeting invite email - matches the branded SaysMe invite design."""
    heading = f"Meeting with {guest_name}" if guest_name else (title or "Meeting Invite")
    when_str = _format_meeting_datetime(date_str, time_str, timezone_name)
    room_label = "ROOM NAME" if is_saysme_room and room_path else "MEETING LINK"
    room_value = room_path if is_saysme_room and room_path else video_link

    room_row_html = ""
    if room_value:
        room_row_html = f"""
                                <tr>
                                    <td style="padding:14px 0 0 0;color:#7c7f93;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">{room_label}</td>
                                    <td style="padding:14px 0 0 0;text-align:right;">
                                        <span style="display:inline-block;background:#1e1e2b;color:#c7c9ff;font-family:'Courier New',monospace;font-size:13px;padding:4px 10px;border-radius:6px;">{room_value}</span>
                                    </td>
                                </tr>"""

    button_html = ""
    if video_link:
        button_html = f"""
                        <tr>
                            <td align="center" style="padding:32px 0 0 0;">
                                <a href="{video_link}" style="display:inline-block;background-color:#6366f1;background-image:linear-gradient(135deg,#7c7ff5,#5b5ce0);color:#ffffff;font-size:14px;font-weight:700;letter-spacing:0.5px;text-decoration:none;text-transform:uppercase;padding:16px 40px;border-radius:999px;">Join Meeting Room</a>
                            </td>
                        </tr>"""

    footer_label = "MEET SAYS ME &bull; SECURE MULTI-POINT TRANSMISSION PROTOCOL" if is_saysme_room else "123BOTS &bull; MEETING INVITATION SYSTEM"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#0a0a12;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a12;padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#12121c;border:1px solid #23232f;border-radius:20px;">
                        <tr>
                            <td style="padding:40px;">
                                <p style="margin:0 0 14px 0;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8183f4;">Meeting Invitation</p>
                                <h1 style="margin:0 0 16px 0;font-size:26px;font-weight:700;color:#ffffff;">{heading}</h1>
                                <p style="margin:0;font-size:14px;line-height:1.6;color:#9ca3af;">You have been invited to a scheduled video conference by <strong style="color:#e5e7eb;">{host_email}</strong>.</p>

                                <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0 0;background-color:#16161f;border:1px solid #23232f;border-radius:14px;">
                                    <tr>
                                        <td style="padding:20px 24px;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="padding:0;color:#7c7f93;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Date &amp; Time</td>
                                                    <td style="padding:0;text-align:right;color:#ffffff;font-size:14px;font-weight:700;">{when_str}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:14px 0 0 0;color:#7c7f93;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Duration</td>
                                                    <td style="padding:14px 0 0 0;text-align:right;color:#e5e7eb;font-size:14px;">{duration_minutes} minutes</td>
                                                </tr>{room_row_html}
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <table width="100%" cellpadding="0" cellspacing="0">{button_html}
                                </table>

                                <hr style="margin:32px 0;border:none;border-top:1px solid #23232f;">
                                <p style="margin:0;text-align:center;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;">{footer_label}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    text_content = (
        f"{heading}\n\n"
        f"You have been invited to a scheduled video conference by {host_email}.\n\n"
        f"Date & Time: {when_str}\n"
        f"Duration: {duration_minutes} minutes\n"
        + (f"{room_label.title()}: {room_value}\n" if room_value else "")
        + (f"\nJoin: {video_link}\n" if video_link else "")
    ).strip()

    return html_content, text_content


def build_service_status_email(
    guest_name: str,
    product_label: str,
    event_label: str,
    detail_message: str = "",
    portal_url: str = "",
    site_name: str = "123Bots",
):
    """Update email for a Service CRM request - status changes, unit
    received/returned, loaner out/in. Matches the standard 123Bots
    transactional email style (see send_two_factor_email)."""
    subject = f"{site_name} Service Update: {event_label}"

    portal_button = ""
    if portal_url:
        portal_button = f"""
                                <div style="text-align:center;margin:28px 0 0 0;">
                                    <a href="{portal_url}" style="display:inline-block;background:#ff8c42;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:999px;">View Service Status</a>
                                </div>"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#fff7f0;color:#2c1810;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#fff7f0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #ffd9bf;box-shadow:0 10px 30px rgba(44,24,16,0.08);">
                        <tr>
                            <td style="padding:32px 36px;background:linear-gradient(135deg,#2c1810 0%,#5c2f12 55%,#ff8c42 100%);text-align:left;">
                                <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ffd9bf;">{site_name} Service</p>
                                <h1 style="margin:0;font-size:26px;line-height:1.2;color:#ffffff;">{event_label}</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:36px;">
                                <p style="margin:0 0 12px 0;font-size:16px;line-height:1.7;color:#5c3b2a;">Hi{' ' + guest_name if guest_name else ''},</p>
                                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#5c3b2a;">There's an update on your <strong>{product_label}</strong> service request.</p>
                                <div style="margin:20px 0;padding:20px 24px;border-radius:14px;background:#fff2e8;border:1px solid #ffd9bf;">
                                    <p style="margin:0;font-size:15px;line-height:1.6;color:#8b5a3c;">{detail_message or event_label}</p>
                                </div>{portal_button}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:24px 36px;background:#fffaf6;border-top:1px solid #ffe7d4;">
                                <p style="margin:0;font-size:12px;line-height:1.6;color:#9a6a4c;">Questions about your service? Just reply to this email.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    text_content = (
        f"{event_label}\n\n"
        f"Hi{' ' + guest_name if guest_name else ''},\n\n"
        f"There's an update on your {product_label} service request.\n\n"
        f"{detail_message or event_label}\n"
        + (f"\nView status: {portal_url}\n" if portal_url else "")
    ).strip()

    return html_content, text_content
