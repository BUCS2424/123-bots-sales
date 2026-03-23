"""
Accounting Module for AMINO-CHAIN Peptides E-Commerce
Tracks sales revenue, orders, customers, inventory, and financial metrics.
"""

from fastapi import APIRouter, Query
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from collections import defaultdict

router = APIRouter(prefix="/accounting", tags=["Accounting"])

db = None

def set_database(database):
    global db
    db = database


def _today_range():
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return start, end


def _month_range(year: int, month: int):
    start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    return start, end


def _date_range(date_str: Optional[str], range_type: str):
    """Parse date string and return start/end range"""
    if date_str:
        d = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    else:
        d = datetime.now(timezone.utc)

    if range_type == "day":
        start = d.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
    elif range_type == "week":
        start = d.replace(hour=0, minute=0, second=0, microsecond=0)
        start = start - timedelta(days=start.weekday())  # Start of week (Monday)
        end = start + timedelta(days=7)
    elif range_type == "month":
        start = d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if d.month == 12:
            end = start.replace(year=d.year + 1, month=1)
        else:
            end = start.replace(month=d.month + 1)
    elif range_type == "year":
        start = d.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(year=d.year + 1)
    else:
        start = d.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
    return start, end


async def _get_orders_in_range(start: datetime, end: datetime, status_filter: Optional[str] = None):
    """Get orders within a date range with optional status filter"""
    query = {
        "$or": [
            {"created_at": {"$gte": start.isoformat(), "$lt": end.isoformat()}},
            {"created_at": {"$gte": start, "$lt": end}}
        ]
    }
    if status_filter:
        query["status"] = status_filter
    
    return await db.orders.find(query).to_list(None)


# ============ DAILY SALES SNAPSHOT ============

@router.get("/daily-snapshot")
async def get_daily_snapshot(report_date: Optional[str] = None):
    """Daily Sales Snapshot - Core e-commerce metrics for the day"""
    start, end = _date_range(report_date, "day")
    
    # Get all orders for the day
    orders = await _get_orders_in_range(start, end)
    
    # Calculate metrics
    total_revenue = 0.0
    subtotal = 0.0
    tax_collected = 0.0
    shipping_collected = 0.0
    discount_given = 0.0
    items_sold = 0
    
    orders_by_status = defaultdict(int)
    payment_methods = defaultdict(float)
    
    for order in orders:
        orders_by_status[order.get("status", "pending")] += 1
        
        order_total = order.get("total", 0)
        order_subtotal = order.get("subtotal", 0)
        order_tax = order.get("tax", order.get("tax_amount", 0))
        order_shipping = order.get("shipping_cost", order.get("shipping", 0))
        order_discount = order.get("discount_amount", 0)
        
        total_revenue += order_total
        subtotal += order_subtotal
        tax_collected += order_tax
        shipping_collected += order_shipping
        discount_given += order_discount
        
        # Count items
        for item in order.get("items", []):
            items_sold += item.get("quantity", 1)
        
        # Track payment methods
        payment_method = order.get("payment_method", "card")
        payment_methods[payment_method] += order_total
    
    # Get previous day for comparison
    prev_start = start - timedelta(days=1)
    prev_end = start
    prev_orders = await _get_orders_in_range(prev_start, prev_end)
    prev_revenue = sum(o.get("total", 0) for o in prev_orders)
    
    # Calculate change
    revenue_change = 0
    if prev_revenue > 0:
        revenue_change = round(((total_revenue - prev_revenue) / prev_revenue) * 100, 1)
    
    avg_order_value = round(total_revenue / len(orders), 2) if orders else 0
    
    return {
        "report_date": start.strftime("%Y-%m-%d"),
        "total_orders": len(orders),
        "orders_by_status": dict(orders_by_status),
        "total_revenue": round(total_revenue, 2),
        "subtotal": round(subtotal, 2),
        "tax_collected": round(tax_collected, 2),
        "shipping_collected": round(shipping_collected, 2),
        "discounts_given": round(discount_given, 2),
        "items_sold": items_sold,
        "average_order_value": avg_order_value,
        "payment_methods": {k: round(v, 2) for k, v in payment_methods.items()},
        "revenue_vs_yesterday": revenue_change,
        "previous_day_revenue": round(prev_revenue, 2)
    }


