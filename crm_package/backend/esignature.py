"""
E-Signature Module
Handles electronic signatures for Peptides, Storage, and RV service contracts
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import base64

router = APIRouter(prefix="/esignature", tags=["E-Signature"])

# Database reference
db = None

def set_database(database):
    global db
    db = database

# ============ MODELS ============

class SignatureData(BaseModel):
    signature_image: str  # Base64 encoded signature image
    signature_type: str = "draw"  # draw, type, upload
    typed_name: Optional[str] = None  # If type signature
    signer_name: str
    signer_email: Optional[str] = ""
    signer_phone: Optional[str] = ""
    signer_ip: Optional[str] = ""
    device_info: Optional[str] = ""

class ContractSignRequest(BaseModel):
    contract_type: str  # pawn, storage, rv_service
    contract_id: str
    contract_number: str
    contract_data: Dict  # The full contract data to be signed
    signature: SignatureData
    witness_signature: Optional[SignatureData] = None
    print_requested: bool = False
    notes: Optional[str] = ""

class SignatureTemplateCreate(BaseModel):
    name: str
    contract_type: str  # pawn, storage, rv_service
    content: str  # HTML/Markdown template content
    required_fields: List[str] = []
    legal_text: str = ""
    is_active: bool = True

class ContractPrintRequest(BaseModel):
    signed_contract_id: str
    include_signature: bool = True
    copies: int = 1

# ============ HELPERS ============

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc

def generate_signature_id():
    """Generate unique signature ID"""
    return f"SIG-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8].upper()}"

def generate_document_hash(contract_data: dict) -> str:
    """Generate a hash of contract data for integrity verification"""
    import hashlib
    import json
    content = json.dumps(contract_data, sort_keys=True, default=str)
    return hashlib.sha256(content.encode()).hexdigest()[:16]

# ============ SIGNATURE ROUTES ============

@router.post("/sign")
async def sign_contract(request: ContractSignRequest):
    """Sign a contract electronically"""
    now = datetime.now(timezone.utc)
    signature_id = generate_signature_id()
    document_hash = generate_document_hash(request.contract_data)
    
    # Create signed contract record
    signed_contract = {
        "signature_id": signature_id,
        "contract_type": request.contract_type,
        "contract_id": request.contract_id,
        "contract_number": request.contract_number,
        "contract_data": request.contract_data,
        "document_hash": document_hash,
        
        # Primary signature
        "signature": {
            "image": request.signature.signature_image,
            "type": request.signature.signature_type,
            "typed_name": request.signature.typed_name,
            "signer_name": request.signature.signer_name,
            "signer_email": request.signature.signer_email,
            "signer_phone": request.signature.signer_phone,
            "signer_ip": request.signature.signer_ip,
            "device_info": request.signature.device_info,
            "signed_at": now,
        },
        
        # Witness signature (optional)
        "witness_signature": None,
        
        "print_requested": request.print_requested,
        "printed_at": None,
        "print_count": 0,
        "notes": request.notes,
        "status": "signed",
        "created_at": now,
        "updated_at": now,
    }
    
    # Add witness signature if provided
    if request.witness_signature:
        signed_contract["witness_signature"] = {
            "image": request.witness_signature.signature_image,
            "type": request.witness_signature.signature_type,
            "typed_name": request.witness_signature.typed_name,
            "signer_name": request.witness_signature.signer_name,
            "signed_at": now,
        }
    
    await db.signed_contracts.insert_one(signed_contract)
    
    # Update the original contract with signature reference
    collection_map = {
        "pawn": "pawn_contracts",
        "storage": "storage_rentals",
        "rv_service": "rv_service_orders"
    }
    
    if request.contract_type in collection_map:
        try:
            await db[collection_map[request.contract_type]].update_one(
                {"_id": ObjectId(request.contract_id)},
                {
                    "$set": {
                        "signature_id": signature_id,
                        "signed_at": now,
                        "signer_name": request.signature.signer_name,
                        "is_signed": True
                    }
                }
            )
        except Exception as e:
            print(f"Warning: Could not update original contract: {e}")
    
    return {
        "success": True,
        "signature_id": signature_id,
        "document_hash": document_hash,
        "signed_at": now.isoformat(),
        "message": "Contract signed successfully"
    }

@router.get("/contract/{signature_id}")
async def get_signed_contract(signature_id: str):
    """Get a signed contract by signature ID"""
    contract = await db.signed_contracts.find_one({"signature_id": signature_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Signed contract not found")
    
    return serialize_doc(contract)

@router.get("/contracts")
async def list_signed_contracts(
    contract_type: str = "",
    limit: int = 50,
    skip: int = 0
):
    """List signed contracts with optional filtering"""
    query = {}
    if contract_type:
        query["contract_type"] = contract_type
    
    cursor = db.signed_contracts.find(query).sort("created_at", -1).skip(skip).limit(limit)
    
    contracts = []
    async for contract in cursor:
        # Don't return full signature images in list
        contract.pop("signature", None)
        contract.pop("witness_signature", None)
        contract.pop("contract_data", None)
        contracts.append(serialize_doc(contract))
    
    total = await db.signed_contracts.count_documents(query)
    
    return {
        "contracts": contracts,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@router.post("/print/{signature_id}")
async def mark_contract_printed(signature_id: str, copies: int = 1):
    """Mark a signed contract as printed"""
    now = datetime.now(timezone.utc)
    
    result = await db.signed_contracts.update_one(
        {"signature_id": signature_id},
        {
            "$set": {"printed_at": now, "updated_at": now},
            "$inc": {"print_count": copies}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Signed contract not found")
    
    return {"success": True, "message": f"Contract marked as printed ({copies} copies)"}

@router.get("/verify/{signature_id}")
async def verify_signature(signature_id: str):
    """Verify a signature and contract integrity"""
    contract = await db.signed_contracts.find_one({"signature_id": signature_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Signed contract not found")
    
    # Recalculate hash to verify integrity
    current_hash = generate_document_hash(contract["contract_data"])
    stored_hash = contract.get("document_hash", "")
    
    is_valid = current_hash == stored_hash
    
    return {
        "signature_id": signature_id,
        "is_valid": is_valid,
        "contract_type": contract["contract_type"],
        "contract_number": contract["contract_number"],
        "signer_name": contract["signature"]["signer_name"],
        "signed_at": contract["signature"]["signed_at"].isoformat() if isinstance(contract["signature"]["signed_at"], datetime) else contract["signature"]["signed_at"],
        "document_hash": stored_hash,
        "integrity_check": "PASSED" if is_valid else "FAILED - Document may have been modified"
    }

# ============ SIGNATURE TEMPLATE ROUTES ============

@router.post("/templates")
async def create_template(template: SignatureTemplateCreate):
    """Create a contract template"""
    template_data = template.dict()
    template_data["created_at"] = datetime.now(timezone.utc)
    template_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.signature_templates.insert_one(template_data)
    
    return {"success": True, "id": str(result.inserted_id), "message": "Template created"}

@router.get("/templates")
async def list_templates(contract_type: str = "", active_only: bool = True):
    """List signature templates"""
    query = {}
    if contract_type:
        query["contract_type"] = contract_type
    if active_only:
        query["is_active"] = True
    
    cursor = db.signature_templates.find(query).sort("name", 1)
    
    templates = []
    async for template in cursor:
        templates.append(serialize_doc(template))
    
    return templates

@router.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Get a specific template"""
    template = await db.signature_templates.find_one({"_id": ObjectId(template_id)})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return serialize_doc(template)

