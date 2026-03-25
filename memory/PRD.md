# 123Bots - Product Requirements Document

## Original Problem Statement
Clone the GitHub project `https://github.com/BUCS2424/gingerkare-site-cart/tree/2.5-final-3` and rebrand it from "GingerKare" to "123Bots". Then complete a full frontend redesign to match the design, layout, and URL structure of `https://123bots.com`.

## Project Overview
123Bots is a commercial cleaning robots e-commerce and lead generation website. The platform showcases AI-powered autonomous floor cleaning robots for commercial spaces, allows users to schedule demos, and provides buy/lease options.

## Core Requirements
1. **Frontend Redesign**: Clone design from 123bots.com (dark tech theme)
2. **URL Structure**: Match 123bots.com page URLs
3. **Backend**: Keep existing backend unchanged
4. **Assets**: Use images/videos from 123bots.com, stored in public folder
5. **SEO**: Implement comprehensive SEO (Open Graph, Twitter Cards, JSON-LD)
6. **Analytics**: Add a2ganalytics.com script to all public pages
7. **Responsiveness**: All pages must be mobile-friendly
8. **Demo Form**: Connect to existing backend /api/leads/ endpoint

## What's Been Implemented

### Completed (March 25, 2026)
- [x] **A2G Modules Step 2 (Frontend) integrated into Admin**
  - Tasks page integrated at `/admin/tasks` and placed under **CRM** menu
  - Contacts page integrated at `/admin/contacts` with detail page `/admin/contacts/:contactId`
  - Calendar page integrated at `/admin/calendar`
  - Radio page integrated at `/admin/radio` with app-level `RadioProvider` and persistent admin mini-player
  - And...Go page integrated at `/admin/andgo`
  - Booking settings page integrated at `/admin/booking`
  - Public booking page integrated at `/booking/:bookingSlug`
- [x] **Admin Sidebar structure updated as requested**
  - CRM now includes: Opportunities + Tasks
  - Top-level items added: Contacts, Calendar, Radio, And...Go, Booking
- [x] **API wiring for new frontend modules standardized**
  - Added `frontend/src/lib/apiClient.js` with token interceptor using localStorage token
- [x] **Booking dependency validated**
  - `aiosmtplib` ensured in backend environment and requirements regenerated
- [x] **Regression-safe fixes from automated testing applied**
  - Contact export route ordering fixed in backend to prevent `/export` path collision with `/{contact_id}`
  - Contact detail route handling fixed for AdminLayout direct-render pattern
- [x] **Multi-user Booking + Calendar Visibility (staff-focused)**
  - Auto-provision on user creation: booking settings + first-last booking slug/URL + default calendar + default categories
  - Added per-user booking access via settings cog/action in:
    - `/admin/users` (dropdown action)
    - `/admin/user-management` (staff row cog)
  - Added admin-managed booking context on booking page via `?userId=` query parameter
  - Added admin booking APIs:
    - `GET /api/booking/admin/users`
    - `GET /api/booking/admin/meetings`
    - Cross-user settings/link/bookings via `user_id` query on booking endpoints
  - Calendar now includes **Staff Booking Meetings** checkbox panel (admin/super_admin), showing selected staff bookings with status color tags
  - Preserved and extended `meet.saysme.org` logic in invite/public booking flow

### Completed (March 23, 2026)
- [x] GitHub project cloned and dependencies installed
- [x] Full rebranding from "GingerKare" to "123Bots"
- [x] All assets downloaded (images, videos) to /frontend/public/
- [x] **HomePage** - Complete with video hero, AI impact section, products showcase, ROI section, demo form, industries section
- [x] **Header** - Navigation with INDUSTRIES dropdown, PRODUCTS dropdown, PARTS, SUPPORT links, SCHEDULE A DEMO & BUY OR LEASE CTAs, cart
- [x] **Footer** - Complete with all navigation links, social links, contact info
- [x] **ProductsPage** - All 5 robots displayed: PUDU CC1 PRO, AVIDBOT KAS, PUDU SH1, PUDU MT1 MAX, CC1 Docking Station
- [x] **RobotProductPage** - Individual product pages with specs, features, use cases
- [x] **ScheduleDemoPage** - Full demo request form connected to /api/leads/
- [x] **BuyLeasePage** - Purchase vs lease options comparison
- [x] **IndustryPage** - Pages for Retail, Warehouses, Hospitality, Events & Stadiums, Education
- [x] **ResourcesPage** - Product guides, training videos, case studies, blog
- [x] **AgeVerificationModal** - Updated with 123Bots dark tech theme branding
- [x] **SEO** - Comprehensive SEO library with presets, JSON-LD generators
- [x] **Analytics** - a2ganalytics.com script added to index.html
- [x] **index.html** - Full SEO meta tags, Open Graph, Twitter Cards, JSON-LD schema
- [x] **ShopPage** - NEW: Created with dark theme matching site design
- [x] **CartDrawer** - Restyled with dark theme (blue accents, dark surfaces)
- [x] **CheckoutPage** - Full restyle with dark theme (blue/green progress, dark forms)
- [x] **Coming Soon Password Gate** - Connected to feature flags with admin-configurable on/off toggle and custom password
- [x] **Chatbot Icon Upload** - Added to Site Information section in dev settings with drag & drop upload
- [x] **Header Shop Navigation** - Added `Shop` link in top bar and main navigation
- [x] **Category Landing Page** - Created `/categories` with 5 category rows, Product Info + Shop CTAs, SEO metadata, and full route wiring
- [x] **Location Slug Prefix Control** - Added configurable `Location URL Prefix` field in Dev Location Generator (`/api/dev/location-slug-settings` + UI save flow)
- [x] **Location Route Compatibility Fix** - Location resolver now supports configurable prefix plus legacy aliases to prevent 404 regressions
- [x] **Location Template Prefix Wiring** - Canonical URL and internal county/city/state links now use dynamic prefix from settings
- [x] **Location Butterfly Background Removal** - Removed legacy butterfly background/image fallbacks from location page rendering and template defaults