# ============ SALES OVERVIEW ============

@router.get("/sales-overview")
async def get_sales_overview(
    period: str = Query("month", enum=["day", "week", "month", "year"]),
    date: Optional[str] = None
):
    """Sales overview for a given period"""
    start, end = _date_range(date, period)
    orders = await _get_orders_in_range(start, end)
    
    # Completed orders only for revenue
    completed_orders = [o for o in orders if o.get("status") in ["completed", "shipped", "delivered"]]
    pending_orders = [o for o in orders if o.get("status") in ["pending", "processing"]]
    cancelled_orders = [o for o in orders if o.get("status") in ["cancelled", "refunded"]]
    
    gross_revenue = sum(o.get("total", 0) for o in completed_orders)
    refunds = sum(o.get("total", 0) for o in cancelled_orders if o.get("status") == "refunded")
    net_revenue = gross_revenue - refunds
    
    # Cost of goods (if cost_price is tracked)
    cogs = 0
    for order in completed_orders:
        for item in order.get("items", []):
            product_id = item.get("product_id")
            if product_id:
                product = await db.products.find_one({"id": product_id}, {"cost_price": 1})
                if product and product.get("cost_price"):
                    cogs += product["cost_price"] * item.get("quantity", 1)
    
    gross_profit = net_revenue - cogs
    profit_margin = round((gross_profit / net_revenue) * 100, 1) if net_revenue > 0 else 0
    
    return {
        "period": period,
        "start_date": start.strftime("%Y-%m-%d"),
        "end_date": (end - timedelta(days=1)).strftime("%Y-%m-%d"),
        "total_orders": len(orders),
        "completed_orders": len(completed_orders),
        "pending_orders": len(pending_orders),
        "cancelled_orders": len(cancelled_orders),
        "gross_revenue": round(gross_revenue, 2),
        "refunds": round(refunds, 2),
        "net_revenue": round(net_revenue, 2),
        "cost_of_goods": round(cogs, 2),
        "gross_profit": round(gross_profit, 2),
        "profit_margin_percent": profit_margin,
        "average_order_value": round(gross_revenue / len(completed_orders), 2) if completed_orders else 0
    }


# ============ REVENUE TRENDS ============

@router.get("/revenue-trends")
async def get_revenue_trends(days: int = Query(30, ge=7, le=365)):
    """Daily revenue trends for the last N days"""
    end = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    start = end - timedelta(days=days)
    
    orders = await _get_orders_in_range(start, end)
    
    # Group by day
    daily_data = defaultdict(lambda: {"revenue": 0, "orders": 0, "items": 0})
    
    for order in orders:
        created_at = order.get("created_at")
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except:
                continue
        
        if created_at:
            day_key = created_at.strftime("%Y-%m-%d")
            daily_data[day_key]["revenue"] += order.get("total", 0)
            daily_data[day_key]["orders"] += 1
            for item in order.get("items", []):
                daily_data[day_key]["items"] += item.get("quantity", 1)
    
    # Build trend array
    trends = []
    current = start
    while current < end:
        day_key = current.strftime("%Y-%m-%d")
        data = daily_data.get(day_key, {"revenue": 0, "orders": 0, "items": 0})
        trends.append({
            "date": day_key,
            "revenue": round(data["revenue"], 2),
            "orders": data["orders"],
            "items": data["items"]
        })
        current += timedelta(days=1)
    
    # Calculate totals and averages
    total_revenue = sum(d["revenue"] for d in trends)
    total_orders = sum(d["orders"] for d in trends)
    avg_daily_revenue = round(total_revenue / days, 2)
    avg_daily_orders = round(total_orders / days, 1)
    
    return {
        "period_days": days,
        "trends": trends,
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "average_daily_revenue": avg_daily_revenue,
        "average_daily_orders": avg_daily_orders
    }


