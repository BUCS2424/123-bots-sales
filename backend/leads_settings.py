"""
LEADS Reporting Settings API
Stores credentials and toggle configuration for Alabama LEADS and LeadsOnline.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/leads-settings", tags=["LEADS Settings"])

db = None

def set_database(database):
    global db
    db = database

SETTINGS_KEY = "leads_config"

class LeadsLocalConfig(BaseModel):
    enabled: bool = False
    api_url: Optional[str] = ""
    api_key: Optional[str] = ""
    agency_ori: Optional[str] = ""
    username: Optional[str] = ""
    password: Optional[str] = ""
    report_pawn_transactions: bool = True
    report_buy_transactions: bool = True
    report_firearm_transactions: bool = True
    auto_submit: bool = False

class LeadsNationalConfig(BaseModel):
    enabled: bool = False
    api_url: Optional[str] = ""
    api_key: Optional[str] = ""
    account_id: Optional[str] = ""
    username: Optional[str] = ""
    password: Optional[str] = ""
    report_pawn_transactions: bool = True
    report_buy_transactions: bool = True
    report_firearm_transactions: bool = True
    auto_submit: bool = False

class LeadsSettingsUpdate(BaseModel):
    local: LeadsLocalConfig
    national: LeadsNationalConfig


@router.get("")
async def get_leads_settings():
    """Get LEADS reporting settings"""
    doc = await db.system_settings.find_one({"key": SETTINGS_KEY}, {"_id": 0})
    if not doc:
        return {
            "key": SETTINGS_KEY,
            "local": LeadsLocalConfig().model_dump(),
            "national": LeadsNationalConfig().model_dump(),
            "updated_at": None
        }
    return doc


@router.put("")
async def update_leads_settings(settings: LeadsSettingsUpdate):
    """Update LEADS reporting settings"""
    data = {
        "key": SETTINGS_KEY,
        "local": settings.local.model_dump(),
        "national": settings.national.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.system_settings.update_one(
        {"key": SETTINGS_KEY},
        {"$set": data},
        upsert=True
    )
    return data
