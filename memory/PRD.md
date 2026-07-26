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

### Completed (June 17, 2026)
- [x] **BG1 PRO Features Page — Full Route Integration**
  - `PuduBg1ProFeaturesPage.jsx` routed at `/explore-all-pudu-bg1-features`
  - "Explore Features" button on `PuduBg1ProPage.jsx` (IoT Integration section) now links via `<Link>` to the features page
  - All 12 robot product page URLs added to both the dynamic (`/api/sitemap.xml` in `server.py`) and static (`/frontend/public/sitemap.xml`) sitemaps
  - `/explore-all-pudu-bg1-features` added to both sitemaps with `priority 0.7`

### Completed (May 15, 2026)
- [x] **Product File Upload/Download System**
  - Admin Product Editor Files tab: drag-and-drop upload, file list, public/private toggle, download/delete
  - Backend endpoints: upload, list (auth-aware), delete, patch (toggle), download (auth+purchase check)
  - ProductDetailPage: "Downloadable Files" section (public=download, private=locked until purchase)
  - OrderConfirmationPage: post-purchase download links section
  - GET /api/store/orders/my: endpoint for customer order history
- [x] **Quote Builder — Browse Catalog Picker**
  - "Browse Catalog" modal in line items: search, category-grouped, hover-add
  - Products/Services tabs, empty-state with link to catalog settings
- [x] **P0 Fix: AuthContext.js production hostname bug**
  - Removed hardcoded `window.location.hostname.endsWith('123bots.com')` detection
  - All API calls now always use `REACT_APP_BACKEND_URL`
  - Fixes black screen on 123bots.com production deployment
- [x] **Sitemap URL fix: hardcoded base_url in server.py**
  - Replaced `https://123bots.com` with dynamic `x-forwarded-host` header detection

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
- [x] **Booking Location Type UX (matches appointment-style flow)**
  - Applied to both Admin Create Meeting modal and Public Booking form
  - Added `Location Type` select: Physical Location / Online Meeting
  - Physical flow: required Physical Address field
  - Online flow: mutually-exclusive checkboxes:
    - `Use https://meet.saysme.org/` + editable Secure Room Name + live Meeting URL preview
    - `Other Meeting URL` + plain text custom details field
  - Added Settings tab `Location Defaults` card (default location type, physical address, other meeting default)
  - Backend updated to persist/apply new fields in invite/public booking flows and return detailed booking response payload
- [x] **Opportunities: Create an Opportunity flow (same original modal)**
  - Added top-right `Create an Opportunity` button on Opportunities page
  - Opens the same full Opportunity modal/tabs used by edit mode
  - Create mode uses required fields and submits via `POST /api/leads/`
  - New opportunities are forced into Opportunity column (`status: opportunity`) with default stage `1. New Inquiry`
  - After successful create, modal closes and new card appears in Opportunity column
  - Edit mode preserved (Update flow, Delete + Convert buttons remain for existing cards)
- [x] **Quote / Contract / eSign ZIP System Installed (exact package integration)**
  - Extracted and integrated ZIP module frontend pages:
    - `QuoteBuilderPage`
    - `AdminContractsPage`
    - `QuoteSigningPage`
  - Added backend integration router: `quote_contract_esign_routes.py` with authenticated CRUD + public signing endpoints
  - Added sidebar top-level menu item: **Quotes / Contracts / eSign** at `/admin/quotes-contracts-esign`
  - Integrated into Opportunities lead modal with dedicated tab: `Quote / Contract / eSign`
  - Integrated into Client page (`AdminCustomerDashboard`) with tab: `Quotes / Contracts / eSign`
  - Added reusable panel for lead/client contexts with quote list + create/edit + eSign link actions
  - Added public signing route in app: `/sign/:quoteId`
  - Installed ZIP-required frontend dependencies (`@dnd-kit/*`, `@uiw/react-md-editor`, `react-signature-canvas`, `@tiptap/*`, supporting packages)
- [x] **Quote Configuration Modal + Quote-specific Catalogs (separate from cart)**
  - Added quote settings route: `/admin/quotes/settings`
  - Added **Configuration** button on Quote settings page (top-right), opening modal with:
    - From-field visibility toggles (business name, address, city/state/zip, phone, email)
    - Stripe fee charging enable/disable toggle
    - Deposit value number input + deposit type dropdown (`%` or `$`)
    - Synced business information/ logo preview from Business Information (General Settings)
  - Added quote-specific catalogs (separate DB collections from cart):
    - Products: `quote_products`
    - Services: `quote_services`
  - Added quote settings cog/button on QuoteBuilder left of Save Draft
  - QuoteBuilder now uses quote-specific endpoints:
    - `/api/quotes/catalog/products`
    - `/api/quotes/catalog/services`
  - Added quote form config APIs:
    - `GET /api/quotes/config`
    - `PUT /api/quotes/config`
  - Quote preview behavior now follows config:
    - General Settings logo synced to top-right (text business block removed)
    - FROM fields shown/hidden per configuration
    - Stripe fee line shown only if enabled
    - Deposit display uses configured `%` or `$` type/value
  - Added `quotes_enabled` feature flag and wired visibility gating:
    - Sidebar Quotes menu
    - Lead modal Quotes tab
    - Client page Quotes tab
    - Quote routes show disabled message when flag is OFF

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
- Testing Agent Iteration 61: PASS (Backend 100%, Frontend 100%)
  - Verified location type behavior in admin + public booking forms
  - Verified mutually-exclusive online meeting checkboxes and field rendering
  - Verified backend handling for physical/saysme/other meeting modes
- Testing Agent Iteration 62: PASS (Backend 100%, Frontend 100%)
  - Verified Create Opportunity button placement, modal behavior, validation, and Opportunity-column insertion
  - Verified no regressions in edit mode, drag-drop, delete, and convert-to-client flows
- Testing Agent Iteration 63: PASS (Backend 100%, Frontend 100%)
  - Verified sidebar menu route, lead modal tab, client page tab, quote builder page, contract template CRUD, quote CRUD, and public signing flow
  - Verified no regressions across Opportunities and Booking modules
- Testing Agent Iteration 66: PASS (Backend 100%, Frontend 100%)
  - Verified Configuration modal fields and behavior, quote-specific catalog separation, quote settings cog placement, and quotes feature-flag toggling
  - Verified quote config API validation (`deposit_type`, `deposit_value`) and UI visibility rules

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
- [x] Add Healthcare industry page (COMPLETED April 4, 2026)
- [ ] Optional: expose `/sitemap-locations.xml` root-level alias (currently available at `/api/sitemap-locations.xml`)

## Recent Additions (April 4, 2026)

### Healthcare Industry Page
- Created comprehensive `/industries/healthcare` page with:
  - Hero section with dual CTAs
  - Stats section (99.2% cleaning coverage, 40% EVS overtime reduction, 24/7 operation, 17 states)
  - 8 healthcare-specific benefits
  - 6 "Healthcare Areas We Serve" use cases (ER, OR Corridors, Patient Hallways, etc.)
  - 6 Challenges & Solutions pairs
  - Testimonial section
  - Recommended products (4 robots)
  - Available States section + Footer