# ============ TOP PRODUCTS ============

@router.get("/top-products")
async def get_top_products(
    period: str = Query("month", enum=["week", "month", "year"]),
    limit: int = Query(10, ge=1, le=50)
):
    """Top selling products by revenue and quantity"""
    start, end = _date_range(None, period)
    orders = await _get_orders_in_range(start, end)
    
    # Aggregate product sales
    product_sales = defaultdict(lambda: {"quantity": 0, "revenue": 0, "orders": 0})
    
    for order in orders:
        if order.get("status") in ["cancelled", "refunded"]:
            continue
        for item in order.get("items", []):
            product_id = item.get("product_id", item.get("id"))
            name = item.get("name", "Unknown")
            quantity = item.get("quantity", 1)
            price = item.get("price", 0)
            
            key = f"{product_id}|{name}"
            product_sales[key]["quantity"] += quantity
            product_sales[key]["revenue"] += price * quantity
            product_sales[key]["orders"] += 1
            product_sales[key]["name"] = name
            product_sales[key]["product_id"] = product_id
    
    # Sort by revenue
    sorted_by_revenue = sorted(
        product_sales.values(),
        key=lambda x: x["revenue"],
        reverse=True
    )[:limit]
    
    # Sort by quantity
    sorted_by_quantity = sorted(
        product_sales.values(),
        key=lambda x: x["quantity"],
        reverse=True
    )[:limit]
    
    return {
        "period": period,
        "by_revenue": [
            {
                "product_id": p["product_id"],
                "name": p["name"],
                "revenue": round(p["revenue"], 2),
                "quantity_sold": p["quantity"],
                "order_count": p["orders"]
            }
            for p in sorted_by_revenue
        ],
        "by_quantity": [
            {
                "product_id": p["product_id"],
                "name": p["name"],
                "quantity_sold": p["quantity"],
                "revenue": round(p["revenue"], 2),
                "order_count": p["orders"]
            }
            for p in sorted_by_quantity
        ]
    }


# ============ CUSTOMER ANALYTICS ============

@router.get("/customer-analytics")
async def get_customer_analytics(period: str = Query("month", enum=["week", "month", "year"])):
    """Customer purchase analytics"""
    start, end = _date_range(None, period)
    orders = await _get_orders_in_range(start, end)
    
    # Group orders by customer
    customer_orders = defaultdict(list)
    guest_orders = []
    
    for order in orders:
        customer_id = order.get("customer_id")
        if customer_id:
            customer_orders[customer_id].append(order)
        else:
            guest_orders.append(order)
    
    # Calculate metrics
    total_customers = len(customer_orders)
    repeat_customers = sum(1 for orders in customer_orders.values() if len(orders) > 1)
    new_customers = sum(1 for orders in customer_orders.values() if len(orders) == 1)
    
    # Customer lifetime value (average)
    total_customer_revenue = sum(
        sum(o.get("total", 0) for o in orders)
        for orders in customer_orders.values()
    )
    avg_customer_value = round(total_customer_revenue / total_customers, 2) if total_customers > 0 else 0
    
    # Guest vs registered
    registered_revenue = total_customer_revenue
    guest_revenue = sum(o.get("total", 0) for o in guest_orders)
    
    return {
        "period": period,
        "total_unique_customers": total_customers,
        "new_customers": new_customers,
        "repeat_customers": repeat_customers,
        "repeat_rate_percent": round((repeat_customers / total_customers) * 100, 1) if total_customers > 0 else 0,
        "guest_orders": len(guest_orders),
        "registered_orders": sum(len(o) for o in customer_orders.values()),
        "average_customer_value": avg_customer_value,
        "registered_revenue": round(registered_revenue, 2),
        "guest_revenue": round(guest_revenue, 2)
    }


# ============ INVENTORY VALUATION ============

