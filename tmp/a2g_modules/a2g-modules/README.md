# A2G Communicator — Module Package
## AI Integration Guide

> **For AI agents**: This package contains 6 self-contained React + FastAPI modules extracted from a production app.
> Each module has its own `/frontend` and `/backend` folder. Follow the integration steps below for each module.
> The app uses: **React + TailwindCSS + shadcn/ui** (frontend), **FastAPI + Motor + MongoDB** (backend), **JWT auth**.

---

## Quick Reference — All Modules

| Module | Frontend Files | Backend File | DB Collections | Key Endpoints |
|--------|---------------|--------------|----------------|---------------|
| Contacts | ContactsPage.jsx, ContactDetailPage.jsx | contacts_routes.py | `contacts` | GET/POST/PUT/DELETE /contacts |
| Calendar | CalendarPage.jsx | calendar_routes.py | `calendar_events`, `calendars`, `event_categories` | GET /calendars/events, POST /calendars/events |
| Tasks | TasksPage.jsx | tasks_routes.py | `tasks`, `task_comments` | GET/POST/PUT/DELETE /tasks |
| Radio | RadioPage.jsx, RadioContext.jsx | radio_routes.py | none (proxy) | GET /radio/featured, GET /radio/search, GET /radio/tune |
| And...Go | AndGoPage.jsx | andgo_routes.py | `goto_links` | GET/POST/PUT/DELETE /goto-links |
| Book Meeting | BookingSettingsPage.jsx, PublicBookingPage.jsx | booking_routes.py | `booking_settings`, `booked_meetings` | GET/POST /booking/settings, GET /booking/public/:slug |

---

## Architecture Pattern (same across all modules)

```
Frontend (React):
  - Uses apiClient (axios instance) with JWT Bearer token
  - Token stored in localStorage as 'token'
  - Import: import { apiClient } from "../App"
  - Import auth: import { useAuth } from "../App"

Backend (FastAPI):
  - All routes prefixed with /api via api_router = APIRouter(prefix="/api")
  - Auth via: current_user = Depends(get_current_user)
  - DB via: db = AsyncIOMotorClient(MONGO_URL)[DB_NAME]
  - IDs: uuid.uuid4() strings (not MongoDB ObjectIds)
  - Timestamps: datetime.now(timezone.utc).isoformat()
  - All responses exclude _id field

Required backend imports:
  from fastapi import APIRouter, Depends, HTTPException
  from motor.motor_asyncio import AsyncIOMotorClient
  from pydantic import BaseModel
  from typing import Optional, List
  import uuid
  from datetime import datetime, timezone
```

---

## MODULE 1: Contacts

### What it does
Full CRM-style contact database with 25+ fields, A-Z search, import/export (JSON/CSV/VCF), contact detail pages with tabs (Overview, All Data, Edit, Notes, Activity).

### Data Model
```python
Contact {
  id: str (uuid)
  user_id: str
  name: str                    # derived from first_name + last_name
  first_name, last_name: str
  display_name, nickname, gender, birthdate: str
  email, email2, email3: str
  mobile_phone, home_phone, business_phone: str
  home_fax, business_fax, pager: str
  organization, job_title, department: str
  street, address2, city, state, postal_code: str
  contact_type: str            # "family" | "friend" | "business"
  status: str                  # "active" | "inactive" | "prospect" | "lead" | "closed"
  grade: str                   # "A" | "B" | "C" | "D"
  tags: List[str]
  lead_score, budget, assigned_to, source: str
  notes: str
  created_at, updated_at: str  # ISO datetime
}
```

### Routes
- `GET /api/contacts` → List all user contacts
- `GET /api/contacts/{id}` → Get single contact
- `POST /api/contacts` → Create contact
- `PUT /api/contacts/{id}` → Update contact (all fields)
- `DELETE /api/contacts/{id}` → Delete contact
- `GET /api/contacts/export` → Export as JSON
- `GET /api/contacts/export/csv` → Export as CSV
- `GET /api/contacts/export/vcf` → Export as VCF
- `POST /api/contacts/import` → Bulk import (JSON/CSV/VCF)

### Frontend Routes
- `/contacts` → ContactsPage (list)
- `/contacts/:contactId` → ContactDetailPage (full profile)

### Key Features
- Live search on every keystroke (name, email, company)
- A-Z alphabet bar (0-9 then A-Z, indexed by first name)
- Category filter (Family/Friend/Business) + Status filter
- Birthday field → shows in sidebar "Quick Info"
- Grade A contacts get auto birthday SMS at 7am (via scheduler)

### shadcn/ui components used
Dialog, AlertDialog, Select, Badge, Card, Input, Label, Button, DropdownMenu

---

## MODULE 2: Calendar

### What it does
Full calendar with month/week/day views, recurring events, event categories, external sync (webhook), bill tracking integration with Accounting module.

