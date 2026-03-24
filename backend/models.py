from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone
import uuid

# ============ PRODUCT MODELS ============

class ProductLocation:
    CAVE_CITY_PAWN = "cave_city_pawn"
    ALABAMA_PAWN_STORAGE = "alabama_pawn_storage"
    BOTH = "both"

class ProductBase(BaseModel):
    name: str
    description: str
    category: str
    categories: List[str] = []
    price: float
    wholesale_price: Optional[float] = None
    original_price: Optional[float] = None
    image: Optional[str] = ""  # Made optional with default empty string
    images: List[str] = []  # Multiple images support
    condition: str = "Good"
    in_stock: bool = True
    is_visible: bool = True  # Controls visibility on live site (hidden products only visible to logged-in users)
    quantity: int = 1
    sku: Optional[str] = None
    weight: Optional[float] = None
    tags: List[str] = []
    location: str = ProductLocation.ALABAMA_PAWN_STORAGE
    # Extended fields
    brand: Optional[str] = None
    manufacturer: Optional[str] = None
    upc: Optional[str] = None
    mpn: Optional[str] = None
    cost_price: Optional[float] = None
    track_quantity: bool = False
    requires_shipping: bool = True
    free_shipping: bool = False
    shipping_weight: Optional[float] = None
    shipping_length: Optional[float] = None
    shipping_width: Optional[float] = None
    shipping_height: Optional[float] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_url: Optional[str] = None
    related_products: List[str] = []
    has_options: bool = False
    custom_fields_data: Optional[dict] = None  # Stores values for category custom fields

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    categories: Optional[List[str]] = None
    price: Optional[float] = None
    wholesale_price: Optional[float] = None
    original_price: Optional[float] = None
    image: Optional[str] = None
    images: Optional[List[str]] = None
    condition: Optional[str] = None
    in_stock: Optional[bool] = None
    is_visible: Optional[bool] = None
    quantity: Optional[int] = None
    sku: Optional[str] = None
    weight: Optional[float] = None
    tags: Optional[List[str]] = None
    location: Optional[str] = None
    brand: Optional[str] = None
    manufacturer: Optional[str] = None
    upc: Optional[str] = None
    mpn: Optional[str] = None
    cost_price: Optional[float] = None
    track_quantity: Optional[bool] = None
    requires_shipping: Optional[bool] = None
    free_shipping: Optional[bool] = None
    shipping_weight: Optional[float] = None
    shipping_length: Optional[float] = None
    shipping_width: Optional[float] = None
    shipping_height: Optional[float] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_url: Optional[str] = None
    related_products: Optional[List[str]] = None
    has_options: Optional[bool] = None
    custom_fields_data: Optional[dict] = None

class Product(ProductBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sold_count: int = 0

# ============ CATEGORY MODELS ============

class CustomFieldOption(BaseModel):
    label: str
    value: str

class CustomField(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # Field name (e.g., "caliber", "metal_type")
    label: str  # Display label (e.g., "Caliber", "Metal Type")
    field_type: str  # text, number, select, multi_select, textarea
    required: bool = False
    options: Optional[List[CustomFieldOption]] = None  # For select/multi_select types
    placeholder: Optional[str] = None
    default_value: Optional[str] = None
    help_text: Optional[str] = None

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    product_info_url: Optional[str] = None
    shop_target_url: Optional[str] = None
    parent_id: Optional[str] = None
    sort_order: int = 0
    is_enabled: bool = True
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_url: Optional[str] = None
    custom_fields: Optional[List[CustomField]] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ ORDER MODELS ============

class OrderItem(BaseModel):
    product_id: str
    product_name: Optional[str] = None  # Make optional for new checkout orders
    name: Optional[str] = None  # Support both field names
    price: float
    quantity: int
    image: Optional[str] = None
    item_type: str = "product"  # product, storage, service
    selected_strength: Optional[str] = None  # New checkout fields
    selected_package: Optional[str] = None
    selected_options: Optional[List[dict]] = None
    custom_image_url: Optional[str] = None
    custom_notes: Optional[str] = None

class ShippingAddress(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    firstName: Optional[str] = None  # Support new checkout format
    lastName: Optional[str] = None
    address: Optional[str] = None
    address1: Optional[str] = None  # Support new checkout format
    address2: Optional[str] = None
    city: str
    state: str
    zip_code: Optional[str] = None
    zipCode: Optional[str] = None  # Support new checkout format
    phone: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    country: Optional[str] = "US"
    specialInstructions: Optional[str] = None

class OrderBase(BaseModel):
    customer_email: Optional[str] = ""  # Allow empty for POS orders
    customer_name: str
    items: List[OrderItem]
    shipping_address: Optional[ShippingAddress] = None  # Make optional
    shipping: Optional[dict] = None  # Support new checkout format
    billing: Optional[dict] = None
    subtotal: float
    tax: float
    total: float
    shipping_cost: Optional[float] = 0.0
    payment_method: str = "card"
    notes: Optional[str] = None
    is_recurring: Optional[bool] = False
    recurring_interval_days: Optional[int] = 30  # 30, 60, 90 days

class OrderCreate(OrderBase):
    pass

class OrderStatus:
    PENDING = "pending"
    AWAITING_PAYMENT = "awaiting_payment"  # New for CashApp/Venmo
    PAID = "paid"  # New for confirmed payments
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class Order(OrderBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = Field(default_factory=lambda: f"ORD-{uuid.uuid4().hex[:8].upper()}")
    status: str = OrderStatus.PENDING
    payment_status: Optional[str] = "pending"  # pending, captured, refunded
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    paid_at: Optional[datetime] = None  # When payment was confirmed
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    tracking_number: Optional[str] = None
    last_recurring_invoice_at: Optional[datetime] = None  # Track when last invoice was sent
    recurring_invoice_count: Optional[int] = 0  # How many recurring invoices sent

class OrderStatusUpdate(BaseModel):
    status: str
    tracking_number: Optional[str] = None
    notes: Optional[str] = None

# ============ CUSTOMER MODELS ============

class CustomerBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

class Customer(CustomerBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    total_orders: int = 0
    total_spent: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_order_at: Optional[datetime] = None

# ============ DISCOUNT/COUPON MODELS ============

class DiscountType:
    PERCENTAGE = "percentage"
    FIXED = "fixed"

class DiscountBase(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str = DiscountType.PERCENTAGE
    value: float  # percentage or fixed amount
    min_order_amount: Optional[float] = None
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True

class DiscountCreate(DiscountBase):
    pass

class Discount(DiscountBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    times_used: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ ANALYTICS MODELS ============

class SalesStats(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    total_customers: int
    total_products: int
    low_stock_count: int
    pending_orders: int
    revenue_today: float
    orders_today: int

class SalesByPeriod(BaseModel):
    period: str
    revenue: float
    orders: int

class TopProduct(BaseModel):
    id: str
    name: str
    sold_count: int
    revenue: float
    image: Optional[str] = None
