# 123Bots Backend System — Integration Guide

## Overview
This is a **FastAPI + MongoDB** backend powering a commercial cleaning robot CRM, e-commerce, and lead management platform. It runs on **Python 3.11+** with **Motor** (async MongoDB driver).

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URL and DB name

# 3. Run the server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

---

## Environment Variables (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URL` | YES | MongoDB connection string (e.g., `mongodb://localhost:27017`) |
| `DB_NAME` | YES | Database name (e.g., `123bots`) |
| `CORS_ORIGINS` | YES | CORS allowed origins (`*` for all) |
| `JWT_SECRET_KEY` | Auto-generated | JWT signing secret (auto-generated if missing) |
| `SMTP_HOST` | Optional | SMTP server for email sending |
| `SMTP_PORT` | Optional | SMTP port (default 587) |
| `SMTP_USER` | Optional | SMTP username |
| `SMTP_PASSWORD` | Optional | SMTP password |
| `SMTP_FROM_EMAIL` | Optional | From email address |

---

## Architecture

### Entry Point: `server.py`
- Creates the FastAPI app, connects to MongoDB, registers all routers
- Seeds super admin user on startup
- Seeds default pipeline on startup
- Initializes background scheduler (APScheduler)

### Authentication: `auth.py`
- JWT-based auth with bcrypt password hashing
- Roles: `super_admin`, `admin`, `user`
- Login: `POST /api/auth/login` → returns `{ access_token, token_type, user }`
- Register: `POST /api/auth/register`
- All admin endpoints require `Authorization: Bearer <token>` header
- Default super admin: seeded in `server.py` startup

### Database Pattern
Every module follows the same pattern:
```python
router = APIRouter(prefix="/api/module-name", tags=["Module"])
_db = None
def set_database(database):
    global _db
    _db = database
```
The `server.py` calls `set_database(db)` after connecting to MongoDB.

---

## Module Reference

### Core CRM

| Module | File | Prefix | Description |
|--------|------|--------|-------------|
| **Leads/Opportunities** | `leads.py` | `/api/leads` | Kanban pipeline, lead CRUD, CSV import/export, drag-and-drop status updates, convert-to-client |
| **Leads Settings** | `leads_settings.py` | `/api/leads-settings` | Lead form configuration |
| **Contacts** | `contacts_routes.py` | `/api/contacts` | Contact management with organization, business phone, admin global visibility |
| **Calendar** | `calendar_routes.py` | `/api/calendars` | Calendar events and scheduling |
| **Tasks** | `tasks_routes.py` | `/api/tasks` | Task management |
| **Booking** | `booking_routes.py` | `/api/booking` | Multi-user booking system with public booking pages, meeting types (physical/online/SaySMe) |
| **Booking Provisioning** | `booking_provisioning.py` | — | Auto-provisions booking settings for new users |

### External Stack API Delivery

| Module | File | Prefix | Description |
|--------|------|--------|-------------|
| **External API** | `external_api.py` | `/api/external-api` | Multi-source lead ingestion API. Each source gets unique auth header + token. Optional email forwarding. |
| **Pipelines** | `external_api.py` | `/api/pipelines` | Custom pipeline CRUD. Create/edit/delete pipelines with configurable stages and colors. |

**Key Endpoints:**
- `GET /api/pipelines/` — List all pipelines
- `POST /api/pipelines/` — Create pipeline with stages `[{label, color, bar_color}]`
- `PUT /api/pipelines/{id}` — Update pipeline
- `DELETE /api/pipelines/{id}` — Delete (cannot delete default)
- `GET /api/external-api/sources` — List API sources
- `POST /api/external-api/sources` — Create source (auto-generates auth token)
- `POST /api/external-api/sources/{id}/regenerate-token` — New token
- `POST /api/external-api/leads` — **Public endpoint** for external CRMs to push leads. Auth via source's custom header + token.

### Quotes / Contracts / eSign

| Module | File | Prefix | Description |
|--------|------|--------|-------------|
| **Quote/Contract/eSign** | `quote_contract_esign_routes.py` | `/api/quotes` | Quote builder, contract templates, electronic signatures, quote-specific product/service catalogs |

### Inventory Management

| Module | File | Prefix | Description |
|--------|------|--------|-------------|
| **Inventory** | `inventory_management.py` | `/api/inventory` | Stock levels, manufacturers, reorder points, purchase orders, order recommendations |
| **Scheduler** | `scheduler.py` | — | APScheduler for weekly Monday 8AM inventory email reports |