- Added to Header navigation (Industries dropdown - first item)
- Full SEO optimization with healthcare-specific meta tags

### About Us & Contact Pages Styling
- Updated both pages to match 123Bots dark navy theme
- Added Header and Footer components
- Added "Available States We Serve" section

### Inventory Management System
- **Backend** (`/app/backend/inventory_management.py`):
  - Manufacturer CRUD with configurable lead times
  - Inventory items with stock levels, reorder points
  - Stock adjustment tracking (add/remove/sold/received/damaged)
  - Purchase order management
  - Order recommendations algorithm based on:
    - Pipeline opportunities (weighted by stage)
    - Historical sales velocity
    - Conversion rate settings
    - Safety stock days
  - Weekly email scheduler (Mondays at 8 AM)
  
- **Frontend** (Admin Panel):
  - `/admin/inventory-management` - Dashboard with summary cards
  - `/admin/inventory/items` - Stock level management
  - `/admin/inventory/manufacturers` - Manufacturer settings (lead times, contacts)
  - `/admin/inventory/recommendations` - Order recommendations with urgency levels
  - Added "Inventory Mgmt" accordion to sidebar

- **Scheduler** (`/app/backend/scheduler.py`):
  - APScheduler for Monday 8 AM inventory reports
  - Sends email with order recommendations to configured recipients

### Completed (April 7, 2026)
- [x] **Kanban Pipeline Custom Stages Refactoring**
  - Updated Kanban board to 7 custom pipeline columns: Cold Call, Build Interest, Interested/Waiting, Demo, Proposal Sent, Waiting on Leadership, Closed
  - Fixed critical bug: `handleSaveEdit` was resetting status to `'opportunity'` on every edit
  - Changed Kanban layout to horizontal flex scroll with fixed-width columns (280px)
  - Testing Agent Iteration 68: PASS (Backend 13/13 100%, Frontend 100%)

- [x] **Kanban Lead Card Redesign (matching reference image)**
  - Cards now show: Opportunity Name (bold) + Person icon, Business Name, Opportunity Source, Opportunity Value as label:value pairs
  - Bottom action icon row: Phone, Email, Tags (with count), Notes (with count), Tasks (with count), Calendar/Appointments (with count)
  - Blue badge numbers show counts for tags, notes_timeline, tasks, and appointments
  - Cards are compact with fixed column widths preventing stretch issues

- [x] **SEO Resource Articles (81 articles, dated Jan 2025 - Apr 2026)**
  - PUDU CC1 PRO: 20 articles
  - AVIDBOT KAS: 19 articles
  - PUDU SH1: 15 articles
  - PUDU MT1 MAX: 14 articles
  - PUDU BG1: 14 articles
  - Categories: Industry Applications (21), Robot Reviews (15), Guides & Tutorials (13), Technology & Innovation (9), ROI & Business (8), Commercial Cleaning (8), Maintenance & Care (7)
  - Research Library page rebranded from "Design Inspiration Library" to "Robot Cleaning Resources"

- [x] **External Stack API Delivery Module**
  - Feature flag `external_api_enabled` in Dev Settings controls visibility
  - **Pipelines CRUD**: Create/edit/delete custom pipelines with configurable stages and colors
  - **External API Sources CRUD**: Multi-source auth credentials with unique auth header + token per source
  - **Lead Ingestion Endpoint**: `POST /api/external-api/leads` — full 25+ field set, source-authenticated
  - **Email forwarding**: Optional per-source notification on lead arrival
  - Admin UI: `/admin/external-api/sources` and `/admin/external-api/pipelines`
  - Testing Agent Iteration 69: PASS (Backend 15/15, Frontend 100%)

## Event Center & Ticketing — Phase 1 (June 27, 2026)
Gated entirely by new `events_enabled` feature flag (Dev Settings → Feature Flags → "Events"). When OFF, nothing event-related shows; deep-links to `/admin/events/*` redirect to `/admin/cart`.

### Completed (Phase 1)
- [x] **Backend module** `/app/backend/event_center.py` (wired in `server.py`):
  - Collections: `event_categories`, `event_venues`, `events`, `event_attendees` (+ `event_orders` reserved for Phase 2)
  - Categories CRUD, Venues CRUD, Events CRUD (auto slug, ticket_type ids), Dashboard stats (`GET /api/events/dashboard/stats`), Attendees (create w/ generated `EVT-XXXX-XX` ticket code, list, idempotent check-in, verify by code, delete)
  - Public endpoints scaffolded: `GET /api/public/events`, `GET /api/public/events/{slug}` (used in Phase 2)
  - Event model includes `ticket_background_url` + `ticket_tagline` for the concert-style ticket
- [x] **Feature flag** `events_enabled` added to `admin_settings.py` (FeatureFlags + public projection) and `DevFeatureFlags.jsx`
- [x] **Admin UI** (dark "CUE" purple theme) in `/app/frontend/src/pages/admin/events/`:
  - EVENT CENTER sidebar accordion: Event Dashboard, Tickets & Sales, Attendees, Events, Event Categories, Create An Event, Venues/Locations, Revenues & Reports
  - Event Dashboard (stat cards, recharts sales trend, upcoming events panel)
  - Create/Edit Event editor: details, ticket-type builder, custom registration form builder, drag-n-drop ticket background + banner/gallery uploads (`/api/storage/upload`, folder=events), **live concert-ticket preview** (QR placeholder, ADMIT ONE, price, tagline, date/time/venue)
  - Events list, Categories, Venues, Attendees (manual add + check-in + door verify box), Tickets & Sales, Revenue & Reports
- [x] Testing Agent Iteration 71: PASS (Backend 10/10 100%, Frontend 100%)

### Event Center — Phase 2 (BACKLOG / NEXT)
- [ ] Public event pages: events list at `/events`, event detail at `/events/:slug` with venue, images, ticket types, and the custom registration form
- [ ] Ticket purchase via **PayPal** (reuse existing `durango_payments.py` PayPal wiring)
- [ ] Generate **QR code** on the concert-style ticket; email ticket via existing **SMTP** (`email_utils.py`) after purchase
- [ ] Door check-in kiosk: camera QR scan (in addition to current manual code verify)
- [ ] `event_orders` flow + revenue tied to real PayPal payments

