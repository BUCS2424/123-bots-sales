"""
Email utility module for sending emails via SMTP
Retrieves SMTP settings from admin_settings collection in database
"""
import smtplib
import ssl
import asyncio
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
