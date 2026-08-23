"""
Storage Unit Rental System
Handles storage units, rentals, and Stripe payments for monthly/yearly subscriptions
"""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from stripe_checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)

load_dotenv()

# ============ MODELS ============

class StorageUnitSize(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "10x10"
    width: int  # in feet
    length: int  # in feet
    square_feet: int
    monthly_price: float
    yearly_price: float  # discounted yearly rate
    description: str
    climate_controlled: bool = False
    drive_up_access: bool = False
    floor_level: str = "ground"  # ground, upper
    total_units: int = 20
    available_units: int = 20
    features: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StorageUnitSizeCreate(BaseModel):
    name: str
    width: int
    length: int
    monthly_price: float
    yearly_price: float
    description: str
    climate_controlled: bool = False
    drive_up_access: bool = False
    floor_level: str = "ground"
    total_units: int = 20
    features: List[str] = []

class CustomerInfo(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str
    city: str
    state: str
    zip_code: str
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class StorageRental(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    unit_size_id: str
    unit_number: Optional[str] = None  # Assigned unit number
    customer: CustomerInfo
    billing_type: str  # "monthly" or "yearly"
    price: float
    access_code: Optional[str] = None  # Gate PIN
    start_date: str
    end_date: Optional[str] = None
    status: str = "pending"  # pending, active, expired, cancelled
    payment_status: str = "unpaid"  # unpaid, paid, failed
    stripe_session_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RentalCreateRequest(BaseModel):
    unit_size_id: str
    customer: CustomerInfo
    billing_type: str  # "monthly" or "yearly"
    origin_url: str  # Frontend origin for redirect URLs

class CheckoutRequest(BaseModel):
    rental_id: str
    origin_url: str


def get_storage_rental_router(db, require_admin):
    router = APIRouter(prefix="/api/storage-rentals")
    
    # ============ STORAGE UNIT SIZES ============
    
    @router.get("/sizes")
    async def get_storage_sizes():
        """Get all storage unit sizes (public)"""
        sizes = await db.storage_sizes.find({}, {"_id": 0}).to_list(100)
        return sizes
    
    @router.get("/sizes/{size_id}")
    async def get_storage_size(size_id: str):
        """Get a specific storage size"""
        size = await db.storage_sizes.find_one({"id": size_id}, {"_id": 0})
        if not size:
            raise HTTPException(status_code=404, detail="Storage size not found")
        return size
    
    @router.post("/sizes", response_model=StorageUnitSize)
    async def create_storage_size(size: StorageUnitSizeCreate, current_user = Depends(require_admin)):
        """Create a new storage unit size (admin only)"""
        size_dict = size.model_dump()
        size_dict["id"] = str(uuid.uuid4())
        size_dict["square_feet"] = size.width * size.length
        size_dict["available_units"] = size.total_units
        size_dict["created_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.storage_sizes.insert_one(size_dict)
        return size_dict
    
    @router.put("/sizes/{size_id}")
    async def update_storage_size(size_id: str, size: StorageUnitSizeCreate, current_user = Depends(require_admin)):
        """Update a storage unit size (admin only)"""
        existing = await db.storage_sizes.find_one({"id": size_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Storage size not found")
        
        update_data = size.model_dump()
        update_data["square_feet"] = size.width * size.length
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.storage_sizes.update_one({"id": size_id}, {"$set": update_data})
        updated = await db.storage_sizes.find_one({"id": size_id}, {"_id": 0})
        return updated
    
    @router.delete("/sizes/{size_id}")
    async def delete_storage_size(size_id: str, current_user = Depends(require_admin)):
        """Delete a storage unit size (admin only)"""
        result = await db.storage_sizes.delete_one({"id": size_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Storage size not found")
        return {"message": "Storage size deleted successfully"}
    
    # ============ RENTALS ============
    
    @router.get("/rentals")
    async def get_rentals(current_user = Depends(require_admin)):
        """Get all rentals (admin only)"""
        rentals = await db.storage_rentals.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
        return rentals
    
    @router.get("/rentals/{rental_id}")
    async def get_rental(rental_id: str):
        """Get a specific rental"""
        rental = await db.storage_rentals.find_one({"id": rental_id}, {"_id": 0})
        if not rental:
            raise HTTPException(status_code=404, detail="Rental not found")
        return rental
    
    @router.post("/rentals")
    async def create_rental(request: RentalCreateRequest):
        """Create a new rental and initiate Stripe checkout"""
        # Get the storage size
        size = await db.storage_sizes.find_one({"id": request.unit_size_id})
        if not size:
            raise HTTPException(status_code=404, detail="Storage size not found")
        
        # Check availability
        if size.get("available_units", 0) <= 0:
            raise HTTPException(status_code=400, detail="No units available for this size")
        
        # Calculate price based on billing type
        if request.billing_type == "yearly":
            price = size["yearly_price"]
        else:
            price = size["monthly_price"]
        
        # Generate access code (4-digit PIN)
        import random
        access_code = str(random.randint(1000, 9999))
        
        # Assign unit number
        active_rentals = await db.storage_rentals.count_documents({
            "unit_size_id": request.unit_size_id,
            "status": {"$in": ["pending", "active"]}
        })
        unit_number = f"{size['name']}-{str(active_rentals + 1).zfill(3)}"
        
        # Create rental record
        rental = StorageRental(
            unit_size_id=request.unit_size_id,
            unit_number=unit_number,
            customer=request.customer,
            billing_type=request.billing_type,
            price=price,
            access_code=access_code,
            start_date=datetime.now(timezone.utc).isoformat(),
            status="pending",
            payment_status="unpaid"
        )
        
        rental_dict = rental.model_dump()
        await db.storage_rentals.insert_one(rental_dict)
        
        # Initialize Stripe
        api_key = os.environ.get("STRIPE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Payment system not configured")
        
        # Create checkout session
        success_url = f"{request.origin_url}/storage/success?session_id={{CHECKOUT_SESSION_ID}}&rental_id={rental.id}"
        cancel_url = f"{request.origin_url}/storage?cancelled=true"
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=f"{request.origin_url}/api/webhook/stripe")
        
        checkout_request = CheckoutSessionRequest(
            amount=float(price),
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "rental_id": rental.id,
                "unit_size": size["name"],
                "billing_type": request.billing_type,
                "customer_email": request.customer.email
            }
        )
        
        try:
            session = await stripe_checkout.create_checkout_session(checkout_request)
            
            # Update rental with stripe session ID
            await db.storage_rentals.update_one(
                {"id": rental.id},
                {"$set": {"stripe_session_id": session.session_id}}
            )
            
            # Create payment transaction record
            transaction = {
                "id": str(uuid.uuid4()),
                "type": "storage_rental",
                "rental_id": rental.id,
                "amount": float(price),
                "currency": "usd",
                "session_id": session.session_id,
                "customer_email": request.customer.email,
                "payment_status": "initiated",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.payment_transactions.insert_one(transaction)
            
            return {
                "rental_id": rental.id,
                "checkout_url": session.url,
                "session_id": session.session_id
            }
            
        except Exception as e:
            # Clean up rental on failure
            await db.storage_rentals.delete_one({"id": rental.id})
            raise HTTPException(status_code=500, detail=f"Payment initialization failed: {str(e)}")
    
    @router.get("/checkout/status/{session_id}")
    async def get_checkout_status(session_id: str):
        """Get the status of a checkout session"""
        api_key = os.environ.get("STRIPE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Payment system not configured")
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
        
        try:
            status = await stripe_checkout.get_checkout_status(session_id)
            
            # Update rental and transaction if paid
            if status.payment_status == "paid":
                # Find and update rental
                rental = await db.storage_rentals.find_one({"stripe_session_id": session_id})
                if rental and rental.get("payment_status") != "paid":
                    # Update rental status
                    await db.storage_rentals.update_one(
                        {"stripe_session_id": session_id},
                        {"$set": {
                            "status": "active",
                            "payment_status": "paid",
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    
                    # Update available units
                    await db.storage_sizes.update_one(
                        {"id": rental["unit_size_id"]},
                        {"$inc": {"available_units": -1}}
                    )
                    
                    # Update transaction
                    await db.payment_transactions.update_one(
                        {"session_id": session_id},
                        {"$set": {
                            "payment_status": "paid",
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
            
            return {
                "status": status.status,
                "payment_status": status.payment_status,
                "amount_total": status.amount_total,
                "currency": status.currency
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get checkout status: {str(e)}")
    
    @router.post("/pos/checkout")
    async def pos_checkout(request: RentalCreateRequest, current_user = Depends(require_admin)):
        """POS checkout - creates rental and marks as paid immediately (for in-person cash/card)"""
        # Get the storage size
        size = await db.storage_sizes.find_one({"id": request.unit_size_id})
        if not size:
            raise HTTPException(status_code=404, detail="Storage size not found")
        
        # Check availability
        if size.get("available_units", 0) <= 0:
            raise HTTPException(status_code=400, detail="No units available for this size")
        
        # Calculate price
        if request.billing_type == "yearly":
            price = size["yearly_price"]
        else:
            price = size["monthly_price"]
        
        # Generate access code
        import random
        access_code = str(random.randint(1000, 9999))
        
        # Assign unit number
        active_rentals = await db.storage_rentals.count_documents({
            "unit_size_id": request.unit_size_id,
            "status": {"$in": ["pending", "active"]}
        })
        unit_number = f"{size['name']}-{str(active_rentals + 1).zfill(3)}"
        
        # Create rental record (already paid for POS)
        rental = StorageRental(
            unit_size_id=request.unit_size_id,
            unit_number=unit_number,
            customer=request.customer,
            billing_type=request.billing_type,
            price=price,
            access_code=access_code,
            start_date=datetime.now(timezone.utc).isoformat(),
            status="active",
            payment_status="paid"
        )
        
        rental_dict = rental.model_dump()
        await db.storage_rentals.insert_one(rental_dict)
        
        # Update available units
        await db.storage_sizes.update_one(
            {"id": request.unit_size_id},
            {"$inc": {"available_units": -1}}
        )
        
        # Create payment transaction record
        transaction = {
            "id": str(uuid.uuid4()),
            "type": "storage_rental_pos",
            "rental_id": rental.id,
            "amount": float(price),
            "currency": "usd",
            "customer_email": request.customer.email,
            "payment_status": "paid",
            "payment_method": "pos",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        return {
            "rental_id": rental.id,
            "unit_number": unit_number,
            "access_code": access_code,
            "price": price,
            "status": "active",
            "message": "Rental created successfully"
        }

    class RentalUpdate(BaseModel):
        payment_status: Optional[str] = None  # current, late, delinquent
        days_past_due: Optional[int] = None
        balance_due: Optional[float] = None
        notes: Optional[str] = None

    @router.put("/rentals/{rental_id}")
    async def update_rental(rental_id: str, updates: RentalUpdate, current_user = Depends(require_admin)):
        """Update a rental's status (for drag-and-drop dashboard)"""
        rental = await db.storage_rentals.find_one({"id": rental_id})
        if not rental:
            raise HTTPException(status_code=404, detail="Rental not found")
        
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.storage_rentals.update_one(
            {"id": rental_id},
            {"$set": update_data}
        )
        
        updated_rental = await db.storage_rentals.find_one({"id": rental_id}, {"_id": 0})
        return updated_rental
    
    @router.put("/rentals/{rental_id}/cancel")
    async def cancel_rental(rental_id: str, current_user = Depends(require_admin)):
        """Cancel a rental (admin only)"""
        rental = await db.storage_rentals.find_one({"id": rental_id})
        if not rental:
            raise HTTPException(status_code=404, detail="Rental not found")
        
        # Update rental status
        await db.storage_rentals.update_one(
            {"id": rental_id},
            {"$set": {
                "status": "cancelled",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Restore available unit if was active
        if rental.get("status") == "active":
            await db.storage_sizes.update_one(
                {"id": rental["unit_size_id"]},
                {"$inc": {"available_units": 1}}
            )
        
        return {"message": "Rental cancelled successfully"}
    
    # ============ DASHBOARD STATS ============
    
    @router.get("/stats")
    async def get_storage_stats(current_user = Depends(require_admin)):
        """Get storage rental statistics"""
        total_sizes = await db.storage_sizes.count_documents({})
        total_rentals = await db.storage_rentals.count_documents({})
        active_rentals = await db.storage_rentals.count_documents({"status": "active"})
        
        # Calculate total revenue
        pipeline = [
            {"$match": {"payment_status": "paid"}},
            {"$group": {"_id": None, "total": {"$sum": "$price"}}}
        ]
        revenue_result = await db.storage_rentals.aggregate(pipeline).to_list(1)
        total_revenue = revenue_result[0]["total"] if revenue_result else 0
        
        # Get total available units across all sizes
        sizes = await db.storage_sizes.find({}, {"_id": 0}).to_list(100)
        total_units = sum(s.get("total_units", 0) for s in sizes)
        available_units = sum(s.get("available_units", 0) for s in sizes)
        
        return {
            "total_sizes": total_sizes,
            "total_rentals": total_rentals,
            "active_rentals": active_rentals,
            "total_revenue": total_revenue,
            "total_units": total_units,
            "available_units": available_units,
            "occupancy_rate": ((total_units - available_units) / total_units * 100) if total_units > 0 else 0
        }
    
    # ============ EMAIL RECEIPT ============
    
    class StorageEmailReceiptRequest(BaseModel):
        rental_id: Optional[str] = None
        unit_number: str
        access_code: str
        email: str
        price: float
        customer_name: str
    
    @router.post("/receipt/email")
    async def email_storage_receipt(request: StorageEmailReceiptRequest, current_user = Depends(require_admin)):
        """Email a storage rental receipt to the customer"""
        
        # Log the email request
        email_log = {
            "id": str(uuid.uuid4()),
            "type": "storage_rental_receipt",
            "rental_id": request.rental_id,
            "unit_number": request.unit_number,
            "access_code": request.access_code,
            "recipient": request.email,
            "price": request.price,
            "customer_name": request.customer_name,
            "status": "queued",  # Would be 'sent' once SMTP is configured
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.email_logs.insert_one(email_log)
        
        # Note: In production, this would send via SMTP/SendGrid/etc.
        # For now, we just log the request
        
        return {
            "success": True,
            "message": f"Receipt queued for delivery to {request.email}",
            "email_id": email_log["id"]
        }

    # ============ CUSTOMER MANAGEMENT ============

    class CustomerCreate(BaseModel):
        name: str
        email: str
        phone: Optional[str] = None
        address: Optional[str] = None
        drivers_license: Optional[str] = None
        license_plate: Optional[str] = None
        vehicle_description: Optional[str] = None

    class CustomerUpdate(BaseModel):
        name: Optional[str] = None
        email: Optional[str] = None
        phone: Optional[str] = None
        address: Optional[str] = None
        drivers_license: Optional[str] = None
        license_plate: Optional[str] = None
        vehicle_description: Optional[str] = None
        invoice_delivery: Optional[str] = None
        exemptions: Optional[str] = None
        additional_contacts: Optional[List[dict]] = None
        dl_image_url: Optional[str] = None
        dl_image_folder: Optional[str] = None

    @router.get("/customers")
    async def get_all_customers(current_user: dict = Depends(require_admin)):
        """Get all storage customers"""
        customers = await db.storage_customers.find({}, {"_id": 0}).to_list(1000)
        return customers

    @router.get("/customers/{customer_id}")
    async def get_customer(customer_id: str, current_user: dict = Depends(require_admin)):
        """Get a single customer by ID"""
        customer = await db.storage_customers.find_one({"id": customer_id}, {"_id": 0})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer

    @router.post("/customers")
    async def create_customer(customer: CustomerCreate, current_user: dict = Depends(require_admin)):
        """Create a new customer"""
        customer_data = {
            "id": str(uuid.uuid4()),
            "name": customer.name,
            "email": customer.email,
            "phone": customer.phone,
            "address": customer.address,
            "drivers_license": customer.drivers_license,
            "license_plate": customer.license_plate,
            "vehicle_description": customer.vehicle_description,
            "invoice_delivery": "Email",
            "exemptions": None,
            "additional_contacts": [],
            "prepaid_credit": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.storage_customers.insert_one(customer_data)
        customer_data.pop("_id", None)
        return customer_data

    @router.put("/customers/{customer_id}")
    async def update_customer(customer_id: str, updates: CustomerUpdate, current_user: dict = Depends(require_admin)):
        """Update a customer"""
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.storage_customers.update_one(
            {"id": customer_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        customer = await db.storage_customers.find_one({"id": customer_id}, {"_id": 0})
        return customer

    @router.delete("/customers/{customer_id}")
    async def delete_customer(customer_id: str, current_user: dict = Depends(require_admin)):
        """Delete a customer"""
        # Check if customer has active rentals
        active_rentals = await db.storage_rentals.find_one({
            "customer_id": customer_id,
            "status": "active"
        })
        
        if active_rentals:
            raise HTTPException(status_code=400, detail="Cannot delete customer with active rentals")
        
        result = await db.storage_customers.delete_one({"id": customer_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        return {"success": True, "message": "Customer deleted"}
    
    return router


# Webhook handler for Stripe
async def handle_stripe_webhook(request: Request, db):
    """Handle Stripe webhook events"""
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            # Update rental and transaction
            await db.storage_rentals.update_one(
                {"stripe_session_id": event.session_id},
                {"$set": {
                    "status": "active",
                    "payment_status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            await db.payment_transactions.update_one(
                {"session_id": event.session_id},
                {"$set": {
                    "payment_status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")
