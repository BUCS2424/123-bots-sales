# 123Bots CRM Module — Integration Guide

A portable CRM / Opportunities package extracted from the 123Bots app, ready to drop into
another **Emergent (FastAPI + React + MongoDB)** application.

## What's included

**Opportunities / Kanban CRM** with everything attached:
- Opportunity (Lead) details, add/manage **custom fields**, **convert-to-client**
- **Pipelines / Kanban stages** (drag-and-drop)
- **Book / Update Appointment** (calendar + booking system)
- **Quotes / Contracts / eSignature**
- **Tasks**, **Notes**
- **Associated Objects** (Contacts)
- CSV import / export
- External Stack API delivery (lead intake endpoints)

> **Payments are intentionally NOT included** (per request). The Payments tab in the
> opportunity workspace UI will call payment endpoints that won't exist until you wire your
> own. Everything else works standalone. See "Payments" note at the bottom.

---

## Directory layout

```
backend/                          # FastAPI routers (copy into your backend/)
  leads.py                        # Opportunities/Leads CRUD, notes, convert-to-client, import/export
  leads_settings.py               # Lead/opportunity settings + custom field config
  external_api.py                 # Pipelines/Kanban stages router + External Stack API
  calendar_routes.py              # Calendar events
  booking_routes.py               # Booking pages / appointment scheduling
  booking_provisioning.py         # Booking helper (default availability, slugs) — used by booking_routes
  tasks_routes.py                 # Tasks
  contacts_routes.py              # Contacts (Associated Objects)
  quote_contract_esign_routes.py  # Quotes / contracts / eSign flow
  esignature.py                   # E-signature capture + storage
  email_utils.py                  # Shared SMTP send helper (reads admin_settings.type='smtp')
  auth_reference.py               # REFERENCE ONLY — the auth contract these modules expect

frontend/src/                     # React (copy into your frontend/src/, merge folders)
  pages/admin/AdminLeadsKanban.jsx     # THE opportunity workspace (details, appt, quotes, tasks, notes, payments tab, associated objects, add/manage fields, convert-to-client)
  pages/admin/PipelinesPage.jsx        # Kanban pipeline/stage manager
  pages/admin/ExternalApiSourcesPage.jsx
  pages/admin/AdminLeadsConfig.jsx
  pages/admin/AdminLeadsSettings.jsx
  pages/A2GContactsPage.jsx            # Contacts list (Associated Objects)
  pages/A2GContactDetailPage.jsx       # Contact detail
  pages/A2GBookingSettingsPage.jsx     # Booking configuration
  pages/quotes/*.jsx                   # Quote builder, workspace, contracts, signing, catalog settings
  components/quotes/*.jsx              # Quote/contract editor + invoice modal + calculator
  components/ui/*                      # shadcn/ui primitives (safe to skip if you already have them)
  lib/apiClient.js                     # axios instance (baseURL = REACT_APP_BACKEND_URL/api, Bearer token)
  lib/utils.js                         # cn() helper used by shadcn ui
  hooks/use-toast.js
  hooks/useSiteFeatureFlags.js         # reads /api/settings/site + /api/settings/feature-flags (has safe defaults)
```

---

## BACKEND integration