### Event Center — Phase 2 (COMPLETED June 27, 2026)
- [x] Public event pages: list at `/events` (`EventsPublicPage.jsx`), detail at `/events/:slug` (`EventDetailPage.jsx`) with ticket-type quantity selector + custom registration form
- [x] Registration/checkout: `POST /api/public/events/{slug}/register` — free tickets issue instantly; paid tickets create an `event_orders` record and a **PayPal** order (reuses `durango_payments._get_paypal_access_token`), redirect to approval URL
- [x] PayPal capture: `/events/confirmation` page (`EventConfirmationPage.jsx`) captures on return and shows issued tickets
- [x] **QR ticket**: backend generates QR (qrcode lib) encoding the ticket_code; concert-style ticket emailed via existing **SMTP** (`email_utils.send_email`); public ticket view at `/events/ticket/:code` (`TicketViewPage.jsx`)
- [x] Admin: door check-in now has **camera QR scan** (html5-qrcode) + manual code verify; resend ticket endpoint `POST /api/events/attendees/{id}/resend`
- [x] Header shows an `EVENTS` nav link when `events_enabled` is on
- [x] Testing Agent Iteration 72: PASS (Backend 7/7 100%, Frontend 100%)
- NOTE: PayPal is not yet configured with API keys in this environment — paid checkout returns a graceful 503 until keys are added in Payment Settings. Free ticketing works fully.

### Event Center — Phase 3 (BACKLOG)
- [ ] Configure PayPal API keys (Payment Settings) to enable live paid ticket sales
- [ ] Optional: "Featured Events" carousel on the homepage (gated by `events_enabled`)
- [ ] Optional: hide VENUE column on ticket when event has no venue

### Event Center — Phase 2.1 (June 27, 2026)
- [x] Event paid checkout now supports **both** PayPal modes: **Email (no API keys)** — buyer gets a PayPal payment link to the organizer's email and the ticket is issued (order marked `awaiting_payment`); and **API Keys** — full Orders v2 capture flow. Configured at Admin → Settings → Payments → PayPal → "Email Payment Link".
- [x] Confirmation page shows a "Pay with PayPal" button + instructions for email-mode orders.
- [x] **Preview Live Page** button on the Event editor opens `/events/:slug?preview=1` (works for draft events via a `preview` flag on the public detail endpoint; shows a PREVIEW banner).
- Verified: email-mode register returns payment link + issues ticket (sold increments); preview button confirmed via screenshot.

### Event Center — Phase 3: Landing Page + Branding (June 27, 2026)
- [x] **Custom Event Center landing page** (`EventsLandingPage.jsx`): hero, a 3-column row with 2-up **category image tiles that wrap to multiple rows** + an **Upcoming Events** list (thumbnail + date/time/venue/price), and a full-width **3D coverflow slideshow** of event posters with a gold "See All Upcoming Events" CTA (links to `/events?view=list`).
- [x] **Toggle** `events_landing_enabled` (Dev → Feature Flags → Events): when ON the EVENTS menu opens the landing page; when OFF it opens the standard site-template list. Wrapper `EventsIndexPage.jsx` routes `/events` accordingly (honors `?view=list`).
- [x] **Category images**: added `image_url` to event categories + upload in the category editor + public `GET /api/public/events/meta/categories`.
- [x] **Configurable Event Center name** `events_center_name` (Dev → Feature Flags → Events → "Event Center Name" input + Save): renames the admin sidebar accordion and the public landing hero. Verified round-trip (e.g. "CUE Events").
- [x] **Public event detail page revamped** (TicketWeb style): ambient blurred backdrop, poster, venue block with **embedded Google Map** (no API key) + Venue Info modal + Share, category/title/date, Description with Read more, Event Information (Age Limit / Refund Policy / Additional Info — new optional event fields), and a **bottom-sheet** "Buy Tickets" flow (slide-up, drag-to-dismiss, sticky checkout footer) centered on mobile to clear the chat widget.
- [x] Header EVENTS link hidden top utility bar on mobile (moved links into hamburger). Preview banner fixed to sit in-flow (no longer overlaps nav).

### Bug Fix — Dynamic Email Template Logo (July 3, 2026)
- [x] Removed the legacy hardcoded `gingerkare-logo-3-blue.png` from ALL email templates (`email_templates.py`). Replaced with a `{{site_logo}}` variable.
- [x] Added `get_site_logo()` (reads `admin_settings.type='site'.logo_url`) + `apply_site_logo()` helper; logo injected in GET list, GET single, and POST preview endpoints. `site_logo` added to each template's variables list.
- [x] Verified via testing_agent (iteration_73.json, 14/14 backend tests pass): all 6 templates now render the current General Settings logo; changing the site logo updates previews live. No hardcoded logo leaks.
- Note (minor, deferred): `DEFAULT_SITE_LOGO` fallback still references the legacy URL for the edge case where no site settings doc exists (never occurs in practice).

### Robot Pages — Advanced Layout Rebuild (July 3, 2026)
- [x] Rebuilt the 4 remaining "basic" robot pages to the advanced BG1 PRO layout (hero, 3-card feature overview, alternating capability rows with video/image slots, ecosystem, 4-card spec grid, FAQ accordion, CTA): **PuduT300, PuduT600, PuduMt1Vac, AvidbotKas**.
- [x] Kept accurate specs pulled from existing content; themed each page (T300 cyan, T600 red, MT1 VAC green, KAS blue). All media slots use graceful onError fallbacks to the main product image, and videos use the product image as poster — so pages look complete before final assets arrive.
- [x] Verified all 4 render correctly via screenshots. Routes: /products/pudu-t300, /products/pudu-t600, /products/pudu-mt1-vac, /products/ab-kas.
- Media to be supplied by user (see handoff list). All other 8 robot pages already on advanced layout.

### Bug Fix — Header Cart Button Didn't Open Checkout Drawer (July 14, 2026)
- [x] Fixed: clicking the header cart icon did nothing. `Header.jsx` held its own local `isCartOpen` useState and passed props to `CartDrawer`, but `CartDrawer` reads `isCartOpen`/`setIsCartOpen` from `CartContext` (useCart) and ignores props — so the button toggled dead state and the drawer never opened.
- [x] Fix: `Header` now consumes `setIsCartOpen` from `useCart()` and renders `<CartDrawer />` with no props (shared context state).
- [x] Verified by testing_agent (iteration_74.json, 100% frontend): add product on PDP (/shop/{cat}/{slug}) → header cart-button opens drawer with item → Proceed to Checkout navigates to /checkout. Minor a11y console warning noted (missing Sheet description) — non-blocking.

### Bug Fix — Shippo (Shipping) Key Couldn't Be Saved/Tested (July 14, 2026)
- [x] Root cause: the Shipping Settings "Test" button hit `POST /api/shipping/test-connection/{provider}` which read only the key STORED in the DB, not the key just typed — so a freshly entered Shippo key always returned 400 "Shippo API key not configured" until saved separately, making it feel like nothing saved.
- [x] Fix: backend `test-connection` now accepts optional credentials in the request body and tests the entered key (falls back to stored key for masked/empty values); frontend `testConnection()` now sends the currently-entered keys. Applies to shippo/easypost/shipstation/stamps.
- [x] Verified by testing_agent (iteration_75.json, 12/12 backend tests, 100%): PUT persists key (GET returns masked), masked re-submit doesn't overwrite stored key, test-with-body-key returns 200, no-key guard still 400.

