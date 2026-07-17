"""
Tax Exempt Module
Adds a tax-exempt toggle + tax exemption info (certificate #, reason, expiration,
and an uploaded certificate copy) to Leads and Customers. When a lead/customer is
tax exempt, sales tax is zeroed on their quotes and storefront orders.
"""
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel

TAX_CERT_DIR = Path("/app/uploads/tax-certs")
ALLOWED_CERT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic", "application/pdf"}


class CertFile(BaseModel):
    url: str
    name: str
    size: int = 0
    content_type: str = "application/octet-stream"
    uploaded_at: Optional[str] = None


class TaxExemptPayload(BaseModel):
    tax_exempt: bool = False
    certificate_number: Optional[str] = ""
    reason: Optional[str] = ""
    expiration_date: Optional[str] = ""
    cert_file: Optional[CertFile] = None


def _build_tax_exempt_info(payload: TaxExemptPayload) -> dict:
    return {
        "certificate_number": payload.certificate_number or "",
        "reason": payload.reason or "",
        "expiration_date": payload.expiration_date or "",
        "cert_file": payload.cert_file.model_dump() if payload.cert_file else None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


async def get_tax_exempt_state(db, user_id: str = None, email: str = None) -> dict:
    """Return {tax_exempt: bool, info: {...}} for a customer, looking up by id then email.

    Used by the storefront checkout to zero out tax for exempt buyers.
    """
    record = None
    if user_id:
        record = await db.customers.find_one({"id": user_id}, {"_id": 0}) or \
            await db.users.find_one({"id": user_id}, {"_id": 0})
    if not record and email:
        email = email.lower().strip()
        record = await db.customers.find_one({"email": email}, {"_id": 0}) or \
            await db.users.find_one({"email": email}, {"_id": 0})
    if not record:
        return {"tax_exempt": False, "info": None}
    return {
        "tax_exempt": bool(record.get("tax_exempt")),
        "info": record.get("tax_exempt_info"),
    }


def get_tax_exempt_router(db, require_admin, require_auth):
    router = APIRouter(prefix="/api/tax-exempt", tags=["tax-exempt"])

    @router.post("/upload-cert")
    async def upload_cert(file: UploadFile = File(...), current_user=Depends(require_admin)):
        """Upload a copy of a tax-exemption certificate (admin only)."""
        content = await file.read()
        if len(content) > 25 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 25MB)")
        if file.content_type and file.content_type not in ALLOWED_CERT_TYPES:
            raise HTTPException(status_code=400, detail="Unsupported file type. Upload an image or PDF.")

        TAX_CERT_DIR.mkdir(parents=True, exist_ok=True)
        ext = os.path.splitext(file.filename or "")[1] or ""
        unique_name = f"{uuid.uuid4()}{ext}"
        with open(TAX_CERT_DIR / unique_name, "wb") as fh:
            fh.write(content)

        return {
            "url": f"/api/uploads/tax-certs/{unique_name}",
            "name": file.filename or unique_name,
            "size": len(content),
            "content_type": file.content_type or "application/octet-stream",
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        }

    @router.put("/lead/{lead_id}")
    async def set_lead_tax_exempt(lead_id: str, payload: TaxExemptPayload, current_user=Depends(require_admin)):
        lead = await db.leads.find_one({"id": lead_id}, {"_id": 0, "id": 1})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        await db.leads.update_one(
            {"id": lead_id},
            {"$set": {
                "tax_exempt": bool(payload.tax_exempt),
                "tax_exempt_info": _build_tax_exempt_info(payload),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        updated = await db.leads.find_one({"id": lead_id}, {"_id": 0})
        return {"success": True, "lead": updated}

    @router.put("/customer/{customer_id}")
    async def set_customer_tax_exempt(customer_id: str, payload: TaxExemptPayload, current_user=Depends(require_admin)):
        customer = await db.customers.find_one({"id": customer_id}, {"_id": 0, "id": 1})
        user = await db.users.find_one({"id": customer_id}, {"_id": 0, "id": 1})
        if not customer and not user:
            raise HTTPException(status_code=404, detail="Customer not found")
        update = {
            "tax_exempt": bool(payload.tax_exempt),
            "tax_exempt_info": _build_tax_exempt_info(payload),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.customers.update_one({"id": customer_id}, {"$set": update})
        await db.users.update_one({"id": customer_id}, {"$set": update})
        updated = await db.customers.find_one({"id": customer_id}, {"_id": 0}) or \
            await db.users.find_one({"id": customer_id}, {"_id": 0})
        return {"success": True, "customer": updated}

    @router.get("/me")
    async def my_tax_exempt(current_user=Depends(require_auth)):
        """Return the authenticated buyer's tax-exempt status (for storefront checkout)."""
        return await get_tax_exempt_state(db, user_id=current_user.user_id)

    return router
