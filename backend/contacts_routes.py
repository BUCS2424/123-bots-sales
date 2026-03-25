from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import PlainTextResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import csv
import io
import uuid

from auth import decode_token


router = APIRouter(prefix="/contacts", tags=["Contacts"])
security = HTTPBearer()
db = None


def set_database(database):
    global db
    db = database


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token_data = decode_token(credentials.credentials)
    if not token_data or not token_data.user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.users.find_one({"id": token_data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


class ContactCreate(BaseModel):
    first_name: str = ""
    last_name: str = ""
    name: str = ""
    email: str = ""
    phone_number: str = ""
    email2: str = ""
    email3: str = ""
    mobile_phone: str = ""
    home_phone: str = ""
    business_phone: str = ""
    organization: str = ""
    job_title: str = ""
    street: str = ""
    address2: str = ""
    city: str = ""
    state: str = ""
    postal_code: str = ""
    contact_type: str = ""
    status: str = "active"
    grade: str = ""
    tags: List[str] = []
    lead_score: str = ""
    budget: str = ""
    assigned_to: str = ""
    source: str = ""
    birthdate: str = ""
    company: str = ""
    notes: str = ""


class ContactUpdate(ContactCreate):
    pass


def _contact_name(payload: ContactCreate) -> str:
    if payload.name.strip():
        return payload.name.strip()
    return f"{payload.first_name} {payload.last_name}".strip()


def _with_compat_fields(contact: dict) -> dict:
    result = {**contact}
    phone = result.get("mobile_phone") or result.get("phone_number") or ""
    result["mobile_phone"] = phone
    result["phone_number"] = phone
    if not result.get("name"):
        first = result.get("first_name", "")
        last = result.get("last_name", "")
        result["name"] = f"{first} {last}".strip()
    return result


@router.get("")
async def list_contacts(current_user: dict = Depends(get_current_user)):
    contacts = await db.contacts.find({"user_id": current_user["id"]}, {"_id": 0}).sort("name", 1).to_list(2000)
    return [_with_compat_fields(c) for c in contacts]


# Export routes MUST be defined BEFORE /{contact_id} to avoid route conflict
@router.get("/export")
async def export_contacts_json(current_user: dict = Depends(get_current_user)):
    contacts = await db.contacts.find({"user_id": current_user["id"]}, {"_id": 0}).sort("name", 1).to_list(2000)
    return [_with_compat_fields(c) for c in contacts]


@router.get("/export/csv")
async def export_contacts_csv(current_user: dict = Depends(get_current_user)):
    contacts = await db.contacts.find({"user_id": current_user["id"]}, {"_id": 0}).sort("name", 1).to_list(2000)
    contacts = [_with_compat_fields(c) for c in contacts]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["id", "name", "email", "phone_number", "organization", "status", "created_at"])
    writer.writeheader()
    for c in contacts:
        writer.writerow({k: c.get(k, "") for k in writer.fieldnames})
    return PlainTextResponse(content=output.getvalue(), media_type="text/csv")


@router.get("/export/vcf")
async def export_contacts_vcf(current_user: dict = Depends(get_current_user)):
    contacts = await db.contacts.find({"user_id": current_user["id"]}, {"_id": 0}).sort("name", 1).to_list(2000)
    contacts = [_with_compat_fields(c) for c in contacts]
    cards = []
    for c in contacts:
        cards.append(
            "\n".join(
                [
                    "BEGIN:VCARD",
                    "VERSION:3.0",
                    f"FN:{c.get('name', '')}",
                    f"N:{c.get('last_name', '')};{c.get('first_name', '')};;;",
                    f"EMAIL:{c.get('email', '')}",
                    f"TEL:{c.get('phone_number', '')}",
                    "END:VCARD",
                ]
            )
        )
    return PlainTextResponse(content="\n".join(cards), media_type="text/vcard")


@router.get("/{contact_id}")
async def get_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    contact = await db.contacts.find_one({"id": contact_id, "user_id": current_user["id"]}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return _with_compat_fields(contact)


@router.post("")
async def create_contact(payload: ContactCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    phone = doc.get("mobile_phone") or doc.get("phone_number") or ""
    doc["mobile_phone"] = phone
    doc["phone_number"] = phone
    doc.update(
        {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "name": _contact_name(payload),
            "organization": doc.get("organization") or doc.get("company") or "",
            "created_at": now,
            "updated_at": now,
        }
    )
    await db.contacts.insert_one(doc)
    doc.pop("_id", None)
    return _with_compat_fields(doc)


@router.put("/{contact_id}")
async def update_contact(contact_id: str, payload: ContactUpdate, current_user: dict = Depends(get_current_user)):
    update_data = payload.model_dump()
    phone = update_data.get("mobile_phone") or update_data.get("phone_number") or ""
    update_data["mobile_phone"] = phone
    update_data["phone_number"] = phone
    update_data["name"] = _contact_name(payload)
    update_data["organization"] = update_data.get("organization") or update_data.get("company") or ""
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.contacts.update_one(
        {"id": contact_id, "user_id": current_user["id"]},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    updated = await db.contacts.find_one({"id": contact_id, "user_id": current_user["id"]}, {"_id": 0})
    return _with_compat_fields(updated)


@router.delete("/{contact_id}")
async def delete_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.contacts.delete_one({"id": contact_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"status": "deleted"}


@router.post("/import")
async def import_contacts(
    request: Request,
    file: Optional[UploadFile] = File(default=None),
    current_user: dict = Depends(get_current_user),
):
    now = datetime.now(timezone.utc).isoformat()
    created = 0
    skipped = 0
    errors = []
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        body = await request.json()
        items = body.get("contacts", []) or []
        skip_duplicates = body.get("skip_duplicates", True)

        for item in items:
            try:
                phone = item.get("phone_number") or item.get("mobile_phone") or ""
                email = item.get("email", "")

                if skip_duplicates:
                    duplicate_clauses = []
                    if phone:
                        duplicate_clauses.extend([
                            {"phone_number": phone},
                            {"mobile_phone": phone},
                        ])
                    if email:
                        duplicate_clauses.append({"email": email})
                    if duplicate_clauses:
                        exists = await db.contacts.find_one({
                            "user_id": current_user["id"],
                            "$or": duplicate_clauses,
                        })
                        if exists:
                            skipped += 1
                            continue

                name = (item.get("name") or "").strip()
                first_name = item.get("first_name", "")
                last_name = item.get("last_name", "")
                if not name:
                    name = f"{first_name} {last_name}".strip() or "Unknown"

                doc = {
                    "id": str(uuid.uuid4()),
                    "user_id": current_user["id"],
                    "name": name,
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "phone_number": phone,
                    "mobile_phone": phone,
                    "organization": item.get("organization") or item.get("company") or "",
                    "status": item.get("status", "active"),
                    "notes": item.get("notes", ""),
                    "created_at": now,
                    "updated_at": now,
                }
                await db.contacts.insert_one(doc)
                created += 1
            except Exception as exc:
                errors.append(str(exc))

        return {"success": True, "imported": created, "skipped": skipped, "errors": errors}

    if not file:
        raise HTTPException(status_code=400, detail="No import content provided")

    content = (await file.read()).decode("utf-8", errors="ignore")

    if file.filename.lower().endswith(".csv"):
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            name = row.get("name") or f"{row.get('first_name', '')} {row.get('last_name', '')}".strip()
            phone = row.get("phone_number", row.get("mobile_phone", row.get("phone", "")))
            doc = {
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "name": name,
                "first_name": row.get("first_name", ""),
                "last_name": row.get("last_name", ""),
                "email": row.get("email", ""),
                "phone_number": phone,
                "mobile_phone": phone,
                "organization": row.get("organization", ""),
                "status": row.get("status", "active"),
                "notes": row.get("notes", ""),
                "created_at": now,
                "updated_at": now,
            }
            await db.contacts.insert_one(doc)
            created += 1
    else:
        raise HTTPException(status_code=400, detail="Supported import format: CSV")

    return {"success": True, "imported": created, "skipped": skipped, "errors": errors}
