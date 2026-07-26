"""
Tours / Charters Billing Module
- Admin-managed invoices billed to Charter Companies (activity_sellers) for booking
  revenue/commission owed to the platform. Amounts are entered manually per invoice
  (no automated booking-revenue capture yet - FareHarbor partner API access is pending).
- Public, no-login invoice view + "Pay Now" (Stripe Checkout) for the charter company.

Follows existing module conventions (uuid ids, set_database, dict storage,
Bearer-token admin auth via decode_token/is_admin_or_above). Reuses the same
Stripe Checkout helper (get_stripe_secret_key) already used by durango_payments.py.
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Request, Body
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from auth import decode_token, is_admin_or_above
from durango_payments import get_stripe_secret_key
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
from email_utils import send_email

router = APIRouter(prefix="/api/tours-charters", tags=["Tours Charters Billing"])
public_router = APIRouter(prefix="/api/public/tours-charters", tags=["Tours Charters Billing Public"])

_db = None


def set_database(database):
    global _db
    _db = database


async def get_db():
    return _db


def _require_admin_token(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    token = authorization.split("Bearer ", 1)[1].strip()
    token_data = decode_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not is_admin_or_above(token_data.role or ""):
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"user_id": token_data.user_id, "email": token_data.email, "role": token_data.role}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# =============== MODELS ===============

class InvoiceLineItem(BaseModel):
    description: str = ""
    booking_ref: str = ""  # "Booking ID / Name" reference
    qty: float = 1
    rate: float = 0
    tax_percent: float = 0


class InvoiceCreate(BaseModel):
    seller_id: str
    invoice_date: str = ""  # YYYY-MM-DD; defaults to today if blank
    sale_agent: str = ""
    line_items: List[InvoiceLineItem] = Field(default_factory=list)
    custom_note: str = ""
    bank_info: str = ""
    venmo_info: str = ""
    check_info: str = ""


class InvoiceUpdate(BaseModel):
    invoice_date: Optional[str] = None
    sale_agent: Optional[str] = None
    line_items: Optional[List[InvoiceLineItem]] = None
    custom_note: Optional[str] = None
    bank_info: Optional[str] = None
    venmo_info: Optional[str] = None
    check_info: Optional[str] = None
    status: Optional[str] = None  # unpaid | paid | void


class InvoiceSettingsUpdate(BaseModel):
    default_bank_info: Optional[str] = None
    default_venmo_info: Optional[str] = None
    default_check_info: Optional[str] = None
    default_custom_note: Optional[str] = None
    default_sale_agent: Optional[str] = None


def _compute_totals(line_items: List[dict]) -> dict:
    subtotal = 0.0
    tax_amount = 0.0
    for li in line_items:
        qty = float(li.get("qty") or 0)
        rate = float(li.get("rate") or 0)
        tax_pct = float(li.get("tax_percent") or 0)
        amount = round(qty * rate, 2)
        li["amount"] = amount
        subtotal += amount
        tax_amount += amount * (tax_pct / 100)
    subtotal = round(subtotal, 2)
    tax_amount = round(tax_amount, 2)
    return {"subtotal": subtotal, "tax_amount": tax_amount, "total": round(subtotal + tax_amount, 2)}


async def _next_invoice_number(db) -> str:
    year_suffix = datetime.now(timezone.utc).strftime("%y")
    seq = await db.tours_charters_invoices.count_documents({}) + 1
    return f"INV-{seq:06d}-{year_suffix}"


# =============== INVOICE SETTINGS (defaults for new invoices) ===============

@router.get("/invoice-settings")
async def get_invoice_settings(authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    doc = await db.admin_settings.find_one({"type": "tours_charters_invoice_settings"}, {"_id": 0, "type": 0})
    return doc or {
        "default_bank_info": "", "default_venmo_info": "", "default_check_info": "",
        "default_custom_note": "", "default_sale_agent": "",
    }


@router.put("/invoice-settings")
async def update_invoice_settings(payload: InvoiceSettingsUpdate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["type"] = "tours_charters_invoice_settings"
    updates["updated_at"] = _now_iso()
    await db.admin_settings.update_one({"type": "tours_charters_invoice_settings"}, {"$set": updates}, upsert=True)
    return {"success": True}


# =============== INVOICES (admin) ===============

@router.get("/invoices")
async def list_invoices(seller_id: Optional[str] = None, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    query = {"seller_id": seller_id} if seller_id else {}
    return await db.tours_charters_invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(2000)


@router.post("/invoices")
async def create_invoice(payload: InvoiceCreate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    seller = await db.activity_sellers.find_one({"id": payload.seller_id}, {"_id": 0})
    if not seller:
        raise HTTPException(status_code=400, detail="Charter company not found")

    line_items = [li.model_dump() for li in payload.line_items]
    totals = _compute_totals(line_items)

    doc = payload.model_dump()
    doc["line_items"] = line_items
    doc["id"] = str(uuid.uuid4())
    doc["invoice_number"] = await _next_invoice_number(db)
    doc["seller_name"] = seller.get("name")
    doc["status"] = "unpaid"
    doc["amount_paid"] = 0.0
    doc["invoice_date"] = payload.invoice_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    doc.update(totals)
    doc["amount_due"] = totals["total"]
    doc["created_at"] = _now_iso()
    doc["updated_at"] = doc["created_at"]
    await db.tours_charters_invoices.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    invoice = await db.tours_charters_invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.put("/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, payload: InvoiceUpdate, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    existing = await db.tours_charters_invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if "line_items" in updates:
        line_items = [li if isinstance(li, dict) else li.model_dump() for li in updates["line_items"]]
        totals = _compute_totals(line_items)
        updates["line_items"] = line_items
        updates.update(totals)
        updates["amount_due"] = round(totals["total"] - existing.get("amount_paid", 0.0), 2)

    if updates.get("status") == "paid" and existing.get("status") != "paid":
        updates["paid_at"] = _now_iso()
        updates["amount_paid"] = updates.get("total", existing.get("total", 0))
        updates["amount_due"] = 0.0

    updates["updated_at"] = _now_iso()
    await db.tours_charters_invoices.update_one({"id": invoice_id}, {"$set": updates})
    return await db.tours_charters_invoices.find_one({"id": invoice_id}, {"_id": 0})


@router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    result = await db.tours_charters_invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"success": True}


@router.post("/invoices/{invoice_id}/send-email")
async def send_invoice_email(invoice_id: str, payload: dict = Body(default={}), authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    invoice = await db.tours_charters_invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    seller = await db.activity_sellers.find_one({"id": invoice.get("seller_id")}, {"_id": 0}) or {}
    business = await db.admin_settings.find_one({"type": "business"}, {"_id": 0}) or {}

    recipient = (payload.get("email") or "").strip() or seller.get("invoice_email") or seller.get("contact_email")
    if not recipient:
        raise HTTPException(status_code=400, detail="This charter company has no invoice or contact email on file")

    origin = (payload.get("origin_url") or "").rstrip("/")
    invoice_link = f"{origin}/invoice/tours-charters/{invoice_id}"
    business_name = business.get("business_name", "123Bots")

    subject = f"Invoice {invoice.get('invoice_number')} from {business_name}"
    text_body = (
        f"You have a new invoice from {business_name}.\n\n"
        f"Invoice: {invoice.get('invoice_number')}\n"
        f"Amount Due: ${invoice.get('amount_due', 0):.2f}\n\n"
        f"View and pay your invoice here: {invoice_link}"
    )
    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
      <h2 style="color:#0f172a;">Invoice {invoice.get('invoice_number')}</h2>
      <p style="color:#475569;">You have a new invoice from <strong>{business_name}</strong>.</p>
      <p style="color:#475569;">Amount Due: <strong>${invoice.get('amount_due', 0):.2f}</strong></p>
      <p style="margin:24px 0;">
        <a href="{invoice_link}" style="background:#0d9488;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View &amp; Pay Invoice</a>
      </p>
      <p style="color:#94a3b8;font-size:12px;">Or copy this link: {invoice_link}</p>
    </div>
    """

    email_sent = False
    try:
        email_sent = await send_email(recipient, subject, html_body, text_body)
    except Exception:
        email_sent = False

    await db.tours_charters_invoices.update_one(
        {"id": invoice_id},
        {"$set": {"last_sent_at": _now_iso(), "last_sent_to": recipient, "updated_at": _now_iso()}},
    )

    return {"success": True, "email_sent": email_sent, "recipient": recipient, "invoice_link": invoice_link}