@router.get("/inventory-valuation")
async def get_inventory_valuation():
    """Current inventory valuation and stock levels"""
    products = await db.products.find({"in_stock": True}).to_list(None)
    
    total_retail_value = 0
    total_cost_value = 0
    total_units = 0
    low_stock_items = []
    out_of_stock = 0
    
    category_breakdown = defaultdict(lambda: {"count": 0, "retail_value": 0, "cost_value": 0})
    
    for product in products:
        quantity = product.get("quantity", 1)
        price = product.get("price", 0)
        cost = product.get("cost_price", 0) or 0
        category = product.get("category", "Uncategorized")
        
        retail_value = price * quantity
        cost_value = cost * quantity
        
        total_retail_value += retail_value
        total_cost_value += cost_value
        total_units += quantity
        
        category_breakdown[category]["count"] += quantity
        category_breakdown[category]["retail_value"] += retail_value
        category_breakdown[category]["cost_value"] += cost_value
        
        # Check low stock (less than 10 units)
        if quantity <= 10 and quantity > 0:
            low_stock_items.append({
                "id": product.get("id"),
                "name": product.get("name"),
                "quantity": quantity,
                "category": category
            })
        elif quantity <= 0:
            out_of_stock += 1
    
    # All products including out of stock
    all_products = await db.products.find({}).to_list(None)
    
    potential_profit = total_retail_value - total_cost_value
    
    return {
        "total_products": len(all_products),
        "in_stock_products": len(products),
        "out_of_stock_products": out_of_stock,
        "total_units": total_units,
        "total_retail_value": round(total_retail_value, 2),
        "total_cost_value": round(total_cost_value, 2),
        "potential_profit": round(potential_profit, 2),
        "profit_margin_percent": round((potential_profit / total_retail_value) * 100, 1) if total_retail_value > 0 else 0,
        "low_stock_items": low_stock_items[:20],
        "low_stock_count": len(low_stock_items),
        "category_breakdown": {
            k: {
                "count": v["count"],
                "retail_value": round(v["retail_value"], 2),
                "cost_value": round(v["cost_value"], 2)
            }
            for k, v in category_breakdown.items()
        }
    }


# ============ SALES TAX REPORT ============

@router.get("/sales-tax")
async def get_sales_tax(report_month: Optional[str] = None):
    """Sales tax report for tax filing purposes"""
    now = datetime.now(timezone.utc)
    if report_month:
        parts = report_month.split("-")
        year, month = int(parts[0]), int(parts[1])
    else:
        year, month = now.year, now.month

    start, end = _month_range(year, month)
    orders = await _get_orders_in_range(start, end)
    
    # Only count completed orders
    completed = [o for o in orders if o.get("status") not in ["cancelled", "refunded"]]
    
    taxable_sales = sum(o.get("subtotal", 0) for o in completed)
    tax_collected = sum(o.get("tax", o.get("tax_amount", 0)) for o in completed)
    shipping_collected = sum(o.get("shipping_cost", o.get("shipping", 0)) for o in completed)
    
    # Get tax settings
    settings = await db.admin_settings.find_one({"type": "tax"}) or {}
    tax_rate = settings.get("tax_rate", 0)
    
    # Breakdown by state (for nexus reporting)
    state_breakdown = defaultdict(lambda: {"orders": 0, "taxable": 0, "tax": 0})
    for order in completed:
        shipping = order.get("shipping_address", {})
        state = shipping.get("state", "Unknown")
        state_breakdown[state]["orders"] += 1
        state_breakdown[state]["taxable"] += order.get("subtotal", 0)
        state_breakdown[state]["tax"] += order.get("tax", order.get("tax_amount", 0))

    return {
        "report_period": f"{year}-{month:02d}",
        "total_orders": len(completed),
        "taxable_sales": round(taxable_sales, 2),
        "tax_collected": round(tax_collected, 2),
        "shipping_collected": round(shipping_collected, 2),
        "configured_tax_rate": tax_rate,
        "effective_tax_rate": round((tax_collected / taxable_sales) * 100, 2) if taxable_sales > 0 else 0,
        "state_breakdown": {
            k: {
                "orders": v["orders"],
                "taxable_sales": round(v["taxable"], 2),
                "tax_collected": round(v["tax"], 2)
            }
            for k, v in state_breakdown.items()
        }
    }