### Bug Fix — Checkout Dropdown Contrast (same-color / unreadable) (July 14, 2026)
- [x] Fixed: the "Set Up Auto-Reorder" interval `<select>` used dark text (`text-gray-900`) on a dark background (invisible); billing-state options lacked a contrast class.
- [x] Fix: Auto-Reorder select control → `text-white` on `bg-bots-surface`, options → `bg-bots-dark text-white`; billing-state options → `bg-bots-dark text-white` (matching the already-correct shipping-state dropdown).
- [x] Verified by testing_agent (iteration_76.json, 100% frontend): value renders white (rgb 255,255,255) on dark (rgb 10,25,41); selecting 60/90 days works.
- Note: testing agent flagged CheckoutPage.jsx is 2502 lines — candidate for splitting into per-step components (backlog).

### Feature — Multi-Gateway Checkout: Stripe wired alongside Durango (July 14, 2026)
- [x] Stripe now fully wired into the storefront checkout (previously only settings existed; checkout was Durango-only → "Demo Mode"). Both gateways are admin-toggleable per site (Admin → Payments), for multi-tenant cloning.
- [x] Backend (`durango_payments.py`): `GET /settings/stripe/public`; `get_stripe_secret_key()` (per-tenant DB secret_key, env `STRIPE_API_KEY` fallback); `stripe` branch in `create_order` → emergentintegrations `StripeCheckout` hosted session + `payment_transactions` record + `redirect_url`; idempotent `GET /stripe/status/{session_id}`; `POST /stripe/webhook`. `OrderCreate.origin_url` added. `.env` STRIPE_API_KEY=sk_test_emergent.
- [x] Frontend (`CheckoutPage.jsx`): fetch stripe public settings; auto-select first enabled gateway; `payment-method-stripe` option + `stripe-info-panel`; redirect flow on Place Order; `?stripe_session=` return polling → order-confirmation; Demo Mode banner only when NO gateway enabled.
- [x] Verified by testing_agent (iteration_77.json, 100% backend + frontend): real cs_test_ session, redirect to checkout.stripe.com, idempotent polling, no regressions to Durango/CashApp/Venmo/PayPal.
- Notes (backlog): `durango_payments.py` ~1531 lines (split per-gateway); `stripe/status` has no rate limiting (low risk).

### Bug Fix — Order Confirmation Page Contrast (July 16, 2026)
- [x] Fixed: the "What Happens Next?" card used a light gradient background with white text (heading + step titles invisible). The page container was also light (`from-slate-50`) while all cards are dark (`bg-bots-surface`).
- [x] Fix: card background → dark theme tints (purple/green/sky/blue -500/10); page container (2 spots) → `bg-bots-dark`. Now consistent dark theme, readable text.
- [x] Verified by testing_agent (iteration_78.json, 100% frontend): both completed (Order Processing/Quality Check/Shipped) and awaiting-payment (Send Payment/We Verify/Order Ships) variants readable (white on dark), page bg rgb(5,15,23).
- Note (backlog): the CashApp "Complete Your Payment" instructions card still uses a light-green bg — readable but off-theme; candidate for a future dark-theme consistency pass.

### Feature — Customer CRUD (Create/Edit/Impersonate/Delete) + Button Contrast (July 16, 2026)
- [x] Removed the old "Create Test Customer" (fixed test account) and replaced with a real **"Create a Customer"** flow. Backend: `POST/PUT/DELETE /api/admin/customers` (+ existing impersonate), all `require_admin`. A customer = `users` doc (role USER, login) + `customers` doc (same id, storefront metadata) → can purchase across all enabled systems (storefront/storage/pawn); verified the created account can log in.
- [x] Frontend `AdminCustomers.jsx` fully rewritten: create/edit dialog, delete confirm, impersonate, reset-password; added DialogDescription for a11y.
- [x] Fixed invisible buttons: invalid Tailwind `bg-[rgb(37, 99, 235)]` (spaces break arbitrary values → no bg, white-on-white) replaced with `bg-blue-600`/`text-blue-600` throughout.
- [x] Verified by testing_agent (iteration_79.json): backend 11/11, frontend 100% — full lifecycle (create→login→edit→impersonate→delete→404) and button contrast confirmed.
- Note (backlog): listing uses `/api/store/customers` while CRUD uses `/api/admin/customers` (functional but inconsistent namespacing).

