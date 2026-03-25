@api_router.post("/signatures")
async def create_signature(data: SignatureCreate, current_user: dict = Depends(get_current_user)):
    signature = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "signed_at": datetime.now(timezone.utc).isoformat(),
        "ip_address": None,  # Would capture in production
        "verified": True
    }
    
    await db.signatures.insert_one(signature)
    signature.pop("_id", None)
    return {"success": True, "signature": signature}

@api_router.get("/signatures")
async def get_signatures(document_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if document_id:
        query["document_id"] = document_id
    
    signatures = await db.signatures.find(query, {"_id": 0}).to_list(1000)
    return signatures


# ============ Contract Templates ============

DOCUMENT_TYPES = [