# ============ KPIs DASHBOARD ============

@router.get("/kpis")
async def get_kpis():
    """Key Performance Indicators for the business"""
    now = datetime.now(timezone.utc)
    
    # Current month
    month_start, month_end = _month_range(now.year, now.month)
    month_orders = await _get_orders_in_range(month_start, month_end)
    month_revenue = sum(o.get("total", 0) for o in month_orders if o.get("status") not in ["cancelled", "refunded"])
    
    # Previous month for comparison
    if now.month == 1:
        prev_year, prev_month = now.year - 1, 12
    else:
        prev_year, prev_month = now.year, now.month - 1
    prev_start, prev_end = _month_range(prev_year, prev_month)
    prev_orders = await _get_orders_in_range(prev_start, prev_end)
    prev_revenue = sum(o.get("total", 0) for o in prev_orders if o.get("status") not in ["cancelled", "refunded"])
    
    # Revenue growth
    revenue_growth = 0
    if prev_revenue > 0:
        revenue_growth = round(((month_revenue - prev_revenue) / prev_revenue) * 100, 1)
    
    # All-time stats
    all_orders = await db.orders.find({}).to_list(None)
    total_revenue = sum(o.get("total", 0) for o in all_orders if o.get("status") not in ["cancelled", "refunded"])
    total_orders = len([o for o in all_orders if o.get("status") not in ["cancelled", "refunded"]])
    
    # Products
    total_products = await db.products.count_documents({})
    in_stock = await db.products.count_documents({"in_stock": True})
    
    # Customers
    total_customers = await db.users.count_documents({"role": {"$ne": "admin"}})
    
    # Average order value
    aov = round(total_revenue / total_orders, 2) if total_orders > 0 else 0
    
    # Conversion rate (if we track visits)
    # This would need analytics integration
    
    return {
        "current_month": {
            "revenue": round(month_revenue, 2),
            "orders": len([o for o in month_orders if o.get("status") not in ["cancelled", "refunded"]]),
            "vs_last_month_percent": revenue_growth
        },
        "all_time": {
            "total_revenue": round(total_revenue, 2),
            "total_orders": total_orders,
            "average_order_value": aov
        },
        "products": {
            "total": total_products,
            "in_stock": in_stock,
            "out_of_stock": total_products - in_stock
        },
        "customers": {
            "total_registered": total_customers
        }
    }


# ============ MONTHLY SUMMARY ============