# =============== PUBLIC INVOICE VIEW + PAYMENT ===============

@public_router.get("/invoices/{invoice_id}")
async def public_get_invoice(invoice_id: str, db=Depends(get_db)):
    invoice = await db.tours_charters_invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    seller = await db.activity_sellers.find_one({"id": invoice.get("seller_id")}, {"_id": 0}) or {}
    business = await db.admin_settings.find_one({"type": "business"}, {"_id": 0}) or {}
    invoice["seller"] = {
        "name": seller.get("name", ""),
        "logo_url": seller.get("logo_url", ""),
        "billing_address": seller.get("billing_address", ""),
        "billing_city": seller.get("billing_city", ""),
        "billing_state": seller.get("billing_state", ""),
        "billing_zip": seller.get("billing_zip", ""),
        "tax_id": seller.get("tax_id", ""),
        "invoice_email": seller.get("invoice_email") or seller.get("contact_email", ""),
        "payment_terms": seller.get("payment_terms", ""),
    }
    invoice["bill_from"] = {
        "business_name": business.get("business_name", "123Bots"),
        "address": business.get("address", ""),
        "city": business.get("city", ""),
        "state": business.get("state", ""),
        "zip_code": business.get("zip_code", ""),
        "logo_url": business.get("logo_url", ""),
    }
    payments = await db.tours_charters_invoice_payments.find({"invoice_id": invoice_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    invoice["transactions"] = payments
    return invoice


@public_router.post("/invoices/{invoice_id}/pay")
async def public_pay_invoice(invoice_id: str, request: Request, payload: dict = Body(default={}), db=Depends(get_db)):
    invoice = await db.tours_charters_invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.get("status") == "paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid")
    amount = float(invoice.get("amount_due") or 0)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="There is nothing due on this invoice")

    origin = (payload.get("origin_url") or "").rstrip("/") or str(request.base_url).rstrip("/")
    host_url = str(request.base_url).rstrip("/")

    stripe_secret = await get_stripe_secret_key()
    stripe_checkout = StripeCheckout(api_key=stripe_secret, webhook_url=f"{host_url}/api/payments/stripe/webhook")
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=f"{origin}/invoice/tours-charters/{invoice_id}?stripe_session={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin}/invoice/tours-charters/{invoice_id}?stripe_cancelled=1",
        metadata={"invoice_id": invoice_id, "invoice_number": invoice.get("invoice_number", ""), "source": "tours_charters_invoice"},
    )
    session = await stripe_checkout.create_checkout_session(checkout_request)

    await db.tours_charters_invoice_payments.insert_one({
        "id": str(uuid.uuid4()),
        "invoice_id": invoice_id,
        "session_id": session.session_id,
        "amount": amount,
        "payment_status": "initiated",
        "created_at": _now_iso(),
    })
    return {"url": session.url, "session_id": session.session_id}


