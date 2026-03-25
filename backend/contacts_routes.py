from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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
    notes: str = ""


class ContactUpdate(ContactCreate):
    pass


def _contact_name(payload: ContactCreate) -> str:
    if payload.name.strip():
        return payload.name.strip()
    return f"{payload.first_name} {payload.last_name}".strip()


@router.get("")
async def list_contacts(current_user: dict = Depends(get_current_user)):
    contacts = await db.contacts.find({"user_id": current_user["id"]}, {"_id": 0}).sort("name", 1).to_list(2000)
    return contacts


@router.get("/{contact_id}")
async def get_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    contact = await db.contacts.find_one({"id": contact_id, "user_id": current_user["id"]}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.post("")
async def create_contact(payload: ContactCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc.update(
        {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "name": _contact_name(payload),
            "created_at": now,
            "updated_at": now,
        }
    )
    await db.contacts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/{contact_id}")
async def update_contact(contact_id: str, payload: ContactUpdate, current_user: dict = Depends(get_current_user)):
    update_data = payload.model_dump()
    update_data["name"] = _contact_name(payload)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.contacts.update_one(
        {"id": contact_id, "user_id": current_user["id"]},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    updated = await db.contacts.find_one({"id": contact_id, "user_id": current_user["id"]}, {"_id": 0})
    return updated


@router.delete("/{contact_id}")
async def delete_contact(contact_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.contacts.delete_one({"id": contact_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"status": "deleted"}


@router.get("/export")
async def export_contacts_json(current_user: dict = Depends(get_current_user)):
    return await list_contacts(current_user)


@router.get("/export/csv")
async def export_contacts_csv(current_user: dict = Depends(get_current_user)):
    contacts = await list_contacts(current_user)
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["id", "name", "email", "mobile_phone", "organization", "status", "created_at"])
    writer.writeheader()
    for c in contacts:
        writer.writerow({k: c.get(k, "") for k in writer.fieldnames})
    return PlainTextResponse(content=output.getvalue(), media_type="text/csv")


@router.get("/export/vcf")
async def export_contacts_vcf(current_user: dict = Depends(get_current_user)):
    contacts = await list_contacts(current_user)
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
                    f"TEL:{c.get('mobile_phone', '')}",
                    "END:VCARD",
                ]
            )
        )
    return PlainTextResponse(content="\n".join(cards), media_type="text/vcard")


@router.post("/import")
async def import_contacts(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    content = (await file.read()).decode("utf-8", errors="ignore")
    now = datetime.now(timezone.utc).isoformat()
    created = 0

    if file.filename.lower().endswith(".csv"):
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            name = row.get("name") or f"{row.get('first_name', '')} {row.get('last_name', '')}".strip()
            doc = {
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "name": name,
                "first_name": row.get("first_name", ""),
                "last_name": row.get("last_name", ""),
                "email": row.get("email", ""),
                "mobile_phone": row.get("mobile_phone", row.get("phone", "")),
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

    return {"success": True, "imported": created}