@router.get("/monthly-summary")
async def get_monthly_summary(report_month: Optional[str] = None):
    """Comprehensive monthly accounting summary"""
    now = datetime.now(timezone.utc)
    if report_month:
        parts = report_month.split("-")
        year, month = int(parts[0]), int(parts[1])
    else:
        year, month = now.year, now.month

    start, end = _month_range(year, month)
    orders = await _get_orders_in_range(start, end)
    
    # Filter by status
    completed = [o for o in orders if o.get("status") in ["completed", "shipped", "delivered"]]
    pending = [o for o in orders if o.get("status") in ["pending", "processing"]]
    cancelled = [o for o in orders if o.get("status") == "cancelled"]
    refunded = [o for o in orders if o.get("status") == "refunded"]
    
    gross_revenue = sum(o.get("total", 0) for o in completed)
    pending_revenue = sum(o.get("total", 0) for o in pending)
    refund_amount = sum(o.get("total", 0) for o in refunded)
    
    tax = sum(o.get("tax", o.get("tax_amount", 0)) for o in completed)
    shipping = sum(o.get("shipping_cost", o.get("shipping", 0)) for o in completed)
    discounts = sum(o.get("discount_amount", 0) for o in completed)
    
    # Product sales breakdown
    product_revenue = gross_revenue - tax - shipping
    
    # Daily breakdown
    daily_totals = defaultdict(lambda: {"revenue": 0, "orders": 0})
    for order in completed:
        created_at = order.get("created_at")
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except:
                continue
        if created_at:
            day = created_at.day
            daily_totals[day]["revenue"] += order.get("total", 0)
            daily_totals[day]["orders"] += 1
    
    return {
        "report_period": f"{year}-{month:02d}",
        "summary": {
            "gross_revenue": round(gross_revenue, 2),
            "refunds": round(refund_amount, 2),
            "net_revenue": round(gross_revenue - refund_amount, 2),
            "pending_revenue": round(pending_revenue, 2)
        },
        "orders": {
            "total": len(orders),
            "completed": len(completed),
            "pending": len(pending),
            "cancelled": len(cancelled),
            "refunded": len(refunded)
        },
        "breakdown": {
            "product_sales": round(product_revenue, 2),
            "tax_collected": round(tax, 2),
            "shipping_collected": round(shipping, 2),
            "discounts_given": round(discounts, 2)
        },
        "averages": {
            "order_value": round(gross_revenue / len(completed), 2) if completed else 0,
            "daily_revenue": round(gross_revenue / max(1, len(daily_totals)), 2),
            "daily_orders": round(len(completed) / max(1, len(daily_totals)), 1)
        },
        "daily_totals": [
            {"day": day, "revenue": round(data["revenue"], 2), "orders": data["orders"]}
            for day, data in sorted(daily_totals.items())
        ]
    }


# ============ EXPORT REPORTS ============

@router.get("/export/orders")
async def export_orders(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    format: str = Query("json", enum=["json", "csv"])
):
    """Export orders for accounting software import"""
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    else:
        start = datetime.now(timezone.utc) - timedelta(days=30)
    
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
    else:
        end = datetime.now(timezone.utc) + timedelta(days=1)
    
    orders = await _get_orders_in_range(start, end)
    
    export_data = []
    for order in orders:
        export_data.append({
            "order_id": order.get("id", order.get("order_number")),
            "date": order.get("created_at"),
            "status": order.get("status"),
            "customer_email": order.get("customer_email", order.get("shipping_address", {}).get("email")),
            "subtotal": order.get("subtotal", 0),
            "tax": order.get("tax", order.get("tax_amount", 0)),
            "shipping": order.get("shipping_cost", order.get("shipping", 0)),
            "discount": order.get("discount_amount", 0),
            "total": order.get("total", 0),
            "payment_method": order.get("payment_method", ""),
            "shipping_state": order.get("shipping_address", {}).get("state", "")
        })
    
    if format == "csv":
        # Return as CSV-ready structure
        if not export_data:
            return {"csv": "", "count": 0}
        
        headers = list(export_data[0].keys())
        csv_lines = [",".join(headers)]
        for row in export_data:
            csv_lines.append(",".join(str(row.get(h, "")) for h in headers))
        
        return {
            "csv": "\n".join(csv_lines),
            "count": len(export_data)
        }
    
    return {
        "orders": export_data,
        "count": len(export_data),
        "period": {
            "start": start.strftime("%Y-%m-%d"),
            "end": (end - timedelta(days=1)).strftime("%Y-%m-%d")
        }
    }



# ============ DASHBOARD ENDPOINTS (for Admin Frontend) ============