### 1. Copy files
Copy everything in `backend/` into your app's `backend/` directory **except** `auth_reference.py`
(that's documentation — see step 3).

### 2. Python dependencies
These modules rely on packages that a standard Emergent FastAPI app already has. Confirm/add:
```
fastapi
motor            # async MongoDB driver (the injected `db` is a motor database)
pydantic
python-jose      # JWT (used by the auth contract)
passlib[bcrypt]  # password hashing (convert-to-client)
```
Install then freeze:
```
pip install python-jose "passlib[bcrypt]" && pip freeze > backend/requirements.txt
```

### 3. Auth contract (you chose: wire into your existing auth)
Every router imports these from a module named `auth`:
```python
from auth import decode_token, is_admin_or_above, get_password_hash, UserRole
```
Your existing `auth.py` must expose:
- `decode_token(token: str) -> TokenData`  — returns an object with `.user_id`, `.email`, `.role`
- `is_admin_or_above(role: str) -> bool`
- `get_password_hash(password: str) -> str`  — used by convert-to-client to create a client login
- `UserRole` — class/enum with `SUPER_ADMIN`, `ADMIN`, `STAFF`, `USER`

See `auth_reference.py` for the exact signatures/implementation from the source app.
If your function names differ, either add thin aliases in your `auth.py` or edit the
`from auth import ...` line at the top of each router.

`decode_token` is typically read from a `Bearer` token in the `Authorization` header (the
frontend `apiClient` sends `Authorization: Bearer <localStorage token>`).

### 4. Wire routers into your `server.py`
Import, inject the Mongo `db`, and register. Paste this near your other router registrations
(`db` = your `AsyncIOMotorClient[DB_NAME]`):

```python
# ---- Shared email helper (reads SMTP from admin_settings; optional) ----
from email_utils import set_database as set_email_db
set_email_db(db)

# ---- CRM: Opportunities / Leads ----
from leads import router as leads_router, set_database as set_leads_db
set_leads_db(db)
app.include_router(leads_router)                     # already prefixed /api/leads

from leads_settings import router as leads_settings_router, set_database as set_leads_settings_db
set_leads_settings_db(db)
app.include_router(leads_settings_router, prefix="/api")   # -> /api/leads-settings

# ---- Pipelines / Kanban + External Stack API ----
from external_api import (
    router as external_api_router,
    pipelines_router,
    set_database as set_external_api_db,
    ensure_default_pipeline,
)
set_external_api_db(db)
app.include_router(external_api_router)              # /api/external-api
app.include_router(pipelines_router)                 # /api/pipelines

# ---- Contacts (Associated Objects) / Calendar / Tasks ----
from contacts_routes import router as contacts_router, set_database as set_contacts_db
set_contacts_db(db)
app.include_router(contacts_router, prefix="/api")   # -> /api/contacts

from calendar_routes import router as calendar_router, set_database as set_calendar_db
set_calendar_db(db)
app.include_router(calendar_router, prefix="/api")

from tasks_routes import router as tasks_router, set_database as set_tasks_db
set_tasks_db(db)
app.include_router(tasks_router, prefix="/api")

# ---- Booking / Appointments ----
from booking_routes import router as booking_router, set_database as set_booking_db
set_booking_db(db)
app.include_router(booking_router, prefix="/api")    # -> /api/booking

# ---- Quotes / Contracts / eSign ----
from quote_contract_esign_routes import router as qce_router, set_database as set_qce_db
set_qce_db(db)
app.include_router(qce_router, prefix="/api")

from esignature import router as esignature_router, set_database as set_esignature_db
set_esignature_db(db)
app.include_router(esignature_router, prefix="/api") # -> /api/esignature
```

### 5. Seed the default pipeline (recommended) at startup
```python
@app.on_event("startup")
async def _seed_crm():
    await ensure_default_pipeline()   # imported from external_api above
```

### 6. Environment variables (backend/.env)
- `MONGO_URL`, `DB_NAME` — your existing Mongo connection (do not hardcode)
- `JWT_SECRET_KEY` — used by the auth layer (keep consistent with your app's auth)
- **SMTP is optional** and read at runtime from Mongo (`admin_settings` doc `{type: "smtp"}`).
  If absent, email sends (appointment confirmations, quote emails) simply no-op / log — the CRM
  still works. To enable email, insert an `admin_settings` doc with SMTP host/port/user/pass.

### MongoDB collections created/used
`leads`, `pipelines`, `lead_settings`, `contacts`, `calendar_events`, `tasks`,
`booking_profiles` / `bookings`, `quotes`, `contracts`, `esignatures`,
`external_api_sources`, and `users` (convert-to-client creates a client user).
No manual schema setup needed — documents are created on demand (UUID string `id` fields).

---

## FRONTEND integration

### 1. Copy files
Merge `frontend/src/*` into your app's `frontend/src/*`. If you already have `components/ui`,
`lib/utils.js`, or `hooks/use-toast.js`, keep yours and skip the duplicates.

### 2. Node dependencies (yarn)
```
yarn add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
         @tiptap/core @tiptap/pm @tiptap/react @tiptap/starter-kit \
         @tiptap/extension-color @tiptap/extension-highlight \
         @tiptap/extension-text-align @tiptap/extension-text-style @tiptap/extension-underline \
         react-signature-canvas axios sonner lucide-react
```
Plus (usually already present in an Emergent React app): `react-router-dom`, `clsx`,
`tailwind-merge`, `class-variance-authority`, `date-fns`, `framer-motion`, `recharts`,
and the `@radix-ui/*` packages backing `components/ui`.

### 3. Path alias
`components/ui/*` import from `@/lib/utils`. Ensure your `jsconfig.json` / `craco.config.js`
maps `@/*` -> `src/*` (standard in Emergent React apps):
```json
{ "compilerOptions": { "baseUrl": "src", "paths": { "@/*": ["src/*"] } } }
```

### 4. Environment
- `frontend/.env` -> `REACT_APP_BACKEND_URL` (the `apiClient` calls `${REACT_APP_BACKEND_URL}/api`).

### 5. Routing (wire the pages into your admin router)
The source app used a switch inside `AdminLayout.jsx`. Replicate with your router of choice.
Suggested routes:
```jsx
import AdminLeadsKanban from './pages/admin/AdminLeadsKanban';
import PipelinesPage from './pages/admin/PipelinesPage';
import ExternalApiSourcesPage from './pages/admin/ExternalApiSourcesPage';
import A2GContactsPage from './pages/A2GContactsPage';
import A2GContactDetailPage from './pages/A2GContactDetailPage';
import A2GBookingSettingsPage from './pages/A2GBookingSettingsPage';
import QuoteWorkspacePage from './pages/quotes/QuoteWorkspacePage';
import AdminContractsPage from './pages/quotes/AdminContractsPage';
import QuoteBuilderPage from './pages/quotes/QuoteBuilderPage';
import QuoteCatalogSettingsPage from './pages/quotes/QuoteCatalogSettingsPage';

// Opportunities / Kanban (main workspace)
<Route path="/admin/leads" element={<AdminLeadsKanban />} />
<Route path="/admin/external-api/pipelines" element={<PipelinesPage />} />
<Route path="/admin/external-api/sources" element={<ExternalApiSourcesPage />} />
// Associated Objects (Contacts)
<Route path="/admin/contacts" element={<A2GContactsPage />} />
<Route path="/admin/contacts/:contactId" element={<A2GContactDetailPage />} />
// Booking / Appointments
<Route path="/admin/booking" element={<A2GBookingSettingsPage />} />
// Quotes / Contracts / eSign
<Route path="/admin/quotes-contracts-esign" element={<QuoteWorkspacePage />} />
<Route path="/admin/quotes-contracts-esign/contracts" element={<AdminContractsPage />} />
<Route path="/admin/quotes/settings" element={<QuoteCatalogSettingsPage />} />
<Route path="/admin/quotes/builder/:leadId" element={<QuoteBuilderPage />} />
```
> Note: `AdminLeadsKanban.jsx` imports `QuoteBuilderPage` directly and uses
> `useSiteFeatureFlags()`; both are in the package. `AdminContractsPage` uses TipTap
> (`ContractEditor.jsx`) and eSign uses `react-signature-canvas`.

### 6. Feature flags (optional)
`useSiteFeatureFlags` fetches `/api/settings/site` and `/api/settings/feature-flags`. If those
endpoints don't exist in your app, it falls back to **safe defaults** (`quotes_enabled: true`,
`external_api_enabled: true`), so the CRM renders fine. To gate features, add those endpoints
(from `admin_settings`) or hardcode the flags in the hook.

---

## Payments (excluded — how to re-enable later)
The opportunity workspace has a **Payments** tab. Its backend (`durango_payments.py`, Stripe +
PayPal) was excluded because it's tightly coupled to the e-commerce/orders system. Until you
wire a payments backend, that tab's network calls will 404 (the rest of the workspace is
unaffected). To add it later, port `durango_payments.py` and register its router, or point the
Payments tab at your own payment endpoints.

## Quick smoke test after wiring
```
# backend up?
curl $REACT_APP_BACKEND_URL/api/pipelines            # expect [] or default pipeline
curl $REACT_APP_BACKEND_URL/api/leads -H "Authorization: Bearer <token>"
```
Then open `/admin/leads` in the UI — you should see the Kanban board with the default pipeline.
