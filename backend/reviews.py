"""
Reviews Management Module for AMINO-CHAIN Peptides
Handles customer reviews with verified purchase validation
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
import uuid
import random

router = APIRouter(tags=["reviews"])

# Database reference (set by server.py)
db = None

def set_database(database):
    global db
    db = database


# Models
class ReviewCreate(BaseModel):
    order_id: str
    product_id: Optional[str] = None
    rating: int  # 1-5
    title: str
    content: str


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None  # pending, approved, rejected
    is_featured: Optional[bool] = None


class ReviewResponse(BaseModel):
    id: str
    customer_id: str
    customer_name: str
    customer_title: Optional[str] = None  # e.g., "PhD", "MS", "Individual Researcher"
    customer_org: Optional[str] = None  # e.g., "University", "Biotech Startup"
    order_id: str
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    rating: int
    title: str
    content: str
    status: str  # pending, approved, rejected
    is_verified_purchase: bool
    is_featured: bool
    is_seeded: bool  # True for fake seed reviews
    created_at: str


# ============== PUBLIC ENDPOINTS ==============

@router.get("/reviews/public")
async def get_public_reviews(
    limit: int = 50,
    featured_only: bool = False,
    min_rating: int = 4
):
    """Get approved reviews for public display"""
    query = {
        "status": "approved",
        "rating": {"$gte": min_rating}
    }
    
    if featured_only:
        query["is_featured"] = True
    
    reviews = await db.reviews.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return reviews


@router.get("/reviews/stats")
async def get_review_stats():
    """Get review statistics"""
    pipeline = [
        {"$match": {"status": "approved"}},
        {"$group": {
            "_id": None,
            "total_reviews": {"$sum": 1},
            "avg_rating": {"$avg": "$rating"},
            "five_star": {"$sum": {"$cond": [{"$eq": ["$rating", 5]}, 1, 0]}},
            "four_star": {"$sum": {"$cond": [{"$eq": ["$rating", 4]}, 1, 0]}},
            "three_star": {"$sum": {"$cond": [{"$eq": ["$rating", 3]}, 1, 0]}},
            "two_star": {"$sum": {"$cond": [{"$eq": ["$rating", 2]}, 1, 0]}},
            "one_star": {"$sum": {"$cond": [{"$eq": ["$rating", 1]}, 1, 0]}},
            "fake_reviews": {"$sum": {"$cond": [{"$eq": ["$is_seeded", True]}, 1, 0]}},
            "real_reviews": {"$sum": {"$cond": [{"$eq": ["$is_seeded", False]}, 1, 0]}},
        }}
    ]
    
    result = await db.reviews.aggregate(pipeline).to_list(1)
    
    if result:
        stats = result[0]
        stats.pop("_id", None)
        stats["avg_rating"] = round(stats.get("avg_rating", 0), 1)
        return stats
    
    return {
        "total_reviews": 0,
        "avg_rating": 0,
        "five_star": 0,
        "four_star": 0,
        "three_star": 0,
        "two_star": 0,
        "one_star": 0,
        "fake_reviews": 0,
        "real_reviews": 0
    }


# ============== CUSTOMER ENDPOINTS ==============

@router.post("/reviews/submit")
async def submit_review(data: ReviewCreate):
    """Submit a review for a verified purchase"""
    # Verify the order exists
    order = await db.orders.find_one({"id": data.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if review already exists for this order
    existing = await db.reviews.find_one({
        "order_id": data.order_id,
        "customer_id": order.get("customer_id")
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this order")
    
    # Verify order is completed/delivered
    if order.get("status") not in ["completed", "delivered", "shipped", "paid"]:
        raise HTTPException(status_code=400, detail="Order must be completed before reviewing")
    
    now = datetime.now(timezone.utc).isoformat()
    review_id = str(uuid.uuid4())
    
    # Get product name if product_id provided
    product_name = None
    if data.product_id:
        product = await db.products.find_one({"id": data.product_id})
        if product:
            product_name = product.get("name")
    
    review_data = {
        "id": review_id,
        "customer_id": order.get("customer_id", ""),
        "customer_name": order.get("customer_name", "Anonymous"),
        "customer_title": None,
        "customer_org": None,
        "order_id": data.order_id,
        "product_id": data.product_id,
        "product_name": product_name,
        "rating": max(1, min(5, data.rating)),
        "title": data.title,
        "content": data.content,
        "status": "pending",  # Requires admin approval
        "is_verified_purchase": True,
        "is_featured": False,
        "is_seeded": False,
        "created_at": now,
        "updated_at": now
    }
    
    await db.reviews.insert_one(review_data)
    review_data.pop("_id", None)
    
    return {"message": "Review submitted for approval", "review_id": review_id}


@router.get("/reviews/my-reviews/{customer_id}")
async def get_customer_reviews(customer_id: str):
    """Get all reviews by a customer"""
    reviews = await db.reviews.find(
        {"customer_id": customer_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return reviews


@router.get("/reviews/can-review/{order_id}")
async def can_review_order(order_id: str):
    """Check if an order can be reviewed"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        return {"can_review": False, "reason": "Order not found"}
    
    # Check if already reviewed
    existing = await db.reviews.find_one({"order_id": order_id})
    if existing:
        return {"can_review": False, "reason": "Already reviewed", "review_id": existing.get("id")}
    
    # Check order status
    if order.get("status") not in ["completed", "delivered", "shipped", "paid"]:
        return {"can_review": False, "reason": "Order not yet completed"}
    
    return {"can_review": True, "order": {
        "id": order.get("id"),
        "order_number": order.get("order_number"),
        "items": order.get("items", [])
    }}