### E-Commerce & Payments

| Module | File | Prefix | Description |
|--------|------|--------|-------------|
| **E-Commerce** | `ecommerce.py` | `/api/ecommerce` | Product catalog, categories, cart, checkout |
| **Storage Rentals** | `storage_rentals.py` | `/api/storage` | Storage unit rentals with Stripe integration |
| **Durango Payments** | `durango_payments.py` | `/api/durango` | Payment processing |
| **Shipping** | `shipping.py` | `/api/shipping` | Shipping calculations and management |
| **Abandoned Carts** | `abandoned_carts.py` | `/api/abandoned-carts` | Cart recovery emails |

### Admin & Settings

| Module | File | Prefix | Description |
|--------|------|--------|-------------|
| **Admin Settings** | `admin_settings.py` | `/api/admin-settings` (admin) `/api/settings` (public) | Feature flags, business info, commission, session settings, site settings |
| **User Management** | `user_management.py` | `/api/users` | User CRUD, staff management, role assignment |
| **Human Resources** | `human_resources.py` | `/api/hr` | Employee management |

### Content & SEO

| Module | File | Prefix | Description |
|--------|------|--------|-------------|
| **Research Library** | `research_library.py` | `/api/research` | SEO articles with categories, tags, search. 81 robot cleaning articles seeded. |
| **Knowledgebase** | `knowledgebase.py` | `/api/knowledgebase` | Knowledge base articles |
| **Sitemap** | `sitemap.py` + `sitemap_generator.py` | `/api/sitemap` | Dynamic XML sitemap generation |
| **Location Generator** | `location_generator.py` | `/api/locations` | Location-based landing pages |
| **Mega Menu** | `mega_menu.py` | `/api/mega-menu` | Dynamic navigation menu |

### Integrations

| Module | File | Prefix | Description |
|--------|------|--------|-------------|
| **Printful** | `printful_integration.py` | `/api/printful` | Print-on-demand fulfillment |
| **YOYCOL** | `yoycol_integration.py` | `/api/yoycol` | Custom product fulfillment |
| **Johnny 5 Portal** | `johnny5_portal.py` | `/api/johnny5` | Multi-store management portal |

### Communication

| Module | File | Prefix | Description |
|--------|------|--------|-------------|
| **Email Utils** | `email_utils.py` | — | SMTP email sending, 2FA emails, verification emails |
| **Email Templates** | `email_templates.py` | `/api/email-templates` | Customizable email templates |
| **Chat** | `chat_routes.py` | `/api/chat` | Live chat system |
| **Radio** | `radio_routes.py` | `/api/radio` | Internet radio streaming |
| **And...Go** | `andgo_routes.py` | `/api/goto-links` | Short link management |

---

## Database Collections (MongoDB)

### Core
- `users` — User accounts (admin, staff, customers)
- `leads` — Opportunities/leads with full CRM fields (25+ columns)
- `contacts` — Business contacts with organization, phone
- `customers` — Customer records (converted from leads)
- `customer_settings` — Per-customer configuration

### Pipelines & External API
- `pipelines` — Custom pipeline definitions with stages
- `external_api_sources` — API source credentials for lead ingestion

### Commerce
- `products` — Product catalog
- `categories` — Product categories
- `orders` — Order records
- `carts` — Shopping carts
- `abandoned_carts` — Abandoned cart tracking

### Quotes
- `quotes` — Quote documents
- `contract_templates` — Contract templates
- `quote_products` — Quote-specific product catalog
- `quote_services` — Quote-specific service catalog
- `quote_config` — Quote form configuration

### Inventory
- `inventory_items` — Stock levels, SKU, reorder points
- `manufacturers` — Manufacturer lead times and contacts
- `purchase_orders` — Purchase order tracking
- `stock_adjustments` — Stock adjustment history

### Content
- `research_articles` — SEO articles
- `knowledgebase_articles` — KB articles
- `locations` — Location landing pages
- `mega_menu` — Navigation structure

### Settings
- `admin_settings` — Feature flags, business settings, session config (type-keyed documents)
- `booking_settings` — Per-user booking configuration
- `booking_meetings` — Scheduled meetings

---

## Feature Flags

Stored in `admin_settings` collection with `type: "feature_flags"`. Key flags:

