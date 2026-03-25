# ── A2G Contacts Backend Routes ──────────────────────────────────────────────
# FastAPI + Motor (async MongoDB) + Pydantic v2

class ContactCreate(BaseModel):
    # Core (backward compat)
    name: str = ""
    phone_number: str = ""
    email: str = ""
    notes: str = ""
    # Name fields
    first_name: str = ""
    last_name: str = ""
    display_name: str = ""
    nickname: str = ""
    gender: str = ""
    # Emails
    email2: str = ""
    email3: str = ""
    # Phones
    mobile_phone: str = ""
    home_phone: str = ""
    business_phone: str = ""
    home_fax: str = ""
    business_fax: str = ""
    pager: str = ""
    # Work
    organization: str = ""
    job_title: str = ""
    department: str = ""
    # Address
    street: str = ""
    address2: str = ""
    city: str = ""
    state: str = ""
    postal_code: str = ""
    # CRM
    contact_type: str = ""  # buyer, seller, lender, vendor
    status: str = "active"
    grade: str = ""
    tags: List[str] = []
    lead_score: str = ""
    budget: str = ""
    assigned_to: str = ""
    source: str = ""
    birthdate: str = ""
    updated_at: Optional[str] = None

class ContactResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    name: str
    phone_number: str
    email: str
    notes: str = ""
    created_at: str
    # Extended
    first_name: str = ""
    last_name: str = ""
    display_name: str = ""
    nickname: str = ""
    gender: str = ""
    email2: str = ""
    email3: str = ""
    mobile_phone: str = ""
    home_phone: str = ""
    business_phone: str = ""
    home_fax: str = ""
    business_fax: str = ""
    pager: str = ""
    organization: str = ""
    job_title: str = ""
    department: str = ""
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
    updated_at: str = ""

class MessageSend(BaseModel):
    to: str
    text: str

class CallLogCreate(BaseModel):
    remote_number: str
    direction: str  # inbound, outbound
    duration: int = 0
    status: str = "completed"
    recording_url: Optional[str] = None

class CallLogResponse(BaseModel):
    id: str
    remote_number: str
    direction: str
    duration: int
    status: str
    created_at: str
    contact_name: Optional[str] = None
    notes: Optional[str] = None
    transcript: Optional[str] = None
    recording_url: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    from_number: str
    to_number: str
    text: str
    direction: str
    status: str
    created_at: str

class SmsProviderTelnyx(BaseModel):
    enabled: bool = True
    api_key: str = ""
    phone_number: str = ""
    messaging_profile_id: str = ""

class SmsProviderTwilio(BaseModel):
    enabled: bool = False
    account_sid: str = ""
    auth_token: str = ""
    phone_number: str = ""

class SmsProviderVonage(BaseModel):
    enabled: bool = False
    api_key: str = ""
    api_secret: str = ""
    phone_number: str = ""

class SmsProviderTextbelt(BaseModel):
    enabled: bool = False
    api_key: str = ""
    api_url: str = "https://textbelt.com/text"  # Can be self-hosted

class SmsProviderTextbeltOS(BaseModel):
    """Textbelt Open Source - uses carrier email-to-SMS gateways (free)"""
    enabled: bool = False
    server_url: str = "http://localhost:9090/text"  # Self-hosted server URL
    # SMTP settings for the self-hosted server
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""
    smtp_secure: bool = True  # Use TLS

class SmsProviderTextbeltSelf(BaseModel):
    """Self-hosted Textbelt server from GitHub"""
    enabled: bool = False
    server_url: str = ""  # e.g., https://your-server.com/text
    api_key: str = ""  # Optional API key if configured

class SmsProviderPythonGateway(BaseModel):
    """Python Email-to-SMS Gateway (uses SMTP config from textbelt settings)"""
    enabled: bool = False
    use_smtp_config: bool = True  # Uses SMTP config from Textbelt Server section

class SmsProviderSettings(BaseModel):
    active_provider: str = "python_gateway"
    telnyx: SmsProviderTelnyx = SmsProviderTelnyx()
    twilio: SmsProviderTwilio = SmsProviderTwilio()
    vonage: SmsProviderVonage = SmsProviderVonage()
    textbelt: SmsProviderTextbelt = SmsProviderTextbelt()
    textbelt_os: SmsProviderTextbeltOS = SmsProviderTextbeltOS()
    textbelt_self: SmsProviderTextbeltSelf = SmsProviderTextbeltSelf()
    python_gateway: SmsProviderPythonGateway = SmsProviderPythonGateway()

# ========================
# AUTH HELPERS
# ========================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ========================
# INITIALIZE DEFAULT ADMIN
# ========================
@app.on_event("startup")
async def create_default_admin():
    admin_email = "mel@a2gdesigns.com"
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": get_password_hash("BigDaddy2016!!"),
            "name": "Mel Admin",
            "extension": "100",
            "is_admin": True,
            "is_protected": True,  # Cannot be deleted
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info("Default admin user created")

# ========================
# AUTH ROUTES
# ========================
@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user["id"], "email": user["email"]})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user.get("name", ""),
            extension=user.get("extension", ""),
            is_admin=user.get("is_admin", False),
            created_at=user.get("created_at", "")
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user.get("name", ""),
        extension=current_user.get("extension", ""),
        is_admin=current_user.get("is_admin", False),
        created_at=current_user.get("created_at", "")
    )

# ========================
# USER MANAGEMENT (Admin Only)
# ========================
@api_router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    return [UserResponse(
        id=u["id"],
        email=u["email"],
        name=u.get("name", ""),
        extension=u.get("extension", ""),
        is_admin=u.get("is_admin", False),
        created_at=u.get("created_at", "")
    ) for u in users]

@api_router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "name": user_data.name,
        "extension": user_data.extension,
        "is_admin": user_data.is_admin,
        "is_protected": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)
    
    return UserResponse(
        id=new_user["id"],
        email=new_user["email"],
        name=new_user["name"],