def _parse_period_to_days(period: str) -> int:
    """Convert period string to number of days"""
    if period == "all":
        return 3650  # ~10 years
    try:
        return int(period)
    except:
        return 30


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    period: str = "30",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Main stats for the accounting dashboard"""
    if start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
    else:
        days = _parse_period_to_days(period)
        end = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        start = end - timedelta(days=days)
    
    orders = await _get_orders_in_range(start, end)
    completed = [o for o in orders if o.get("status") not in ["cancelled", "refunded"]]
    refunded = [o for o in orders if o.get("status") == "refunded"]
    
    gross_revenue = sum(o.get("total", 0) for o in completed)
    refund_total = sum(o.get("total", 0) for o in refunded)
    net_revenue = gross_revenue - refund_total
    
    # Calculate cost of goods
    total_cost = 0
    items_sold = 0
    for order in completed:
        for item in order.get("items", []):
            qty = item.get("quantity", 1)
            items_sold += qty
            product_id = item.get("product_id")
            if product_id:
                product = await db.products.find_one({"id": product_id}, {"cost_price": 1})
                if product and product.get("cost_price"):
                    total_cost += product["cost_price"] * qty
    
    gross_profit = net_revenue - total_cost
    profit_margin = round((gross_profit / net_revenue) * 100, 1) if net_revenue > 0 else 0
    cost_percentage = round((total_cost / gross_revenue) * 100, 1) if gross_revenue > 0 else 0
    
    # Unique customers
    customer_ids = set()
    for order in completed:
        cid = order.get("customer_id")
        if cid:
            customer_ids.add(cid)
    
    # Previous period comparison
    period_days = (end - start).days
    prev_end = start
    prev_start = prev_end - timedelta(days=period_days)
    prev_orders = await _get_orders_in_range(prev_start, prev_end)
    prev_completed = [o for o in prev_orders if o.get("status") not in ["cancelled", "refunded"]]
    prev_revenue = sum(o.get("total", 0) for o in prev_completed)
    
    revenue_change = 0
    if prev_revenue > 0:
        revenue_change = round(((gross_revenue - prev_revenue) / prev_revenue) * 100, 1)
    
    # Return in format expected by frontend
    return {
        "revenue": {
            "gross": round(gross_revenue, 2),
            "refunds": round(refund_total, 2),
            "net": round(net_revenue, 2)
        },
        "costs": {
            "total": round(total_cost, 2),
            "percentage": cost_percentage
        },
        "profit": {
            "gross": round(gross_profit, 2),
            "margin_percentage": profit_margin
        },
        "orders": {
            "total": len(completed),
            "average_value": round(gross_revenue / len(completed), 2) if completed else 0
        },
        "products": {
            "items_sold": items_sold
        },
        "customers": {
            "unique": len(customer_ids),
            "new": len(customer_ids)  # Would need more logic to track new vs returning
        },
        "comparison": {
            "revenue_change_percent": revenue_change,
            "previous_period_revenue": round(prev_revenue, 2)
        }
    }


@router.get("/dashboard/daily")
async def get_dashboard_daily(
    period: str = "30",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Daily breakdown for charts"""
    if start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
    else:
        days = _parse_period_to_days(period)
        end = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        start = end - timedelta(days=days)
    
    orders = await _get_orders_in_range(start, end)
    
    # Group by day
    daily_data = defaultdict(lambda: {"orders": 0, "revenue": 0, "cost": 0, "items": 0})
    
    for order in orders:
        if order.get("status") in ["cancelled", "refunded"]:
            continue
        
        created_at = order.get("created_at")
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except:
                continue
        
        if created_at:
            day_key = created_at.strftime("%Y-%m-%d")
            daily_data[day_key]["orders"] += 1
            daily_data[day_key]["revenue"] += order.get("total", 0)
            
            for item in order.get("items", []):
                qty = item.get("quantity", 1)
                daily_data[day_key]["items"] += qty
                product_id = item.get("product_id")
                if product_id:
                    product = await db.products.find_one({"id": product_id}, {"cost_price": 1})
                    if product and product.get("cost_price"):
                        daily_data[day_key]["cost"] += product["cost_price"] * qty
    
    # Build array for all days in range
    result = []
    current = start
    while current < end:
        day_key = current.strftime("%Y-%m-%d")
        data = daily_data.get(day_key, {"orders": 0, "revenue": 0, "cost": 0, "items": 0})
        profit = data["revenue"] - data["cost"]
        result.append({
            "date": day_key,
            "orders": data["orders"],
            "revenue": round(data["revenue"], 2),
            "cost": round(data["cost"], 2),
            "profit": round(profit, 2),
            "items": data["items"]
        })
        current += timedelta(days=1)
    
    return result


