import asyncio, os, uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv()

import shipping

db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
shipping.set_database(db)

FAKE_RATE = {
    "provider": "shippo", "rate_id": "rate_fake", "carrier": "USPS",
    "service": "Priority Mail", "rate": 8.50,
}

async def _fake_rates(settings, rate_request):
    return [FAKE_RATE]

async def seed_order():
    oid = f"TEST-SHIP-{uuid.uuid4().hex[:6]}"
    await db.orders.insert_one({
        "id": oid, "order_number": oid, "customer_name": "Ship Test",
        "customer_email": "ship@test.com",
        "items": [{"product_id": "p1", "name": "Bot", "price": 10.0, "quantity": 1, "item_type": "product"}],
        "shipping": {"address1": "1 Main St", "city": "Dothan", "state": "AL", "zipCode": "36301", "country": "US"},
        "selected_shipping": {"carrier": "USPS", "service": "Priority Mail", "rate": 8.5},
        "subtotal": 10.0, "tax": 0.0, "total": 18.5, "status": "processing",
        "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return oid

async def main():
    shipping._fetch_all_rates = _fake_rates
    results = []

    # --- CASE 1: Shippo returns ERROR status (payment/funding failure) ---
    async def create_label_error(self, rate_id):
        return {"label_id": "tx_err", "tracking_number": None, "label_url": None,
                "cost": 0, "status": "ERROR",
                "messages": [{"text": "Insufficient funds in your Shippo account."}]}
    shipping.ShippoClient.create_label = create_label_error
    oid = await seed_order()
    res = await shipping.create_label_for_order(oid)
    order = await db.orders.find_one({"id": oid}, {"_id": 0})
    ok1 = (res.get("success") is False and res.get("shipment_pending") is True
           and order["status"] == "shipment_pending" and order.get("shipping_error")
           and not order.get("tracking_number"))
    results.append(("ERROR status -> shipment_pending", ok1, res.get("error")))
    await db.orders.delete_one({"id": oid})

    # --- CASE 2: HTTP 200 but no tracking number ---
    async def create_label_notrack(self, rate_id):
        return {"label_id": "tx_nt", "tracking_number": "", "label_url": None, "cost": 0,
                "status": "SUCCESS", "messages": []}
    shipping.ShippoClient.create_label = create_label_notrack
    oid = await seed_order()
    res = await shipping.create_label_for_order(oid)
    order = await db.orders.find_one({"id": oid}, {"_id": 0})
    ok2 = (res.get("shipment_pending") is True and order["status"] == "shipment_pending"
           and not order.get("tracking_number"))
    results.append(("No tracking -> shipment_pending", ok2, res.get("error")))
    await db.orders.delete_one({"id": oid})

    # --- CASE 3: provider raises exception ---
    async def create_label_raise(self, rate_id):
        raise RuntimeError("Connection refused / payment declined")
    shipping.ShippoClient.create_label = create_label_raise
    oid = await seed_order()
    res = await shipping.create_label_for_order(oid)
    order = await db.orders.find_one({"id": oid}, {"_id": 0})
    ok3 = (res.get("shipment_pending") is True and order["status"] == "shipment_pending")
    results.append(("Exception -> shipment_pending", ok3, res.get("error")))
    await db.orders.delete_one({"id": oid})

    # --- CASE 4: SUCCESS with real tracking + label -> shipped ---
    async def create_label_ok(self, rate_id):
        return {"label_id": "tx_ok", "tracking_number": "9400111899", "label_url": "http://label.pdf",
                "cost": 8.5, "status": "SUCCESS", "messages": []}
    shipping.ShippoClient.create_label = create_label_ok
    oid = await seed_order()
    res = await shipping.create_label_for_order(oid)
    order = await db.orders.find_one({"id": oid}, {"_id": 0})
    ok4 = (res.get("success") is True and order["status"] == "shipped"
           and order.get("tracking_number") == "9400111899"
           and order.get("shipping_error") in (None,))
    results.append(("SUCCESS -> shipped", ok4, order.get("status")))
    await db.orders.delete_one({"id": oid})
    # cleanup any failed label records
    await db.shipping_labels.delete_many({"order_id": {"$regex": "^TEST-SHIP-"}})

    print("\n=== SHIPMENT PENDING SAFEGUARD TESTS ===")
    allpass = True
    for name, ok, detail in results:
        print(f"[{'PASS' if ok else 'FAIL'}] {name}  ({detail})")
        allpass = allpass and ok
    print("ALL PASS" if allpass else "SOME FAILED")

asyncio.run(main())