### Testing Status
- Frontend Testing: PASS (100% success rate)
- Backend Testing: PASS (leads API working)
- Mobile Responsive: PASS

### Latest Testing (March 25, 2026)
- Backend smoke tests: PASS for `/api/contacts`, `/api/calendars`, `/api/tasks`, `/api/radio`, `/api/goto-links`, `/api/booking`, `/api/health`
- Frontend smoke screenshot: PASS (homepage loads)
- Testing Agent Iteration 57: PASS (Backend 100%, Frontend 100%)
  - Verified admin routes and sidebar placement for all six A2G modules
  - Verified public booking flow `/booking/:bookingSlug`
- Testing Agent Iteration 60: PASS (Backend 100%, Frontend 100%)
  - Verified multi-user booking provisioning, per-user settings navigation, and staff booking calendar overlay
  - Verified first-last slug generation and meet.saysme.org video link logic

## URL Structure
| Page | URL |
|------|-----|
| Home | / |
| Products | /products |
| PUDU CC1 PRO | /products/pudu-cc1-pro |
| AVIDBOT KAS | /products/ab-kas |
| PUDU SH1 | /products/pudu-sh1 |
| PUDU MT1 MAX | /products/pudu-mt1 |
| CC1 Docking Station | /products/pudu-cc1-docking-station |
| Schedule Demo | /schedule-a-demo |
| Buy/Lease | /rent-or-buy-a-cleaning-bot |
| Resources | /123-bots-resources |
| Retail Industry | /industries/retail-uses |
| Warehouses | /industries/warehouses |
| Hospitality | /industries/hospitality |
| Events & Stadiums | /industries/events-stadiums |
| Education | /industries/education |
| Shop | /shop |
| Shop Categories | /categories |
| Contact | /contact |

## Tech Stack
- **Frontend**: React, Tailwind CSS, react-router-dom
- **Backend**: Python, FastAPI
- **Database**: MongoDB
- **Asset Storage**: Local (frontend/public/), iDrive E2 (configured but not used for new assets)

## Key Files
- `/app/frontend/src/App.js` - Main router
- `/app/frontend/src/pages/HomePage.jsx` - Homepage
- `/app/frontend/src/pages/ShopPage.jsx` - Shop/catalog page (NEW)
- `/app/frontend/src/pages/CheckoutPage.jsx` - Checkout flow
- `/app/frontend/src/pages/OrderConfirmationPage.jsx` - Order confirmation
- `/app/frontend/src/components/Header.jsx` - Navigation
- `/app/frontend/src/components/Footer.jsx` - Footer
- `/app/frontend/src/components/CartDrawer.jsx` - Cart sidebar
- `/app/frontend/src/lib/seo.js` - SEO utilities
- `/app/frontend/public/index.html` - HTML with meta tags
- `/app/backend/leads.py` - Leads API

## Credentials
- Site Preview Password: `8487`
- localStorage bypass: `localStorage.setItem('123Bots_unlocked', 'true')`

## API Endpoints
- `POST /api/leads/` - Create lead (demo request)
  - Payload: `{name, email, phone, subject, message, source}`
- `GET /api/health` - Health check

## Future/Backlog Tasks
- [ ] Generate ~20 SEO resource articles per robot product (dated back to Jan 2025)
- [ ] Pre-launch: disable Coming Soon gate when ready and populate shop inventory
- [ ] Build location landing page template (state-specific pages)
- [ ] Link robot info pages to shop products
- [ ] Code cleanup and security review
- [ ] Remove unused components (FloatingNav.jsx)
- [ ] Upload assets to iDrive E2 bucket (currently in local public folder)
- [ ] Add Healthcare industry page
- [ ] Optional: expose `/sitemap-locations.xml` root-level alias (currently available at `/api/sitemap-locations.xml`)

## Prioritized Next Actions
- **P0 (Now complete):** A2G frontend integration + multi-user booking/calendar controls
- **P1 (Next):**
  - Generate/publish SEO resource articles per robot product
  - Populate shop catalog and finalize pre-launch readiness
- **P2 (Backlog):**
  - Checkout refactor + legacy component cleanup
  - Asset migration to iDrive E2
  - Security/performance review
