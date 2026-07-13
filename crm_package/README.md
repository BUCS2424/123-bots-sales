# 123Bots CRM Module

Portable Opportunities / Kanban CRM (details, appointments, quotes, tasks, notes,
associated objects, custom fields, convert-to-client) + calendar & booking + quotes/contracts/eSign,
for FastAPI + React + MongoDB (Emergent) apps.

👉 **Start here:** [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md)

- `backend/`  — FastAPI routers (drop into your `backend/`)
- `frontend/` — React pages/components (merge into your `frontend/src/`)

Payments backend is intentionally excluded (the UI Payments tab is inert until you wire your own).
Auth is wired into your existing auth layer — see the "Auth contract" section in the guide
(`backend/auth_reference.py` shows the exact functions expected).