### Data Model
```python
CalendarEvent {
  id: str (uuid)
  user_id: str
  title, description, location: str
  start_time, end_time: str    # ISO datetime
  all_day: bool
  calendar_id: str             # references calendars collection
  category_id: Optional[str]  # references event_categories
  is_recurring: bool
  recurrence: Optional[RecurrenceRule]
  reminder_minutes: int        # default 15
  attendees: List[str]         # email addresses
  notes, priority, status: str
  is_bill: bool                # if True, shows in Accounting
  bill_amount: Optional[float]
  bill_paid: bool
  created_at, updated_at: str
}

RecurrenceRule {
  frequency: str               # "daily" | "weekly" | "monthly" | "yearly"
  interval: int                # every N units (e.g. 1 = every month)
  days_of_week: List[int]      # 0=Sun..6=Sat
  day_of_month: Optional[int]
  end_type: str                # "never" | "after" | "on_date"
  end_after_occurrences: Optional[int]
  end_date: Optional[str]
}

Calendar { id, user_id, name, color, is_default }
EventCategory { id, user_id, name, color, description }
```

### Routes
- `GET /api/calendars` → Get user's calendars
- `POST /api/calendars` → Create calendar
- `GET /api/calendars/events?start=ISO&end=ISO` → Get events in range (expands recurring)
- `POST /api/calendars/events` → Create event
- `PUT /api/calendars/events/{id}` → Update event
- `DELETE /api/calendars/events/{id}` → Delete event
- `GET /api/calendars/categories` → Get categories
- `POST /api/calendar/receive` → Webhook: receive synced events from external app

### Critical Implementation Notes
- **Recurring expansion**: The GET /events endpoint fetches ALL recurring events regardless of start_time, then generates occurrences within the requested range using `generate_recurring_occurrences()`
- **Timezone**: All datetimes normalized to naive UTC before comparison in the generator
- **Bill events**: Events with `is_bill: True` also appear in `GET /api/accounting/bills`
- **SelectItem values**: Never use empty string `""` as a SelectItem value in Radix UI — use `"none"` and convert before saving

### shadcn/ui + custom components
Dialog, Select, Switch, Popover, DropdownMenu, Badge, Textarea

---

## MODULE 3: Tasks

### What it does
Task list that receives tasks from external apps via API (push integration) or created manually. Tasks have comments that push back to external systems (bi-directional sync).

### Data Model
```python
Task {
  id: str (uuid)
  user_id: str
  title, description: str
  due_date: Optional[str]      # YYYY-MM-DD
  priority: str                # "low" | "normal" | "high" | "urgent"
  status: str                  # "pending" | "in_progress" | "completed"
  source: str                  # "manual" or external app name
  external_id: str             # ID in the external system
  created_at, synced_at: str
}

TaskComment {
  id: str (uuid)
  task_id: str
  user_id: str
  content, user_name: str
  created_at: str
  pushed: bool                 # whether sent to external source
  push_result: Optional[dict]
}
```

### Routes
- `GET /api/tasks` → List user's tasks
- `POST /api/tasks` → Create task
- `PUT /api/tasks/{id}` → Update task (status, priority, etc.)
- `DELETE /api/tasks/{id}` → Delete task
- `GET /api/tasks/{id}/comments` → Get comments on a task
- `POST /api/tasks/{id}/comments` → Add comment (auto-pushes to source if configured)
- `PUT /api/tasks/{id}/push-status` → Update status AND push to external source

### External Push (requires Integrations module)
Tasks can receive data from external apps via `POST /api/external/tasks` with API key auth.
Comments and status changes push back via the source's configured `push_url`.

---

## MODULE 4: Radio (TuneIn + SiriusXM)

### What it does
Persistent radio player that continues playing when navigating between pages. TuneIn with station categories/search/favorites. SiriusXM via embedded iframe. Volume ducks automatically when a call comes in.

### Architecture
- `RadioContext.jsx` — Global React context wrapping the entire app. Contains the audio element, playStation(), togglePlay(), volume control
- `RadioPage.jsx` — Full player UI with category tabs and station grid
- `DashboardLayout.jsx` — Renders the mini player bar at bottom when not on /radio page; keeps SiriusXM iframe alive in DOM (CSS off-screen, never unmounts)

### Data
- **Favorites** stored in `localStorage` as JSON array under key `a2g_radio_favorites`
- No database needed for Radio module

### Routes (backend proxy — required to avoid CORS)
- `GET /api/radio/featured?category=popular` → Get featured stations (categories: popular, music, country, rock, hiphop, jazz, 80s, news, sports, talk, local)
- `GET /api/radio/search?q=term` → Search TuneIn stations
- `GET /api/radio/tune?id=GUIDE_ID` → Get stream URLs for a station

### Volume Duck Integration
The player listens for custom events:
- `window.dispatchEvent(new Event("a2g_call_start"))` → duck to 3% volume
- `window.dispatchEvent(new Event("a2g_call_end"))` → restore volume
Also uses `localStorage.setItem("a2g_call_active", "true/false")`