### Bug Fix + Feature — Category Deletion & Drag-Drop Subcategories (July 17, 2026)
- [x] **Fixed "deleted categories respawn" bug** (`ecommerce.py` `delete_category`): on delete, the category name is now stripped from every product that references it (both `category` and `categories`); products left empty fall back to "General". This stops `_ensure_top_level_categories` from recreating the ghost category on the next product save/sync. Curl-verified: product reference → "General", category does NOT reappear even after a product update.
- [x] **Drag-and-drop subcategory nesting** (`AdminCategories.jsx`): dragging a category and dropping it directly ONTO another now nests it as a **subcategory** (child, `parent_id = target.id`) instead of reordering as a sibling. Added blue drop-target highlight, auto-expand of the target, and cycle-prevention (can't nest a category into its own descendant → "Invalid Move" toast). Persists via `POST /api/store/categories/reorder`.
- [x] Verified by testing_agent (iteration_81.json): backend 5/5 pytest pass, frontend nesting persists across reload. 100%/100%.
- Confirmed: product `shipping_weight` is stored in POUNDS; backend ×16 → ounces for shipping APIs (no change needed).
- Backlog note (from tester): `AdminCategories.jsx` is ~736 lines — candidate to split tree/editor/DnD into components.

### Feature — Stripe Payment ID on Admin Order Invoice (July 17, 2026)
- [x] Captured the Stripe **PaymentIntent id (pi_...)** for paid Stripe checkout orders. `durango_payments._finalize_stripe_order` now calls `_fetch_stripe_payment_intent_id()` (read-only `httpx` GET to `api.stripe.com/v1/checkout/sessions/{id}`) and stores `stripe_payment_intent_id` + `stripe_session_id` on the order and transaction. Added these + `payment_transaction_id` to the `Order` model so they survive the response schema.
- [x] **Admin → Orders order-detail** now shows a "Payment Reference" card with the Stripe Payment ID (pi_) and Checkout Session ID (cs_), each with a Copy button, plus a "View in Stripe" link to `dashboard.stripe.com/payments/{pi}`. Card only renders when payment ids exist; second-row label is dynamic (Stripe session vs generic Transaction ID for PayPal/other).
- [x] Verified by testing_agent (iteration_82.json, frontend 100%): card renders pi_/cs_ with copy + Stripe link for a stripe order, and correctly hides for a non-stripe (Venmo) order. Backend field round-trip curl-verified.
- Note: live pi_ capture depends on completing a real hosted Stripe checkout (cannot be e2e tested in-tool); the fetch/store path and UI are verified.

### Feature — Shipment-Pending Safeguard on Label Purchase (July 17, 2026)
- [x] **Failed shipping-label purchases no longer mark an order "shipped."** `shipping.py create_label_for_order` now: (1) wraps the provider purchase in try/except; (2) validates the response even on HTTP 200 — Shippo `status != SUCCESS`, a missing tracking number, or a missing label URL are all treated as failures (covers payment/funding failures that Shippo returns as `status=ERROR` with 200). On any failure it calls `_mark_shipment_pending()` → order `status='shipment_pending'` + `shipping_error`/`shipping_error_at` stored, logs a failed `shipping_labels` record, and returns `{success:false, shipment_pending:true, error}`. Only a genuine success (tracking + label) marks the order shipped and clears the error.
- [x] **Admin → Orders UI**: new amber "Shipment Pending" status badge; a warning banner (`order-shipment-error-banner`) in the Fulfillment card showing the provider error with a note that the order was NOT shipped; the action button switches to "Retry — Buy Label"; `handleSendToShippo` shows a destructive toast on failure and refreshes.
- [x] Verified: backend `/app/backend/tests/test_shipment_pending.py` 4/4 PASS (ERROR status, no-tracking, exception, success→shipped). Frontend testing_agent iteration_83.json 100% (badge, banner, retry button, and clean default state for normal orders).

### Bug Fix + Features — Coming Soon Gate, Pending Filter, Funding Alert (July 17, 2026)
- [x] **BUG: Coming Soon gate showed even when the toggle was OFF.** Root cause: `useSiteFeatureFlags` fetched `/api/settings/site` first and only applied flags after BOTH requests finished, with an unsafe default `coming_soon_enabled: true` — so any slow/failed site-settings fetch left the gate up. Fix: fetch both endpoints in parallel (`Promise.allSettled`), fail-OPEN default (`coming_soon_enabled: false`), added a `_loaded` flag, and `AgeVerificationModal` now renders nothing until flags load (no flash). `handleEnterWelcome` no longer forces the password gate when Coming Soon is off. Verified testing_agent iteration_84 — no gate for fresh visitor.
- [x] **Admin Orders "Shipment Pending" filter tab** (`AdminOrders.jsx`): amber tab with count badge (`orders-filter-shipment_pending`) to spot failed labels at a glance; filters to shipment_pending orders.
- [x] **Funding-failure admin email** (`shipping.py _mark_shipment_pending`): on any label purchase failure, a best-effort alert email is sent to **support@123bots.com** (`SHIPPING_ALERT_EMAIL`) with order #, customer, provider, and error. (SMTP not configured in preview — send is best-effort/try-except.)
- [x] Verified: testing_agent iteration_84.json 100% frontend + backend; shipment-pending unit tests 4/4.

### Feature — Contract Documents Easily Accessible in Admin (July 17, 2026)
- Answered: signed quote contracts are stored **embedded in each quote** (`db.quotes` → `signatures[]`, `signed_at`, `contract_document_ids`); the reusable **contract document templates** live in `db.contract_templates` (`/api/contract-templates`).
- [x] Made the **Contract Documents** setup page discoverable. The admin sidebar "Quotes" item was a single link straight to the quote builder; it's now an **accordion** with: Quote Builder (`/admin/quotes-contracts-esign`), **Contract Documents** (`/admin/quotes-contracts-esign/contracts` → AdminContractsPage), and Quote Settings (`/admin/quotes/settings`). Added an exact-match in `isActive()` so the builder link isn't highlighted on sub-pages. (`AdminLayout.jsx`)
- [x] Verified testing_agent iteration_85.json 100%: accordion exposes all 3 links, Contract Documents page lists templates (MSA/NDA/SOW) and full create/edit/delete CRUD works.
- Minor (non-blocking): 2 unrelated 404 console errors on the Contract Documents page (not the templates API) — left as-is.

### Feature — Tax Exemption for Leads, Customers & Quotes (July 17, 2026)

- [x] New **tax-exempt module** (`backend/tax_exempt.py`, `/api/tax-exempt`): `POST /upload-cert` (image/PDF ≤25MB → `/api/uploads/tax-certs/`), `PUT /lead/{id}`, `PUT /customer/{id}` (writes both `customers` + `users`), `GET /me`, and `get_tax_exempt_state()` helper.
- [x] Reusable **`TaxExemptCard.jsx`**: toggle + info box, certificate number, reason/notes, expiration date, and **drag-and-drop cert upload** with **View / Print / Download** (audit-ready). Added to the **Lead/Opportunity** detail (new "Tax Exempt" section tab) and the **Customer Dashboard** (new "Tax Exempt" tab). Dashboard endpoint (`user_management.py`) now returns `tax_exempt` + `tax_exempt_info`.
- [x] **Quote builder**: fetches the configured tax rate, shows a **Sales Tax line** and a per-quote **Tax Exempt** toggle (defaults to the lead's exempt status); tax becomes $0 when exempt. Persists `tax_exempt/tax_rate/tax_amount/subtotal` (QuoteCreate model updated).
- [x] **Storefront checkout/orders**: `create_order` (durango_payments) forces `tax=0` and reduces the total for exempt buyers (matched by account or email); charge amount uses the adjusted total across gateways. `CheckoutPage` reads `/api/tax-exempt/me` and shows "Tax (Exempt) $0.00".
- [x] Verified: testing_agent iteration_86.json 100% (backend 7/7, Lead + Customer + Quote UI); storefront enforcement curl-verified (exempt 9→0/109→100; non-exempt unchanged).
- Note: in PREVIEW the tax settings are currently disabled (tax_enabled=false, tax_rates=[]), so the sales-tax line computes $0 until a rate is enabled; production has rates configured. Cert files use local `/app/uploads` (consider migrating to object storage for production durability — roadmap iDrive E2).

### Feature — Custom Shipping Field on Quotes, Orders & Invoices (July 21, 2026)
- [x] **Quotes** (`QuoteCreate.shipping_cost`, nullable): admin-only "Shipping" card in Quote Builder right column with a dollar input + "Calculate" button. Blank input = field hidden everywhere (preview totals, Quote Summary card, customer signing page); a value is added **after tax** into the stored `total` and shown as a line item in both admin previews and the customer-facing `/sign/:quoteId` page.
- [x] **Calculate Shipping dialog** (Quote Builder + Admin Orders): destination address form → `POST /api/shipping/rates/checkout` (reuses the existing storefront rate-shopping endpoint) → carrier rate options rendered, click-to-fill. Falls back to mock USPS rates when no live carrier key (Shippo/EasyPost/ShipStation) is configured — expected in this environment.
- [x] **Quote Products & Services catalog** (`QuoteCatalogItem`) gained `shipping_weight/length/width/height` fields (Products tab only) + a **"Sync from Store"** button (`POST /api/quotes/catalog/products/sync-from-store`) that idempotently pulls real storefront products (price, SKU, shipping dims) into the per-admin quote catalog, so quote line items can auto-calculate real shipping.
- [x] `shipping.py compute_parcel_from_items()` now also falls back to `db.quote_products` (not just `db.products`) when resolving an item's weight/dimensions for a rate quote.
- [x] **Orders**: new `PATCH /api/payments/orders/{order_id}/shipping` lets admin override the shipping cost post-purchase; recalculates `total = subtotal + tax + shipping_cost`. `AdminOrders.jsx` order-detail Shipping row got inline Edit → Calculate/manual entry → Save/Cancel.
- [x] **Invoices**: `convert_quote_to_invoice` now carries `shipping_cost`/`tax_amount`/`subtotal` into the generated invoice record.
- [x] Verified by testing_agent (iteration_87.json): backend 44/44 (9 new + 35 regression), frontend 100% — hidden-when-blank, positioned-after-tax, admin-entry/customer-visible, calculator+override, per-order recalculation, and sync idempotency all confirmed working.
- Minor/non-blocking (pre-existing, unrelated): a demo store product line item shows $0.00 price when added via Browse Catalog; `QuoteSigningPage` header shows "For undefined undefined" for leads missing first_name/last_name (should fall back to primary_contact_name/company_name).

## Activity & Charter Marketplace ("Tours / Charters") Module (July 25, 2026)
Feature-flagged (`activity_marketplace_enabled`) multi-seller activity directory, built to later be cloned into another client's codebase. Gates admin sidebar ("Tours / Charters") and public nav ("ACTIVITIES") entirely.

### Completed (through iteration 90 - base module)
- [x] Admin: Dashboard (stat cards), Categories CRUD, Activities CRUD with fields: title, alias (auto-slug), tags, status (published/unpublished), priority, multiple category_ids, featured toggle, images, description, price_display, duration, booking_type (external_link/native_checkout) + booking_provider (generic/fareharbor)
- [x] Seller tenants (charter companies): quick-add from Activities editor; backend CRUD (`activity_marketplace.py`)
- [x] Public: All Activities directory (`/activities`), By Charter Company directory (`/activities/company/:slug`), activity list, activity detail (`/activities/view/:alias`)
- [x] All module modals are right-side slide-out Sheets (never centered) — categories, activities, quick-add seller, FareHarbor booking drawer
- [x] Activity block/list views with client-side filter by charter company, title search, categories
- [x] FareHarbor Lightframe booking (iframe drawer) for `booking_provider=fareharbor`; generic external booking URL otherwise

### Completed (July 25, 2026 - this session)
- [x] **Activity editor accordion + SEO section** (`Activities.jsx`): Activity Sheet reorganized into two accordions — "Activity Information" (all existing fields) and "SEO" (Page Title w/ 70-char counter, Meta Description w/ 160-char counter, read-only URL Handle preview, "Search Engine Indexing" robots dropdown: Index/Follow, Index/NoFollow, NoIndex/Follow, NoIndex/NoFollow, and a live Google-style SERP preview box)
- [x] Backend `seo_title`/`seo_description`/`seo_robots` fields on Activity model, persisted via create/update
- [x] Public `ActivityDetailPage.jsx` applies SEO via `setSeoMetadata` (title/description/robots meta tag) sourced from activity's SEO fields, with fallback to title/description
- [x] FareHarbor Lightframe script (`fareharbor.com/embeds/api/v1/?autolightframe=yes`) injected via shared `useActivityMarketplaceGate` hook (`activityMarketplaceShared.js`), used by all 4 public activity pages (directory, by-company, list, detail) — confirmed present on every page
- [x] **NEW: Charter Companies admin page** (`CharterCompanies.jsx`) — dedicated seller-tenant management page (previously only a quick-add existed): block/list view toggle, search by name, status filter (All/Active/Inactive), right-side Sheet editor with full field set (name, active/inactive, logo upload, description, contact email/phone, website, commission rate %, FareHarbor shortname); delete blocked with descriptive error when activities are still linked to the seller
- [x] **NEW: "Fare Harbor" sidebar link** — added under Tours / Charters accordion (order: Dashboard, Categories, Activities, Charter Companies, Fare Harbor), external link opening `https://partner.fareharbor.com/login` in a new tab (reuses existing `child.external` sidebar pattern)
- [x] Verified by testing_agent (iteration_91.json): backend 38/38 (7 new SEO/charter-company tests + 31 regression), frontend 100% — accordion/SEO persistence end-to-end (admin form → DB → public meta tags), Charter Companies full CRUD + filters, Fare Harbor new-tab link, no regressions

### Completed (July 25, 2026 - public directory redesign)
- [x] **Public "All Activities" directory** (`ActivitiesDirectoryPage.jsx`) rewritten to an exact category tile grid: `grid-cols-2 md:grid-cols-4` (2-col mobile, 4-col desktop), each tile = category image with the category name centered in a dark overlay bar, no extra count/link text
- [x] **Public category/company activity list** (`ActivityListPage.jsx`, shared by `/activities/category/:slug` and `/activities/company/:slug`) rewritten to a 2-column "excursion card" grid (`sm:grid-cols-2`): each card shows the charter company's logo overlaid top-left on the image, an info banner bottom-left ("Duration - Location"), a "FROM $X" price badge bottom-right, then below the image: Title, an accent-colored link to the charter company's own page (hidden when already on that company's page), a short description, and a Book Now button
- [x] **Tag filter pill bar** above the card grid: "Show all" + deduped tags (in priority order across activities) that client-side filter the visible cards
- [x] **New Activity fields**: `location` (text), `price_from` (text, renders as "FROM $X" badge), `short_description` (card teaser distinct from the full `description` on the detail page) — added to the admin Activity Information accordion
- [x] **Book Now direct-booking behavior**: clicking Book Now on a card no longer navigates to the detail page first — it directly opens the FareHarbor booking Sheet/iframe when `booking_provider=fareharbor` and a shortname resolves (activity override or seller default), or opens the generic `booking_url` in a new tab otherwise
- [x] Booking Sheet widened from `max-w-2xl` to `max-w-4xl` on both the activity detail page and the new list-page Book Now drawer, to better accommodate the FareHarbor Lightframe embed
- [x] Backend `public_list_activities` now also returns `seller_logo_url` and `effective_fareharbor_shortname` per activity (needed for card rendering + direct booking without an extra per-card API call)
- [x] **Drag-and-drop image uploads** added to all 3 Tours/Charters admin image dropzones (Activity images, Category image, Charter Company logo) — click-to-upload still works, following the existing `EventEditor.jsx` drag-drop convention
- [x] Fixed a nested-`<a>`-in-`<a>` HTML validity issue flagged by testing (excursion card outer wrapper changed from `<Link>` to a clickable `<div>` with `useNavigate`, keeping the inner seller link as the only real anchor)
- [x] Verified by testing_agent (iteration_92.json): backend 43/43 (5 new field/enrichment tests + regression), frontend 100% of specified flows — 4-col/2-col grids, info banner/price badge/logo overlay, tag filtering, direct FareHarbor Book Now Sheet (max-w-4xl), drag-drop dropzones, no regressions. One medium markup issue (nested anchors) found and fixed post-report.

### Blocked / Deferred
- FareHarbor External API/FHDN search-import — BLOCKED, requires user's FareHarbor partner API credentials (`X-FareHarbor-API-App`/`X-FareHarbor-API-User`); user confirmed to leave this for now
- Public "Featured" activity visual treatment — deferred, user will decide design later (data/badge already exists in admin)
- Commission/booking-revenue tracking, booking ingestion, billing, analytics — future scope (Phase 2)
- Native in-app booking via 123Bots cart/checkout — future scope
- Charter Company slide-out "creation and information on each" (richer per-company profile/dashboard) — next planned enhancement per user

### Completed (July 26, 2026 - Dashboard light theme)
- [x] **Tours / Charters Dashboard** (`ToursChartersDashboard.jsx`) converted from dark-theme custom styling to the standard light admin theme (shadcn `Card`/`CardContent`, gray-900/gray-500 text, colored icon circle badges) to match `AdminDashboard.jsx` conventions
- [x] All 6 stat boxes now sit in a single row on desktop (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`), 2-3 per row on smaller screens
- [x] Self-verified via screenshot + API (stats endpoint unchanged, values render correctly: 1/1/1/1/0/$0.00)
- [x] **July 26, 2026**: Added a 70/30 two-column area below the stat boxes — 70% left panel reserved/placeholder for future analytics ("More insights coming soon"), 30% right panel is a live "Unpaid Invoices" widget listing unpaid invoices (company, invoice #, amount due) with a link to the full Invoices page. Self-verified via screenshot.

### Completed (July 26, 2026 - Charter Company Billing & Invoicing)
- [x] **Customer sync**: Creating/editing a Charter Company (seller) now auto-creates/updates a linked login-enabled `users`+`customers` record (one-way sync, email = invoice_email or contact_email fallback), visible in User Management > Customers for unified billing visibility. Guards against clobbering unrelated accounts with the same email. "Synced to Customers" badge shown on cards + edit Sheet.
- [x] **New Charter Company billing fields**: Billing Address/City/State/Zip, Tax ID/EIN, Invoice Email, Payment Terms (Due on Receipt/Net 15/30/60). `commission_rate` intentionally left unused by invoicing (per user request, reserved for future use) — invoice amounts are entered manually per line item.
- [x] **New "Invoices" admin page** (Tours/Charters sidebar, between Charter Companies and Fare Harbor): full CRUD — create/edit invoices with manual line items (description, booking ref, qty, rate, tax%), live totals preview, custom note, offline payment instructions (bank/venmo/check); actions to Mark Paid, Void, Delete, and jump to the public invoice link. "Invoice Defaults" settings pre-fill new invoices (sale agent, bank/venmo/check text, note).
- [x] **Public invoice view** (`/invoice/tours-charters/:invoiceId`, no auth) — Bill From/Bill To, line items, Subtotal/Tax/Total/Paid/Due, transactions history, custom note, and a Payment Options footer with "Pay Now" (Stripe Checkout via existing `get_stripe_secret_key`/`StripeCheckout` helper reused from `durango_payments.py`) + offline bank/venmo/check text blocks. Auto-verifies payment status on return from Stripe and marks the invoice paid.
- [x] **Accounting Dashboard**: new "Tours & Charters Income" card showing Invoiced/Paid/Unpaid totals for the selected date range, sourced from the new `tours_charters_invoices` collection.
- [x] **FareHarbor Partner API credential storage** (Dev Settings > Feature Flags > Tours & Charters card): `fareharbor_api_app`/`fareharbor_api_user` fields, masked on save/reload (same convention as other secrets in `admin_settings.py`) — storage only, no live FHDN API call yet (still blocked on partner access).
- [x] New backend module `/app/backend/tours_charters_billing.py` (invoice CRUD + public view + Stripe pay/status), registered in `server.py`.
- [x] Verified by testing_agent (iteration_93.json): **69/69 backend tests passed** (26 new + 43 regression), 100% frontend flows verified, 0 UI bugs. One critical regression found+fixed by testing agent during review: a missing `@router.get("/dashboard/report")` decorator (introduced when inserting the new tours-charters-income endpoint) had silently broken the Accounting CSV export endpoint — restored and regression-tested. One pre-existing (unrelated, lower-priority) CSV export field-name mismatch noted as optional backlog.
- [x] **Send Invoice Email** (July 26, 2026): New `POST /api/tours-charters/invoices/{id}/send-email` reuses the existing `email_utils.send_email` SMTP utility (same one used for verification/2FA emails) to email the public invoice link to the charter company's invoice/contact email. "Send to Charter Company" button added both on each invoice row (icon) and inside the edit Sheet (full button); gracefully falls back to copying the invoice link to clipboard + a clear toast when SMTP isn't configured (same known limitation as other email features in this app). Tracks `last_sent_at`/`last_sent_to` on the invoice, shown under the invoice number. Self-verified via curl + screenshot.
- [x] **Public activity list white/3-col redesign** (July 26, 2026): `ActivityListPage.jsx` (category + company listing) redesigned to match a user-provided reference: white theme below the (unchanged, still dark) hero, 3-column card grid, "FILTER BY:" bar with Location/Duration dropdown filters (replacing tag pills) + live results count, black hourglass duration badge top-left on card image, two-tier "FROM $X" price ribbon bottom-right, gray (non-colored) charter-company link, full-width dark-blue uppercase "Book Now" button. Seller logo overlay removed per the new reference.
- [x] **Book Now funnel tracking** (July 26, 2026): New `tours_charters_booking_events` collection + `POST /api/public/tours-charters/booking-events` (public) + `GET /api/tours-charters/booking-events/summary` (admin) track `book_now_click` → `drawer_opened`/`external_redirect` → `drawer_closed` (with `duration_seconds`) across both the list and detail pages. KNOWN LIMITATION (communicated to user): FareHarbor's Lightframe embed has no documented client-side "payment complete" event without partner API access, so true purchase confirmation cannot be verified — "Engaged 20s+" (time spent in the booking widget before closing) is used as a best-effort intent proxy, not confirmed payment. New "Booking Activity" widget added to the Tours/Charters Dashboard's 70% panel (replacing the earlier placeholder) showing live funnel counts + recent events, next to the "Unpaid Invoices" 30% panel.
- [x] Verified by testing_agent (iteration_94.json): **91/91 backend tests** (11 new + 80 regression), ~95% frontend. One medium reliability bug found+fixed: the Detail page's generic-external-link Book Now used native `<a target="_blank">` navigation which raced against and cancelled the fire-and-forget tracking POST; fixed by switching to `e.preventDefault()` + explicit `window.open()` (matching the already-reliable List page pattern) — confirmed fixed via live network capture (both events now fire every time).

### Bug Fix — Gausium Mira "User-Friendly Mobile App" Image (July 26, 2026)
- [x] User-supplied product mockup image (laptop/tablet/phone showing cloud login illustration, daily cleaning-area/working-hours charts, and mobile "Data statistics" task report) applied to the **"User-Friendly Mobile App"** card in the Platform Integration section of `GausiumMiraPage.jsx` (route `/products/gausium-mira`, NOT `/gausium-mira`). Replaced the `[Image: Mobile App Interface]` text placeholder with a real `<img>` (`data-testid="mira-mobile-app-image"`).
- Note: user's initial phrasing referenced "Smart Cloud Platform" but the image content (laptop+tablet+phone, mobile data stats) matched the adjacent "User-Friendly Mobile App" card, confirmed via image analysis before editing. "Smart Cloud Platform" and "Open API & IoT Integration" cards still show text placeholders (untouched, out of scope for this request).
- Self-verified via screenshot at correct preview URL (`https://booking-crm-preview-1.preview.emergentagent.com/products/gausium-mira`) — image renders correctly, no testing agent needed for this isolated visual change.

### Bug Fix — Gausium Mira "Smart Cloud Platform" Image (July 26, 2026)
- [x] User-supplied image (desktop monitor showing `cloud.gs-robot.com` map-editing dashboard — virtual wall/fencing tools, aerial facility map) applied to the **"Smart Cloud Platform"** card (same Platform Integration section), replacing the `[Image: Cloud Dashboard]` text placeholder with a real `<img>` (`data-testid="mira-smart-cloud-platform-image"`).
- Only remaining placeholder in this 3-card row is "Open API & IoT Integration" — awaiting a user-supplied image.
- Self-verified via screenshot at `/products/gausium-mira` — both cards render correctly side-by-side.

### Bug Fix — Gausium Mira "Gausium Leaves Integration" Image (July 26, 2026)
- [x] User-supplied image (Gausium robot scrubber cleaning a retail warehouse aisle next to pallets of boxed produce) applied to the image slot to the left of the **"Gausium Leaves Integration"** heading (Capability 4: Eco-Friendly Operation), replacing the `[Image: Gausium Leaves System]` text placeholder (`data-testid="mira-gausium-leaves-image"`).
- Self-verified via screenshot at `/products/gausium-mira`.

### Feature — Gausium Mira "No Remapping Required" Video Embed (July 26, 2026)
- [x] Embedded user-provided YouTube video (`https://www.youtube.com/watch?v=VpiFJjuKO0Y` — "Gausium Mira | Navigating Narrow Aisles") in the right video slot next to the **"No Remapping Required"** heading (Capability 3: Dynamic Layout Adaptation), replacing the `[Video: Dynamic Navigation]` placeholder with a real `<iframe>` YouTube embed (`data-testid="mira-dynamic-navigation-video"`). Removed the now-unused `Play` icon import.
- Self-verified via screenshot at `/products/gausium-mira` — video thumbnail/embed renders correctly.

### Feature — Gausium Mira "Open API & IoT Integration" Image (July 26, 2026)
- [x] User-supplied image (dark blue "Future of commercial cleaning robots" branded graphic with particle-wave visual) applied to the **"Open API & IoT Integration"** card, replacing the `[Image: IoT Integration]` text placeholder (`data-testid="mira-iot-integration-image"`).
- **All 3 cards in the "Complete Gausium Ecosystem" row are now complete** with real images (Smart Cloud Platform, User-Friendly Mobile App, Open API & IoT Integration) — no remaining placeholders in this section.
- Self-verified via screenshot at `/products/gausium-mira`.

### Feature — Gausium Marvel "Warehouses" Image (July 26, 2026)
- [x] User-supplied image (Gausium robot cleaning a warehouse aisle between pallets of boxes) applied to the **"Warehouses"** card in the "Built for Complex Spaces" section of `GausiumMarvelPage.jsx` (route `/products/gausium-marvel`), replacing the `[Image: Warehouse]` text placeholder (`data-testid="marvel-warehouses-image"`).
- Remaining placeholders on this page (Manufacturing, Car Parking, Retail cards in the same row) untouched — awaiting user images if desired.
- Self-verified via screenshot.

### Update — Gausium Mira "No Remapping Required" Video Swapped (July 26, 2026)
- [x] Replaced the previously embedded video with a new user-provided YouTube video (`https://www.youtube.com/watch?v=Fc7AF430A9Y`) in the same slot next to **"No Remapping Required"** (`data-testid="mira-dynamic-navigation-video"`).
- Self-verified via screenshot — new video thumbnail/embed renders correctly.

### Feature — Gausium Marvel "Car Parking" Image (July 26, 2026)
- [x] User-supplied image (Gausium robot cleaning an underground parking garage between rows of parked cars) applied to the **"Car Parking"** card in the "Built for Complex Spaces" section of `GausiumMarvelPage.jsx`, replacing the `[Image: Parking]` text placeholder (`data-testid="marvel-car-parking-image"`).
- Only **Manufacturing** and **Retail** cards remain placeholders in this row.
- Self-verified via screenshot.

### Feature — Gausium Marvel "Manufacturing" Image + Section Complete (July 26, 2026)
- [x] User-supplied image (Gausium robot cleaning a manufacturing/warehouse aisle between blue shelving) applied to the **"Manufacturing"** card, replacing the `[Image: Manufacturing]` text placeholder (`data-testid="marvel-manufacturing-image"`).
- [x] User-supplied image applied to the **"Retail"** card (Gausium robots cleaning a retail/trade-show floor), replacing `[Image: Retail]` (`data-testid="marvel-retail-image"`).
- **All 4 cards in the "Built for Complex Spaces" row on `/products/gausium-marvel` are now complete**: Manufacturing, Warehouses, Car Parking, Retail — no remaining placeholders.
- Self-verified via screenshot.

## Prioritized Next Actions
- **P0 (Now complete):** Kanban + External Stack API + SEO Articles + Tax Exemption + Shipping on Quotes/Orders/Invoices + Activity Marketplace SEO/Accordion + Charter Companies page
- **P1 (Next):**
  - Pre-launch: disable Coming Soon gate, populate shop catalog
  - Configure SMTP/Resend for shipping-failure + quote email delivery
  - Fix QuoteSigningPage "For undefined undefined" fallback (use primary_contact_name/company_name)
- **P2 (Backlog):**
  - Checkout refactor + legacy component cleanup
  - Asset migration to iDrive E2
  - Security/performance review
  - Robot page media (blocked — needs user assets)
  - PUDU live fleet API integration
  - Signed contract archive/search page
  - Bulk tax exemption from Admin Customers; tax-exemption sales reporting export