| Flag | Default | Controls |
|------|---------|----------|
| `cart_enabled` | true | Shopping cart visibility |
| `quotes_enabled` | true | Quote system visibility |
| `external_api_enabled` | true | External API sidebar and features |
| `inventory_enabled` | false | Inventory Management sidebar |
| `coming_soon_enabled` | true | Password gate on public site |
| `coming_soon_password` | "8487" | Gate password |
| `owner_chat_enabled` | false | Live chat in admin |
| `printful_enabled` | false | Printful integration |
| `yoycol_enabled` | false | YOYCOL integration |

---

## Leads/Opportunities Pipeline

### Default Pipeline Stages (Kanban columns)
1. **Cold Call** (id: `cold_call`)
2. **Build Interest** (id: `build_interest`)
3. **Interested/Waiting** (id: `interested_waiting`)
4. **Demo** (id: `demo`)
5. **Proposal Sent** (id: `proposal_sent`)
6. **Waiting on Leadership** (id: `waiting_leadership`)
7. **Closed** (id: `closed`)

### Lead Document Schema
```json
{
  "id": "uuid",
  "name": "Contact Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "status": "cold_call",
  "pipeline_id": "pipeline-uuid",
  "opportunity_name": "Deal Name",
  "business_name": "Company Inc",
  "opportunity_value": 50000.00,
  "opportunity_source": "Cold Call",
  "opportunity_status": "Open",
  "stage": "Cold Call",
  "pipeline": "001. Main Leads Pipeline",
  "primary_contact_name": "John Doe",
  "primary_email": "john@example.com",
  "primary_phone": "+1234567890",
  "owner_id": "user-uuid",
  "assigned": "Staff Name",
  "followers": ["user-uuid"],
  "tags": ["tag1", "tag2"],
  "notes": "Free text notes",
  "notes_timeline": [{"text": "...", "date": "..."}],
  "tasks": [{"title": "...", "done": false}],
  "appointments": [{"date": "...", "title": "...", "location_type": "physical"}],
  "payments": [{"amount": 100, "status": "Paid"}],
  "associated_objects": [{"type": "...", "reference": "..."}],
  "engagement_score": 85.0,
  "lost_reason_name": "",
  "external_opportunity_id": "",
  "external_contact_id": "",
  "converted_to_client": false,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

### Key Lead Endpoints
- `GET /api/leads/` — All leads grouped by status columns
- `POST /api/leads/` — Create lead (public, used by contact forms)
- `PUT /api/leads/{id}` — Update lead (admin)
- `PATCH /api/leads/{id}/status` — Drag-and-drop status change
- `POST /api/leads/{id}/convert-to-client` — Convert to customer
- `POST /api/leads/import` — CSV bulk import (25+ columns)
- `GET /api/leads/export/csv` — CSV export

---

## Startup Sequence (server.py)

1. Load `.env` via `dotenv`
2. Connect to MongoDB via Motor
3. Create FastAPI app with CORS middleware
4. Import and register all module routers
5. Call `set_database(db)` for each module
6. On startup event:
   - Seed super admin user
   - Seed default pipeline
   - Backfill leads without `pipeline_id`
   - Seed research articles
   - Sync product catalog
   - Initialize APScheduler

---

## Integration Instructions for AI

When integrating this backend into another stack:

1. **Install Python 3.11+** and run `pip install -r requirements.txt`
2. **Set up MongoDB** and configure `MONGO_URL` and `DB_NAME` in `.env`
3. **server.py is the entry point** — it wires everything together
4. **Each module is self-contained** — you can include/exclude modules by commenting out their `include_router` lines in `server.py`
5. **Auth is required** for all admin endpoints — login first via `POST /api/auth/login` to get a JWT token
6. **Feature flags** control which features are visible — update via `PUT /api/admin-settings/feature-flags`
7. **The frontend expects all API routes prefixed with `/api`** — this is handled by router prefixes
8. **MongoDB ObjectId handling** — all endpoints exclude `_id` from responses using `{"_id": 0}` projection
9. **Email is optional** — SMTP config in `.env`. If not configured, email functions silently skip.
10. **Background tasks** — `scheduler.py` uses APScheduler for cron jobs (weekly inventory reports)

### To add a new module:
```python
# 1. Create your_module.py with:
router = APIRouter(prefix="/api/your-module", tags=["Your Module"])
_db = None
def set_database(database):
    global _db
    _db = database

# 2. In server.py, add:
from your_module import router as your_router, set_database as set_your_db
set_your_db(db)
app.include_router(your_router)
```

---

## Test Credentials
- **Super Admin**: `mel@a2gdesigns.com` / `BigDaddy2016!!`
- **Site Password** (Coming Soon gate): `8487`

## Running Tests
```bash
cd tests/
pytest -v
```