@router.get("/dashboard/products")
async def get_dashboard_products(
    period: str = "30",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 10
):
    """Top products for the dashboard"""
    if start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
    else:
        days = _parse_period_to_days(period)
        end = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        start = end - timedelta(days=days)
    
    orders = await _get_orders_in_range(start, end)
    
    # Aggregate product data
    product_data = defaultdict(lambda: {"units_sold": 0, "revenue": 0, "cost": 0, "name": ""})
    
    for order in orders:
        if order.get("status") in ["cancelled", "refunded"]:
            continue
        
        for item in order.get("items", []):
            product_id = item.get("product_id", item.get("id", "unknown"))
            name = item.get("name", "Unknown Product")
            qty = item.get("quantity", 1)
            price = item.get("price", 0)
            
            product_data[product_id]["name"] = name
            product_data[product_id]["units_sold"] += qty
            product_data[product_id]["revenue"] += price * qty
            
            # Get cost from product database
            if product_id != "unknown":
                product = await db.products.find_one({"id": product_id}, {"cost_price": 1})
                if product and product.get("cost_price"):
                    product_data[product_id]["cost"] += product["cost_price"] * qty
    
    # Calculate profit and margin, then sort
    products_list = []
    for pid, data in product_data.items():
        profit = data["revenue"] - data["cost"]
        margin = round((profit / data["revenue"]) * 100, 1) if data["revenue"] > 0 else 0
        products_list.append({
            "product_id": pid,
            "name": data["name"],
            "units_sold": data["units_sold"],
            "revenue": round(data["revenue"], 2),
            "cost": round(data["cost"], 2),
            "profit": round(profit, 2),
            "margin": margin
        })
    
    # Sort by revenue descending
    products_list.sort(key=lambda x: x["revenue"], reverse=True)
    
    return products_list[:limit]


@router.get("/dashboard/orders-breakdown")
async def get_dashboard_orders_breakdown(
    period: str = "30",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Orders breakdown by status"""
    if start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
    else:
        days = _parse_period_to_days(period)
        end = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        start = end - timedelta(days=days)
    
    orders = await _get_orders_in_range(start, end)
    
    status_counts = defaultdict(int)
    status_revenue = defaultdict(float)
    
    for order in orders:
        status = order.get("status", "pending")
        status_counts[status] += 1
        status_revenue[status] += order.get("total", 0)
    
    return {
        "total": len(orders),
        "by_status": {
            status: {
                "count": status_counts[status],
                "revenue": round(status_revenue[status], 2)
            }
            for status in status_counts
        },
        "completed": status_counts.get("completed", 0) + status_counts.get("shipped", 0) + status_counts.get("delivered", 0),
        "pending": status_counts.get("pending", 0) + status_counts.get("processing", 0),
        "cancelled": status_counts.get("cancelled", 0),
        "refunded": status_counts.get("refunded", 0)
    }


@router.get("/dashboard/report")
async def get_dashboard_report(
    period: str = "30",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Generate full report for export"""
    # Get all data
    stats = await get_dashboard_stats(period, start_date, end_date)
    daily = await get_dashboard_daily(period, start_date, end_date)
    products = await get_dashboard_products(period, start_date, end_date, limit=20)
    
    # Calculate period
    if start_date and end_date:
        start = start_date
        end = end_date
    else:
        days = _parse_period_to_days(period)
        end_dt = datetime.now(timezone.utc)
        start_dt = end_dt - timedelta(days=days)
        start = start_dt.strftime("%Y-%m-%d")
        end = end_dt.strftime("%Y-%m-%d")
    
    return {
        "period": {
            "start": start,
            "end": end
        },
        "summary": stats,
        "top_products": products,
        "daily_breakdown": daily
    }