@public_router.get("/invoices/{invoice_id}/pay/status")
async def public_invoice_pay_status(invoice_id: str, session_id: str, db=Depends(get_db)):
    stripe_secret = await get_stripe_secret_key()
    stripe_checkout = StripeCheckout(api_key=stripe_secret, webhook_url="")
    checkout_status = await stripe_checkout.get_checkout_status(session_id)

    txn = await db.tours_charters_invoice_payments.find_one({"session_id": session_id}, {"_id": 0})
    already_paid = bool(txn and txn.get("payment_status") == "paid")

    await db.tours_charters_invoice_payments.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": checkout_status.payment_status, "session_status": checkout_status.status, "updated_at": _now_iso()}},
    )

    invoice = await db.tours_charters_invoices.find_one({"id": invoice_id}, {"_id": 0})
    if invoice and checkout_status.payment_status == "paid" and not already_paid and invoice.get("status") != "paid":
        amount = (txn or {}).get("amount", invoice.get("amount_due", 0))
        new_amount_paid = round((invoice.get("amount_paid", 0) or 0) + amount, 2)
        new_amount_due = max(round(invoice.get("total", 0) - new_amount_paid, 2), 0)
        new_status = "paid" if new_amount_due <= 0.01 else invoice.get("status")
        now_iso = _now_iso()
        await db.tours_charters_invoices.update_one(
            {"id": invoice_id},
            {"$set": {
                "amount_paid": new_amount_paid,
                "amount_due": new_amount_due,
                "status": new_status,
                "stripe_session_id": session_id,
                "paid_at": now_iso if new_status == "paid" else invoice.get("paid_at"),
                "updated_at": now_iso,
            }},
        )
        invoice = await db.tours_charters_invoices.find_one({"id": invoice_id}, {"_id": 0})

    return {"payment_status": checkout_status.payment_status, "status": checkout_status.status, "invoice": invoice}


# =============== BOOK NOW FUNNEL TRACKING ===============
# NOTE: FareHarbor Lightframe does not expose a documented client-side "booking complete"
# postMessage event, so we cannot verify actual payment completion inside the embedded
# iframe without official partner/webhook access. Instead we track the funnel we CAN see:
# button click -> booking widget opened -> widget closed (with time spent as an engagement
# proxy), and for generic external links, the outbound redirect itself.

class BookingEventCreate(BaseModel):
    activity_id: str
    activity_title: str = ""
    seller_id: str = ""
    seller_name: str = ""
    booking_provider: str = ""  # generic | fareharbor
    event_type: str  # book_now_click | drawer_opened | drawer_closed | external_redirect
    page_context: str = ""  # list | detail
    session_id: str = ""  # client-generated id correlating click -> open -> close for one attempt
    duration_seconds: Optional[float] = None  # set on drawer_closed


@public_router.post("/booking-events")
async def track_booking_event(payload: BookingEventCreate, db=Depends(get_db)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = _now_iso()
    await db.tours_charters_booking_events.insert_one(doc)
    return {"success": True}


@router.get("/booking-events/summary")
async def booking_events_summary(days: int = 30, authorization: Optional[str] = Header(None), db=Depends(get_db)):
    _require_admin_token(authorization)
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    events = await db.tours_charters_booking_events.find({"created_at": {"$gte": since}}, {"_id": 0}).sort("created_at", -1).to_list(5000)

    clicks = [e for e in events if e["event_type"] == "book_now_click"]
    opened = [e for e in events if e["event_type"] == "drawer_opened"]
    closed = [e for e in events if e["event_type"] == "drawer_closed"]
    redirects = [e for e in events if e["event_type"] == "external_redirect"]
    engaged = [e for e in closed if (e.get("duration_seconds") or 0) >= 20]

    return {
        "total_clicks": len(clicks),
        "drawer_opened": len(opened),
        "drawer_closed": len(closed),
        "external_redirects": len(redirects),
        "engaged_20s_plus": len(engaged),
        "recent_events": events[:15],
    }
