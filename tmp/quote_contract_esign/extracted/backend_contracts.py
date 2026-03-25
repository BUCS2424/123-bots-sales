@api_router.get("/contract-templates")
async def get_contract_templates(current_user: dict = Depends(get_current_user)):
    """Get all contract templates"""
    templates = await db.contract_templates.find({}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    return {"templates": templates, "document_types": DOCUMENT_TYPES}

@api_router.post("/contract-templates")
async def create_contract_template(data: ContractTemplateCreate, admin: dict = Depends(get_super_admin)):
    """Create a new contract template"""
    template = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "content": data.content,
        "description": data.description,
        "document_type": data.document_type,
        "is_default": data.is_default,
        "is_required": data.is_required,
        "sort_order": data.sort_order,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # If this is default, unset other defaults
    if data.is_default:
        await db.contract_templates.update_many({}, {"$set": {"is_default": False}})
    
    await db.contract_templates.insert_one(template)
    return {"success": True, "template": {k: v for k, v in template.items() if k != "_id"}}

@api_router.put("/contract-templates/{template_id}")
async def update_contract_template(template_id: str, data: ContractTemplateCreate, admin: dict = Depends(get_super_admin)):
    """Update a contract template"""
    if data.is_default:
        await db.contract_templates.update_many({}, {"$set": {"is_default": False}})
    
    await db.contract_templates.update_one(
        {"id": template_id},
        {"$set": {
            "name": data.name,
            "content": data.content,
            "description": data.description,
            "document_type": data.document_type,
            "is_default": data.is_default,
            "is_required": data.is_required,
            "sort_order": data.sort_order,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"success": True}

@api_router.delete("/contract-templates/{template_id}")
async def delete_contract_template(template_id: str, admin: dict = Depends(get_super_admin)):
    """Delete a contract template"""
    await db.contract_templates.delete_one({"id": template_id})
    return {"success": True}


# ============ Signed Contract Books (Immutable Storage) ============

class SignedContractBook(BaseModel):
    """Signed contract book - IMMUTABLE once created"""
    client_id: str
    client_name: str
    quote_id: str
    quote_name: str
    documents: List[Dict[str, Any]]  # List of signed documents with signatures
    total_documents: int
    signed_at: str
    signer_name: str
    signer_email: str
    signer_ip: str

class SuperAdminDeleteRequest(BaseModel):
    """Request to delete contract book (super admin only with password)"""
    admin_password: str

@api_router.get("/signed-contract-books")
async def get_signed_contract_books(current_user: dict = Depends(get_current_user)):
    """Get all signed contract books"""
    books = await db.signed_contract_books.find({}, {"_id": 0}).sort("signed_at", -1).to_list(1000)
    return {"books": books}

@api_router.get("/signed-contract-books/{book_id}")
async def get_signed_contract_book(book_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific signed contract book"""
    book = await db.signed_contract_books.find_one({"id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Contract book not found")
    return {"book": book}

@api_router.get("/signed-contract-books/client/{client_id}")
async def get_client_contract_books(client_id: str, current_user: dict = Depends(get_current_user)):
    """Get all signed contract books for a client"""
    books = await db.signed_contract_books.find({"client_id": client_id}, {"_id": 0}).sort("signed_at", -1).to_list(100)
    return {"books": books}

@api_router.delete("/signed-contract-books/{book_id}")
async def delete_signed_contract_book(book_id: str, data: SuperAdminDeleteRequest, admin: dict = Depends(get_super_admin)):
    """Delete a signed contract book - ONLY with super admin password verification"""
    # Verify super admin password
    super_user = await db.users.find_one({"email": SUPER_USER_EMAIL})
    if not super_user or not verify_password(data.admin_password, super_user["password_hash"]):
        raise HTTPException(status_code=403, detail="Invalid super admin password")
    
    result = await db.signed_contract_books.delete_one({"id": book_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contract book not found")
    
    # Log the deletion for audit
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "contract_book_deleted",
        "book_id": book_id,
        "deleted_by": admin["email"],
        "deleted_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "message": "Contract book permanently deleted"}


# ============ Public Quote Signing (No Auth Required) ============

class PublicSignatureRequest(BaseModel):
    signer_name: str
    signer_email: EmailStr
    document_signatures: List[Dict[str, str]]  # List of {document_id, signature_data}

