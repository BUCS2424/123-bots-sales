"""
Email Templates API
Manages system email templates for order confirmations, shipping notifications, etc.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

router = APIRouter(prefix="/api/email-templates", tags=["email-templates"])

# Will be set by server.py
db = None

def set_db(database):
    global db
    db = database

# Legacy hardcoded logo that may still exist in previously-saved custom templates -
# kept as-is so apply_site_logo() below can keep detecting and replacing it.
OLD_HARDCODED_LOGO = "/images/legacy-logo-placeholder.png"
# No bundled default image for emails with no configured logo yet.
DEFAULT_SITE_LOGO = ""


async def get_site_logo():
    """Fetch the current site logo from General Settings (admin_settings type=site)."""
    try:
        settings = await db.admin_settings.find_one({"type": "site"})
        if settings and settings.get("logo_url"):
            return settings["logo_url"]
    except Exception:
        pass
    return DEFAULT_SITE_LOGO


def apply_site_logo(html: str, logo: str) -> str:
    """Inject the current site logo, replacing both the {{site_logo}} variable
    and any leftover legacy hardcoded logo URL."""
    if not html:
        return html
    return html.replace("{{site_logo}}", logo).replace(OLD_HARDCODED_LOGO, logo)

# 123Bots Brand Colors
# Primary: #ff8c42 (warm orange)
# Secondary: #9370db (purple)
# Dark: #2c1810 (warm brown)
# Light text: #ffd4b8 (cream)

# Default email templates - 123Bots
DEFAULT_TEMPLATES = {
    "order_confirmation": {
        "name": "Order Confirmation",
        "subject": "Your 123Bots Order #{{order_number}} is Confirmed!",
        "description": "Sent to customers after they place an order",
        "html_content": """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #2c1810 0%, #3a1f12 100%); padding: 30px; text-align: center;">
        <img src="{{site_logo}}" alt="123Bots" style="height: 60px; margin-bottom: 10px;">
        <p style="color: #ffd4b8; margin: 10px 0 0 0; font-size: 14px;">Commercial Cleaning Robots</p>
      </td>
    </tr>
    
    <!-- Main Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #ff8c42; margin: 0 0 20px 0;">Thank You for Your Order!</h2>
        <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0;">
          Hi {{customer_name}},
        </p>
        <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0;">
          We've received your order and it's being prepared with care. Your order details are below:
        </p>
        
        <!-- Order Info Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8f3; border-radius: 8px; margin: 20px 0; border: 1px solid #ffe4d4;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 10px 0;"><strong style="color: #ff8c42;">Order Number:</strong> <span style="color: #333;">{{order_number}}</span></p>
              <p style="margin: 0 0 10px 0;"><strong style="color: #ff8c42;">Order Date:</strong> <span style="color: #333;">{{order_date}}</span></p>
              <p style="margin: 0;"><strong style="color: #ff8c42;">Order Total:</strong> <span style="color: #333; font-size: 18px; font-weight: bold;">${{order_total}}</span></p>
            </td>
          </tr>
        </table>
        
        <!-- Order Items -->
        <h3 style="color: #ff8c42; margin: 30px 0 15px 0; border-bottom: 2px solid #ffd4b8; padding-bottom: 10px;">Order Items</h3>
        {{order_items}}
        
        <!-- Shipping Info -->
        <h3 style="color: #ff8c42; margin: 30px 0 15px 0; border-bottom: 2px solid #ffd4b8; padding-bottom: 10px;">Shipping Address</h3>
        <p style="color: #333; line-height: 1.6; margin: 0;">
          {{shipping_address}}
        </p>
        
        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td style="text-align: center;">
              <a href="{{order_url}}" style="display: inline-block; background: linear-gradient(135deg, #ff8c42 0%, #ff6b1a 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold;">
                View Order Details
              </a>
            </td>
          </tr>
        </table>
        
        <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
          If you have any questions about your order, please don't hesitate to contact us.
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #2c1810; padding: 30px; text-align: center;">
        <p style="color: #ff8c42; margin: 0 0 10px 0; font-size: 12px;">COMMERCIAL CLEANING ROBOTS • SALES • LEASING • SUPPORT</p>
        <p style="color: #ffd4b8; margin: 0; font-size: 12px;">
          © {{current_year}} 123Bots. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>""",
        "variables": ["site_logo", "customer_name", "order_number", "order_date", "order_total", "order_items", "shipping_address", "order_url", "current_year"]
    },
    "shipping_confirmation": {
        "name": "Shipping Confirmation",
        "subject": "Your 123Bots Order #{{order_number}} Has Shipped!",
        "description": "Sent when an order ships with tracking info",
        "html_content": """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #2c1810 0%, #3a1f12 100%); padding: 30px; text-align: center;">
        <img src="{{site_logo}}" alt="123Bots" style="height: 60px; margin-bottom: 10px;">
        <p style="color: #ffd4b8; margin: 10px 0 0 0; font-size: 14px;">Your Order is On Its Way!</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #ff8c42; margin: 0 0 20px 0;">📦 Your Order Has Shipped!</h2>
        <p style="color: #333; line-height: 1.6;">Hi {{customer_name}},</p>
        <p style="color: #333; line-height: 1.6;">Great news! Your custom order has been shipped and is on its way to you.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8f3; border-radius: 8px; margin: 20px 0; border: 1px solid #ffe4d4;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 10px 0;"><strong style="color: #ff8c42;">Order Number:</strong> {{order_number}}</p>
              <p style="margin: 0 0 10px 0;"><strong style="color: #ff8c42;">Carrier:</strong> {{carrier}}</p>
              <p style="margin: 0;"><strong style="color: #ff8c42;">Tracking Number:</strong> {{tracking_number}}</p>
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td style="text-align: center;">
              <a href="{{tracking_url}}" style="display: inline-block; background: linear-gradient(135deg, #ff8c42 0%, #ff6b1a 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold;">
                Track Your Package
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color: #2c1810; padding: 30px; text-align: center;">
        <p style="color: #ff8c42; margin: 0 0 10px 0; font-size: 12px;">COMMERCIAL CLEANING ROBOTS • SALES • LEASING • SUPPORT</p>
        <p style="color: #ffd4b8; margin: 0; font-size: 12px;">© {{current_year}} 123Bots. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>""",
        "variables": ["site_logo", "customer_name", "order_number", "carrier", "tracking_number", "tracking_url", "current_year"]
    },
    "welcome_email": {
        "name": "Welcome Email",
        "subject": "Welcome to 123Bots - Your Account is Ready!",
        "description": "Sent to new users after registration",
        "html_content": """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #2c1810 0%, #3a1f12 100%); padding: 30px; text-align: center;">
        <img src="{{site_logo}}" alt="123Bots" style="height: 60px; margin-bottom: 10px;">
        <p style="color: #ffd4b8; margin: 10px 0 0 0; font-size: 14px;">Commercial Cleaning Robots</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #ff8c42; margin: 0 0 20px 0;">Welcome to 123Bots!</h2>
        <p style="color: #333; line-height: 1.6;">Hi {{customer_name}},</p>
        <p style="color: #333; line-height: 1.6;">Thank you for creating an account with us. You now have access to:</p>
        
        <ul style="color: #333; line-height: 2;">
          <li>Browse our full lineup of cleaning and delivery robots</li>
          <li>Fast checkout with saved addresses</li>
          <li>Order tracking and history</li>
          <li>Access to parts and accessories for your equipment</li>
          <li>Buy or lease financing options</li>
        </ul>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td style="text-align: center;">
              <a href="{{shop_url}}" style="display: inline-block; background: linear-gradient(135deg, #ff8c42 0%, #ff6b1a 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold;">
                Start Shopping
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color: #2c1810; padding: 30px; text-align: center;">
        <p style="color: #ff8c42; margin: 0 0 10px 0; font-size: 12px;">WHATEVER YOUR PLEASURE, FIND YOUR TREASURE!</p>
        <p style="color: #ffd4b8; margin: 0; font-size: 12px;">© {{current_year}} 123Bots. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>""",
        "variables": ["site_logo", "customer_name", "shop_url", "current_year"]
    },
    "password_reset": {
        "name": "Password Reset",
        "subject": "Reset Your 123Bots Password",
        "description": "Sent when a user requests a password reset",
        "html_content": """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #2c1810 0%, #3a1f12 100%); padding: 30px; text-align: center;">
        <img src="{{site_logo}}" alt="123Bots" style="height: 60px;">
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #ff8c42; margin: 0 0 20px 0;">Password Reset Request</h2>
        <p style="color: #333; line-height: 1.6;">Hi {{customer_name}},</p>
        <p style="color: #333; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password:</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td style="text-align: center;">
              <a href="{{reset_url}}" style="display: inline-block; background: linear-gradient(135deg, #ff8c42 0%, #ff6b1a 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
        
        <p style="color: #666; line-height: 1.6; font-size: 14px;">This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #2c1810; padding: 30px; text-align: center;">
        <p style="color: #ffd4b8; margin: 0; font-size: 12px;">© {{current_year}} 123Bots. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>""",
        "variables": ["site_logo", "customer_name", "reset_url", "current_year"]
    },
    "order_status_update": {
        "name": "Order Status Update",
        "subject": "Update on Your 123Bots Order #{{order_number}}",
        "description": "Sent when order status changes",
        "html_content": """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #2c1810 0%, #3a1f12 100%); padding: 30px; text-align: center;">
        <img src="{{site_logo}}" alt="123Bots" style="height: 60px;">
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #ff8c42; margin: 0 0 20px 0;">Order Status Update</h2>
        <p style="color: #333; line-height: 1.6;">Hi {{customer_name}},</p>
        <p style="color: #333; line-height: 1.6;">Your order status has been updated:</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8f3; border-radius: 8px; margin: 20px 0; border: 1px solid #ffe4d4;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666;">Order #{{order_number}}</p>
              <p style="margin: 0; color: #ff8c42; font-size: 24px; font-weight: bold;">{{new_status}}</p>
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td style="text-align: center;">
              <a href="{{order_url}}" style="display: inline-block; background: linear-gradient(135deg, #ff8c42 0%, #ff6b1a 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold;">
                View Order
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color: #2c1810; padding: 30px; text-align: center;">
        <p style="color: #ff8c42; margin: 0 0 10px 0; font-size: 12px;">COMMERCIAL CLEANING ROBOTS • SALES • LEASING • SUPPORT</p>
        <p style="color: #ffd4b8; margin: 0; font-size: 12px;">© {{current_year}} 123Bots. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>""",
        "variables": ["site_logo", "customer_name", "order_number", "new_status", "order_url", "current_year"]
    },
    "abandoned_cart": {
        "name": "Abandoned Cart Reminder",
        "subject": "You left something behind at 123Bots!",
        "description": "Sent to remind customers about items left in cart",
        "html_content": """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #2c1810 0%, #3a1f12 100%); padding: 30px; text-align: center;">
        <img src="{{site_logo}}" alt="123Bots" style="height: 60px; margin-bottom: 10px;">
        <p style="color: #ffd4b8; margin: 10px 0 0 0; font-size: 14px;">Commercial Cleaning Robots</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #ff8c42; margin: 0 0 20px 0;">🛒 Forgot Something?</h2>
        <p style="color: #333; line-height: 1.6;">Hi {{customer_name}},</p>
        <p style="color: #333; line-height: 1.6;">We noticed you left some amazing items in your cart. Don't let them get away!</p>
        
        <!-- Cart Items -->
        <div style="margin: 20px 0;">
          {{cart_items}}
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td style="text-align: center;">
              <a href="{{cart_url}}" style="display: inline-block; background: linear-gradient(135deg, #ff8c42 0%, #ff6b1a 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold;">
                Complete Your Order
              </a>
            </td>
          </tr>
        </table>
        
        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          Need help? Reply to this email and we'll be happy to assist you.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #2c1810; padding: 30px; text-align: center;">
        <p style="color: #ff8c42; margin: 0 0 10px 0; font-size: 12px;">WHATEVER YOUR PLEASURE, FIND YOUR TREASURE!</p>
        <p style="color: #ffd4b8; margin: 0; font-size: 12px;">© {{current_year}} 123Bots. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>""",
        "variables": ["site_logo", "customer_name", "cart_items", "cart_url", "current_year"]
    }
}


class EmailTemplateUpdate(BaseModel):
    subject: Optional[str] = None
    html_content: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("")
async def get_email_templates():
    """Get all email templates"""
    templates = []
    site_logo = await get_site_logo()
    
    for template_id, default_template in DEFAULT_TEMPLATES.items():
        # Check if there's a custom version in the database
        custom = await db.email_templates.find_one({"template_id": template_id})
        
        if custom:
            templates.append({
                "id": template_id,
                "name": default_template["name"],
                "description": default_template["description"],
                "subject": custom.get("subject", default_template["subject"]),
                "html_content": apply_site_logo(custom.get("html_content", default_template["html_content"]), site_logo),
                "variables": default_template["variables"],
                "is_active": custom.get("is_active", True),
                "is_customized": True,
                "updated_at": custom.get("updated_at")
            })
        else:
            templates.append({
                "id": template_id,
                "name": default_template["name"],
                "description": default_template["description"],
                "subject": default_template["subject"],
                "html_content": apply_site_logo(default_template["html_content"], site_logo),
                "variables": default_template["variables"],
                "is_active": True,
                "is_customized": False,
                "updated_at": None
            })
    
    return templates


@router.get("/{template_id}")
async def get_email_template(template_id: str):
    """Get a single email template"""
    if template_id not in DEFAULT_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    default_template = DEFAULT_TEMPLATES[template_id]
    custom = await db.email_templates.find_one({"template_id": template_id})
    site_logo = await get_site_logo()
    
    if custom:
        return {
            "id": template_id,
            "name": default_template["name"],
            "description": default_template["description"],
            "subject": custom.get("subject", default_template["subject"]),
            "html_content": apply_site_logo(custom.get("html_content", default_template["html_content"]), site_logo),
            "variables": default_template["variables"],
            "is_active": custom.get("is_active", True),
            "is_customized": True,
            "updated_at": custom.get("updated_at")
        }
    
    return {
        "id": template_id,
        "name": default_template["name"],
        "description": default_template["description"],
        "subject": default_template["subject"],
        "html_content": apply_site_logo(default_template["html_content"], site_logo),
        "variables": default_template["variables"],
        "is_active": True,
        "is_customized": False,
        "updated_at": None
    }


@router.put("/{template_id}")
async def update_email_template(template_id: str, update: EmailTemplateUpdate):
    """Update an email template"""
    if template_id not in DEFAULT_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["template_id"] = template_id
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.email_templates.update_one(
        {"template_id": template_id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"success": True, "message": "Template updated successfully"}


@router.post("/{template_id}/reset")
async def reset_email_template(template_id: str):
    """Reset a template to its default"""
    if template_id not in DEFAULT_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    await db.email_templates.delete_one({"template_id": template_id})
    
    return {"success": True, "message": "Template reset to default"}


@router.post("/{template_id}/preview")
async def preview_email_template(template_id: str):
    """Get a preview of the template with sample data"""
    if template_id not in DEFAULT_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    default_template = DEFAULT_TEMPLATES[template_id]
    custom = await db.email_templates.find_one({"template_id": template_id})
    
    html_content = custom.get("html_content") if custom else default_template["html_content"]
    subject = custom.get("subject") if custom else default_template["subject"]
    site_logo = await get_site_logo()
    html_content = apply_site_logo(html_content, site_logo)
    
    # Sample data for preview
    sample_data = {
        "site_logo": site_logo,
        "customer_name": "John Doe",
        "order_number": "ORD-20240101-ABC123",
        "order_date": "January 1, 2024",
        "order_total": "89.99",
        "order_items": """
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Pudu CC1 Pro - Side Brush (1pcs)</strong> x 2 - $49.99</td></tr>
          <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Ameripolish - Rejuvenating Cleaner (4oz)</strong> x 1 - $24.99</td></tr>
        </table>
        """,
        "cart_items": """
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8f3; border-radius: 8px; border: 1px solid #ffe4d4;">
          <tr><td style="padding: 15px;"><strong>AvidBots KAS - Squeegee Set</strong> - $34.99</td></tr>
          <tr><td style="padding: 15px; border-top: 1px solid #ffe4d4;"><strong>Smart Floor - Orange WMRESTORATION 20"</strong> - $19.99</td></tr>
        </table>
        """,
        "shipping_address": "123 Main Street<br>Anytown, AL 12345<br>United States",
        "order_url": "https://123bots.com/orders/ORD-123",
        "cart_url": "https://123bots.com/checkout",
        "carrier": "USPS Priority",
        "tracking_number": "9400111899223456789012",
        "tracking_url": "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223456789012",
        "shop_url": "https://123bots.com/shop",
        "reset_url": "https://123bots.com/reset-password?token=abc123",
        "new_status": "Processing",
        "current_year": str(datetime.now().year)
    }
    
    # Replace variables
    preview_html = html_content
    preview_subject = subject
    for var, value in sample_data.items():
        preview_html = preview_html.replace("{{" + var + "}}", value)
        preview_subject = preview_subject.replace("{{" + var + "}}", value)
    
    return {
        "subject": preview_subject,
        "html_content": preview_html
    }