### Provider Wrapping Required
```jsx
// In App.js, wrap with RadioProvider:
import { RadioProvider } from "./context/RadioContext";
<RadioProvider>
  <BrowserRouter>...</BrowserRouter>
</RadioProvider>
```

---

## MODULE 5: And...Go (URL Shortcuts)

### What it does
Drag-and-drop grid of URL shortcuts. Click to open in new tab. Color-coded cards with title + URL.

### Data Model
```python
GoLink {
  id: str (uuid)
  user_id: str
  title: str
  url: str                     # must include https://
  color: str                   # hex color e.g. "#3b82f6"
  order: int                   # for drag-drop reordering
}
```

### Routes
- `GET /api/goto-links` → List user's links
- `POST /api/goto-links` → Create link (max 50)
- `PUT /api/goto-links/{id}` → Update link
- `DELETE /api/goto-links/{id}` → Delete link
- `PUT /api/goto-links/reorder` → Update order after drag-drop

### Key Feature
Uses native HTML5 Drag and Drop API (no library needed).

---

## MODULE 6: Book Meeting

### What it does
Public booking page (no auth required) where contacts can book meetings with you. Admin configures available times, duration, buffer. Sends confirmation emails.

### Data Model
```python
BookingSettings {
  user_id: str
  business_name, description: str
  meeting_duration: int         # minutes
  buffer_time: int              # minutes between meetings
  available_days: List[int]     # 0=Mon..6=Sun
  start_time, end_time: str    # "09:00", "17:00"
  booking_slug: str            # URL-friendly unique identifier
  email_confirmation: bool
  timezone: str
}

BookedMeeting {
  id: str (uuid)
  user_id: str                 # host
  guest_name, guest_email, guest_phone: str
  meeting_date: str            # YYYY-MM-DD
  meeting_time: str            # HH:MM
  duration: int
  notes: str
  status: str                  # "confirmed" | "cancelled"
  created_at: str
}
```

### Routes
- `GET /api/booking/settings` → Get host's booking settings (auth required)
- `POST /api/booking/settings` → Save settings (auth required)
- `GET /api/booking/link` → Get public booking URL
- `GET /api/booking/public/{slug}` → Public: get availability (NO auth)
- `POST /api/booking/public/{slug}/book` → Public: book a meeting (NO auth)
- `GET /api/booking/meetings` → List all booked meetings (auth required)
- `PUT /api/booking/meetings/{id}/status` → Cancel/confirm meeting

### Email Integration
Uses aiosmtplib for confirmation emails. Configure SMTP in admin settings.

---

## Common Dependencies

### Frontend npm packages
```json
"react": "^18",
"react-router-dom": "^6",
"axios": "^1",
"@radix-ui/react-*": "shadcn/ui components",
"lucide-react": "icons",
"sonner": "toast notifications",
"tailwindcss": "styling",
"class-variance-authority": "shadcn",
"clsx": "class merging"
```

### Backend pip packages
```
fastapi
motor
pydantic[email]
python-jose[cryptography]   # JWT
passlib[bcrypt]             # password hashing
aiohttp                     # for radio proxy + external calls
python-multipart            # file uploads
aiosmtplib                  # emails (booking)
```

### shadcn/ui Components Required
All located at `src/components/ui/`:
- button, input, label, badge, card
- dialog, alert-dialog
- select, switch
- dropdown-menu, tooltip
- textarea, avatar
- sonner (toasts)

---

## Integration Steps for AI

1. **Copy backend route files** into your FastAPI app. Add routes to your main router:
   ```python
   app.include_router(api_router)
   ```

2. **Ensure these exist** in your backend:
   - `get_current_user` dependency (JWT auth)
   - `db` Motor client
   - `uuid`, `datetime` imports

3. **Copy frontend page files** to `src/pages/`

4. **Add routes** in your React Router config:
   ```jsx
   <Route path="contacts" element={<ContactsPage />} />
   <Route path="contacts/:contactId" element={<ContactDetailPage />} />
   <Route path="calendar" element={<CalendarPage />} />
   <Route path="tasks" element={<TasksPage />} />
   <Route path="radio" element={<RadioPage />} />
   <Route path="goto" element={<AndGoPage />} />
   <Route path="booking" element={<BookingSettingsPage />} />
   ```

5. **For Radio only**: Wrap your app with `<RadioProvider>` and add the mini player + SiriusXM iframe to your layout component.

6. **Create MongoDB indexes** (recommended):
   ```javascript
   db.contacts.createIndex({ user_id: 1, name: 1 })
   db.calendar_events.createIndex({ user_id: 1, start_time: 1 })
   db.tasks.createIndex({ user_id: 1, status: 1 })
   db.goto_links.createIndex({ user_id: 1, order: 1 })
   ```

7. **apiClient setup** (axios instance all components depend on):
   ```javascript
   export const apiClient = axios.create({ baseURL: process.env.REACT_APP_BACKEND_URL });
   apiClient.interceptors.request.use(config => {
     const token = localStorage.getItem('token');
     if (token) config.headers.Authorization = `Bearer ${token}`;
     return config;
   });
   ```