# ============== ADMIN ENDPOINTS ==============

@router.get("/reviews/admin")
async def get_all_reviews(
    status: Optional[str] = None,
    is_seeded: Optional[bool] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get all reviews for admin management"""
    query = {}
    if status:
        query["status"] = status
    if is_seeded is not None:
        query["is_seeded"] = is_seeded
    
    reviews = await db.reviews.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.reviews.count_documents(query)
    
    return {
        "reviews": reviews,
        "total": total,
        "limit": limit,
        "skip": skip
    }


@router.put("/reviews/admin/{review_id}")
async def update_review(review_id: str, data: ReviewUpdate):
    """Update a review (admin)"""
    update_data = {}
    for field, value in data.dict(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.reviews.update_one(
            {"id": review_id},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Review not found")
    
    return {"message": "Review updated"}


@router.delete("/reviews/admin/{review_id}")
async def delete_review(review_id: str):
    """Delete a review"""
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return {"message": "Review deleted"}


@router.post("/reviews/admin/bulk-delete")
async def bulk_delete_reviews(review_ids: List[str]):
    """Bulk delete reviews"""
    result = await db.reviews.delete_many({"id": {"$in": review_ids}})
    return {"message": f"Deleted {result.deleted_count} reviews"}


@router.post("/reviews/admin/bulk-approve")
async def bulk_approve_reviews(review_ids: List[str]):
    """Bulk approve reviews"""
    result = await db.reviews.update_many(
        {"id": {"$in": review_ids}},
        {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": f"Approved {result.modified_count} reviews"}


# ============== SEED DATA ==============

@router.post("/reviews/admin/seed")
async def seed_reviews(count: int = 200):
    """Seed fake reviews for initial display"""
    
    # Check if already seeded
    existing_seeded = await db.reviews.count_documents({"is_seeded": True})
    if existing_seeded >= 50:
        return {"message": f"Already have {existing_seeded} seeded reviews. Delete them first to re-seed."}
    
    # Reviewer profiles
    titles = ["PhD", "MS", "BS", None, None]
    orgs = [
        "University", "Biotech Startup", "Individual Researcher", 
        "Contract Research Organization", "Pharmaceutical Company",
        "Academic Institution", "Research Hospital", "Private Lab"
    ]
    
    first_names = [
        "Michael", "James", "Lisa", "Robert", "Rebecca", "David", "Emily", "Carlos",
        "Rachel", "Sarah", "John", "Jennifer", "William", "Amanda", "Christopher",
        "Jessica", "Daniel", "Ashley", "Matthew", "Stephanie", "Andrew", "Nicole",
        "Joshua", "Elizabeth", "Anthony", "Megan", "Joseph", "Lauren", "Thomas",
        "Samantha", "Ryan", "Brittany", "Kevin", "Kayla", "Brian", "Heather",
        "Eric", "Michelle", "Jason", "Kimberly", "Mark", "Amy", "Steven", "Angela"
    ]
    
    last_initials = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    
    # Review templates - peptide research focused
    review_templates = [
        {
            "title": "Exceptional Quality",
            "content": "The purity of these peptides is outstanding. We've been using them for our research projects and the results have been consistently reproducible. The COA documentation is thorough and accurate."
        },
        {
            "title": "Fast Shipping, Great Product",
            "content": "Fast shipping and reliable quality. As an independent researcher, having access to certified peptides without minimum orders has been game-changing for my work."
        },
        {
            "title": "Trusted Supplier",
            "content": "Our lab has ordered from Gingerkare for 2 years. The 99% purity guarantee isn't just marketing - every batch we've tested exceeds expectations. Outstanding vendor."
        },
        {
            "title": "Research-Grade Excellence",
            "content": "Finally a supplier that understands research timelines. Same-day shipping has saved multiple experiments. Quality is pharmaceutical-grade."
        },
        {
            "title": "Technical Support is Excellent",
            "content": "The technical support team actually understands peptide chemistry. They helped us select the optimal compound for our protein folding study."
        },
        {
            "title": "Highly Recommended",
            "content": "We've recommended Gingerkare to four other labs in our network. The combination of purity, speed, and customer service is unmatched in this space."
        },
        {
            "title": "Consistent Batch Quality",
            "content": "The batch-to-batch consistency is remarkable. We've run parallel studies with their peptides and the reproducibility is exactly what research demands."
        },
        {
            "title": "Outstanding Customer Service",
            "content": "Customer service responds within hours, not days. When we had a shipping question, they resolved it before it became an issue. Professional operation."
        },
        {
            "title": "Perfect for Time-Sensitive Research",
            "content": "Finally found a supplier who understands that research doesn't follow a 9-5 schedule. Their support availability has been crucial for our time-sensitive work."
        },
        {
            "title": "Documentation Excellence",
            "content": "The documentation provided with each order is comprehensive. COAs, handling instructions, storage recommendations - everything a research lab needs."
        },
        {
            "title": "Reliable Partner",
            "content": "After trying several suppliers, Gingerkare has become our go-to source. Reliability and quality you can count on for serious research."
        },
        {
            "title": "Great Value for Research",
            "content": "The pricing is competitive and the quality justifies every dollar. For research-grade peptides, this is excellent value."
        },
        {
            "title": "Impressed with Purity",
            "content": "HPLC analysis confirmed the stated purity. In our field, that kind of accuracy is essential. Very impressed with the quality control."
        },
        {
            "title": "Quick Turnaround",
            "content": "Ordered on Monday, received on Wednesday. The quick turnaround has helped us meet several grant deadlines. Excellent logistics."
        },
        {
            "title": "Professional Experience",
            "content": "From ordering to delivery, the entire experience was professional. Clear communication, proper packaging, and quality product."
        },
        {
            "title": "Exactly What We Needed",
            "content": "The peptide specifications matched our research requirements perfectly. Will definitely order again for our next study phase."
        },
        {
            "title": "Top-Tier Quality",
            "content": "We've used these peptides in multiple assays and the results speak for themselves. Top-tier quality for serious research applications."
        },
        {
            "title": "Excellent for Academic Research",
            "content": "As an academic researcher, budget constraints are real. Gingerkare offers research-grade quality at prices that work for university labs."
        },
        {
            "title": "Solved Our Sourcing Problems",
            "content": "After inconsistent results with other suppliers, switching to Gingerkare solved our reproducibility issues. The difference is clear."
        },
        {
            "title": "5 Stars Deserved",
            "content": "Quality peptides, professional service, fast delivery. They've earned every one of these five stars through consistent excellence."
        },
        {
            "title": "Research Partner of Choice",
            "content": "Gingerkare has become our research partner of choice. When results matter, you need a supplier you can trust completely."
        },
        {
            "title": "Exceeded Expectations",
            "content": "The quality exceeded our expectations. We're planning to expand our research scope knowing we have a reliable peptide source."
        },
        {
            "title": "Biotech Approved",
            "content": "Our biotech startup has strict vendor requirements. Gingerkare passed our quality audit with flying colors. Recommended for regulated research."
        },
        {
            "title": "Perfect for Screening Studies",
            "content": "We use their peptides for high-throughput screening. The consistency across multiple orders has been essential for our data quality."
        },
        {
            "title": "Graduate Research Essential",
            "content": "As a PhD candidate, I need reliable reagents. Gingerkare has been essential for my dissertation research. Quality I can defend."
        }
    ]
    
    reviews = []
    now = datetime.now(timezone.utc)
    
    for i in range(count):
        # Random date within last 6 months
        review_date = datetime(
            now.year, now.month, now.day,
            random.randint(0, 23), random.randint(0, 59), random.randint(0, 59),
            tzinfo=timezone.utc
        )
        
        template = random.choice(review_templates)
        title = random.choice(titles)
        first_name = random.choice(first_names)
        last_initial = random.choice(last_initials)
        org = random.choice(orgs)
        
        # Mostly 5 stars, some 4 stars
        rating = 5 if random.random() < 0.75 else 4
        
        # Build name with optional title
        name = f"{first_name} {last_initial}."
        if title:
            name = f"{name}, {title}"
        
        review = {
            "id": str(uuid.uuid4()),
            "customer_id": f"seed-{i}",
            "customer_name": name,
            "customer_title": title,
            "customer_org": org,
            "order_id": f"seed-order-{i}",
            "product_id": None,
            "product_name": None,
            "rating": rating,
            "title": template["title"],
            "content": template["content"],
            "status": "approved",
            "is_verified_purchase": True,
            "is_featured": random.random() < 0.1,  # 10% featured
            "is_seeded": True,
            "created_at": review_date.isoformat(),
            "updated_at": review_date.isoformat()
        }
        reviews.append(review)
    
    # Insert all reviews
    if reviews:
        await db.reviews.insert_many(reviews)
    
    return {"message": f"Seeded {len(reviews)} reviews"}


@router.delete("/reviews/admin/clear-seeded")
async def clear_seeded_reviews():
    """Delete all seeded (fake) reviews"""
    result = await db.reviews.delete_many({"is_seeded": True})
    return {"message": f"Deleted {result.deleted_count} seeded reviews"}