@router.put("/templates/{template_id}")
async def update_template(template_id: str, template: SignatureTemplateCreate):
    """Update a template"""
    template_data = template.dict()
    template_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.signature_templates.update_one(
        {"_id": ObjectId(template_id)},
        {"$set": template_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"success": True, "message": "Template updated"}

@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """Delete a template (soft delete by deactivating)"""
    result = await db.signature_templates.update_one(
        {"_id": ObjectId(template_id)},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"success": True, "message": "Template deactivated"}

# ============ DEFAULT TEMPLATES ============

@router.post("/templates/seed-defaults")
async def seed_default_templates():
    """Create default contract templates for all 3 business types"""
    templates = [
        {
            "name": "Peptides Contract Agreement",
            "contract_type": "pawn",
            "content": """
# PAWN CONTRACT AGREEMENT

**123 Bots**
7860 Eddins Road, Dothan, Alabama 36301

---

**Contract Number:** {{contract_number}}
**Date:** {{date}}
**Ticket Number:** {{ticket_number}}

## BORROWER INFORMATION
- **Name:** {{customer_name}}
- **Driver's License:** {{customer_dl}}
- **Address:** {{customer_address}}
- **Phone:** {{customer_phone}}

## PLEDGED ITEM(S)
{{#each items}}
- **Description:** {{description}}
- **Category:** {{category}}
- **Serial Number:** {{serial_number}}
- **Condition:** {{condition}}
{{/each}}

## LOAN TERMS
- **Loan Amount:** ${{loan_amount}}
- **Interest Rate:** {{interest_rate}}% per month
- **Loan Term:** {{loan_term_days}} days
- **Due Date:** {{due_date}}
- **Payoff Amount:** ${{payoff_amount}}

## TERMS AND CONDITIONS
1. The Pledgor hereby pawns the above-described property to secure a loan.
2. The Pledgor may redeem the pledged property by paying the full payoff amount on or before the due date.
3. If the Pledgor fails to redeem the property by the due date, ownership transfers to 123 Bots.
4. Interest accrues monthly on the outstanding principal balance.
5. The Pledgor certifies they are the rightful owner of the pledged property.

## AGREEMENT
By signing below, I acknowledge that I have read, understand, and agree to all terms and conditions of this Peptides Contract.
            """,
            "required_fields": ["contract_number", "customer_name", "customer_dl", "loan_amount", "due_date"],
            "legal_text": "This agreement is governed by the laws of the State of Alabama.",
            "is_active": True
        },
        {
            "name": "Storage Rental Agreement",
            "contract_type": "storage",
            "content": """
# STORAGE UNIT RENTAL AGREEMENT

**123 Bots**
7860 Eddins Road, Dothan, Alabama 36301

---

**Agreement Number:** {{contract_number}}
**Date:** {{date}}

## TENANT INFORMATION
- **Name:** {{tenant_name}}
- **Driver's License:** {{tenant_dl}}
- **Address:** {{tenant_address}}
- **Phone:** {{tenant_phone}}
- **Email:** {{tenant_email}}

## STORAGE UNIT DETAILS
- **Unit Number:** {{unit_number}}
- **Size:** {{unit_size}}
- **Monthly Rate:** ${{monthly_rate}}
- **Move-in Date:** {{move_in_date}}

## PAYMENT TERMS
- **Monthly Rent:** ${{monthly_rate}}
- **Due Date:** {{due_day}} of each month
- **Late Fee:** ${{late_fee}} if paid after the 5th

## TERMS AND CONDITIONS
1. Tenant agrees to pay rent monthly in advance.
2. Tenant shall not store hazardous materials, illegal items, or perishables.
3. Tenant is responsible for their own insurance on stored items.
4. 123 Bots is not liable for loss, theft, or damage to stored items.
5. Tenant must provide 30 days notice to vacate.
6. Failure to pay rent may result in lien on stored property per Alabama law.

## AGREEMENT
By signing below, I acknowledge that I have read, understand, and agree to all terms and conditions of this Storage Rental Agreement.
            """,
            "required_fields": ["contract_number", "tenant_name", "tenant_dl", "unit_number", "monthly_rate"],
            "legal_text": "This agreement is governed by the laws of the State of Alabama and applicable self-storage lien laws.",
            "is_active": True
        },
        {
            "name": "RV Service Work Order",
            "contract_type": "rv_service",
            "content": """
# RV SERVICE WORK ORDER

**123 Bots - RV Repair & Restoration**
7860 Eddins Road, Dothan, Alabama 36301

---

**Work Order Number:** {{work_order_number}}
**Date:** {{date}}

## CUSTOMER INFORMATION
- **Name:** {{customer_name}}
- **Phone:** {{customer_phone}}
- **Email:** {{customer_email}}
- **Address:** {{customer_address}}

## VEHICLE INFORMATION
- **Year/Make/Model:** {{vehicle_info}}
- **VIN:** {{vin}}
- **License Plate:** {{license_plate}}
- **Mileage:** {{mileage}}

## REQUESTED SERVICES
{{#each services}}
- {{description}} - Est. ${{estimated_cost}}
{{/each}}

## ESTIMATE
- **Parts:** ${{parts_total}}
- **Labor:** ${{labor_total}}
- **Estimated Total:** ${{estimated_total}}

## AUTHORIZATION
1. Customer authorizes the above repairs/services.
2. Final cost may vary based on actual parts and labor required.
3. Customer will be contacted if costs exceed estimate by more than 10%.
4. Payment is due upon completion of services.
5. Vehicles not picked up within 30 days may be subject to storage fees.

## AGREEMENT
By signing below, I authorize 123 Bots to perform the services described above and agree to the terms and conditions.
            """,
            "required_fields": ["work_order_number", "customer_name", "vehicle_info", "estimated_total"],
            "legal_text": "Customer acknowledges receipt of this work order and authorizes repairs.",
            "is_active": True
        }
    ]
    
    for template in templates:
        # Check if already exists
        existing = await db.signature_templates.find_one({
            "name": template["name"],
            "contract_type": template["contract_type"]
        })
        
        if not existing:
            template["created_at"] = datetime.now(timezone.utc)
            template["updated_at"] = datetime.now(timezone.utc)
            await db.signature_templates.insert_one(template)
    
    return {"success": True, "message": "Default templates seeded", "count": len(templates)}

# ============ STATS ============

@router.get("/stats")
async def get_signature_stats():
    """Get e-signature statistics"""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    total_signed = await db.signed_contracts.count_documents({})
    signed_today = await db.signed_contracts.count_documents({"created_at": {"$gte": today}})
    
    # By contract type
    pawn_signed = await db.signed_contracts.count_documents({"contract_type": "pawn"})
    storage_signed = await db.signed_contracts.count_documents({"contract_type": "storage"})
    rv_signed = await db.signed_contracts.count_documents({"contract_type": "rv_service"})
    
    # Printed vs digital only
    printed = await db.signed_contracts.count_documents({"print_count": {"$gt": 0}})
    
    return {
        "total_signed": total_signed,
        "signed_today": signed_today,
        "by_type": {
            "pawn": pawn_signed,
            "storage": storage_signed,
            "rv_service": rv_signed
        },
        "printed": printed,
        "digital_only": total_signed - printed
    }
