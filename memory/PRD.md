# 123Bots - Product Requirements Document

## Original Problem Statement
Set up project from GitHub repository `https://github.com/BUCS2424/peptides-cart-new/tree/2.0-complete-test` and redesign as "123Bots" with design inspiration from `https://123bots.com`.

## Brand Identity
- **Name:** 123Bots
- **Theme:** Warm, inviting color scheme (oranges, purples, golds)
- **Focus:** Custom printables and personalized gifts

---

## LOCKED FILES - DO NOT MODIFY

### HeroSection.jsx - LOCKED (March 15, 2026)
**File:** `/app/frontend/src/components/HeroSection.jsx`
**Reason:** User explicitly requested to lock this code after fixing background image + video overlay
**Features:**
- Background image (watercolor butterflies) - ALWAYS VISIBLE
- Video overlay (butterfly_alpha.webm) - plays with alpha transparency on top
- Dark gradient overlay for text readability
- Hero content with CTA buttons

**DO NOT REWRITE OR MODIFY THIS FILE**

---

## Completed Work

### March 18, 2026
- [x] **Optional Email 2-Step Authentication Added**
  - Added per-user optional email 2-step authentication for both customer portal users and admin profile users
  - New login flow now supports trusted browsers for 30 days and a dedicated email-code verification step
  - Added authenticated 2FA status/setup/disable APIs and trusted-device tracking
- [x] **Profile Security Controls Added**
  - Added reusable email 2-step protection card to `/account` and admin profile settings
  - Users can enable protection from their own profile by confirming password and email code
  - Added full test IDs for login 2FA and profile security controls
- [x] **2FA Verification Tested**
  - Backend verified end-to-end with local SMTP harness: enable, login challenge, trusted browser bypass, disable
  - Frontend verified for customer portal toggle dialog, login 2FA screen, and admin profile security card
  - Preview environment restored to normal after testing; SMTP test harness was only used temporarily for verification

### March 19, 2026
- [x] **Peptide Product Options Removed from Storefront Selection**
  - Removed the old peptide-style Strength/Packaging selector flow from the storefront product detail experience
  - Product pages now use existing `manual_option_groups` / `manual_option_combinations` custom option data instead
  - Cart, checkout, order confirmation, and admin orders now display generic selected product options
- [x] **Customer Custom Upload Attached to Products**
  - Added a per-product admin toggle so selected products can accept a customer image upload plus notes
  - Product detail pages now support customer customization image upload and notes before add-to-cart
  - Added backend support for persisting `selected_options`, `custom_image_url`, and `custom_notes` into orders
- [x] **Custom Option Flow Verified**
  - Verified end-to-end with a temporary test product: custom options rendered, image uploaded, notes saved, add-to-cart and checkout summary showed customization data
  - Backend agent confirmed order creation + retrieval persist customization fields correctly
  - Temporary test product and test order were cleaned up after verification

### March 20, 2026
- [x] **Brand Cleanup Pass (Peptide/AMINO-CHAIN wording reduction) + Sitemap Domain Fixes**
  - Replaced high-visibility frontend branding and copy defaults from `AMINO-CHAIN/Peptides` to `123Bots`/`products` across admin/public screens, contracts, HR/job pages, notifications, accounting text, and contact defaults.
  - Updated backend default business/email/from-name text to 123Bots equivalents in settings, shipping, HR, invoices/emails, and abandoned cart flows.
  - Removed hardcoded `amino-chain.com` references from active runtime paths and defaults.
  - Updated sitemap systems (`/api/sitemap.xml`, `/api/sitemap-locations.xml`, `/api/robots.txt`, and sitemap generator endpoints) to avoid hardcoded legacy domain and use configured deployment URL behavior.
  - Updated sitemap route output from legacy peptide paths to current storefront routes (`/shop`, `/research`, and matching product/category URLs).

- [x] **Manual "Send to Printful" moved to Admin Orders (not products)**
  - Added backend endpoints:
    - `GET /api/printful/orders/{order_id}/eligibility`
    - `POST /api/printful/orders/{order_id}/submit`
  - Added order-level recipient + item mapping for Printful submission with `confirm: true` and persisted Printful metadata on local orders.
  - Added webhook-to-order updates for Printful shipping events (status/tracking sync on matching local order).
  - Added Admin Orders detail button **Send to Printful** (shown only when order is eligible/already sent), plus unresolved-item diagnostics.
  - Added product sync metadata persistence improvements (`default_sync_variant_id`, `default_variant_id`, variant id lists) for future order submissions.
  - Verified by testing agent report `/app/test_reports/iteration_42.json` (backend 9/9 pass, frontend pass).
  - Fixed low-priority options rendering regression in `getDisplayOptionSummary` (`name/value` shape now supported; removed `undefined: undefined`).

- [x] **Printful Webhook URL Bug Fix (Invalid URL specified)**
  - Root cause: webhook URL builder trusted `Origin/Referer`; during OAuth callback those can be `printful.com`, creating an invalid webhook URL.
  - Fix: updated backend URL builder to use forwarded/host headers instead of `Origin/Referer` for server-side callback URL construction.
  - Added webhook re-registration retry during `POST /api/printful/sync-products` when webhook is not yet registered.
- [x] **Dev Screensaver Settings + Runtime Screensaver Wiring Completed**
  - Added new Dev Settings menu item and page at `/dev/settings/screensaver`
  - Added configurable fields for: Image A URL + amount, Image B URL + amount, and screensaver video URL, with upload controls and previews
  - Added backend settings model + authenticated endpoints: `GET/PUT /api/admin-settings/screensaver`
  - Updated `AdminScreensaver` to fetch and apply saved image/video/count settings at runtime
  - Verified with testing agent report: `/app/test_reports/iteration_41.json` (backend 8/8 pass, frontend pass)
- [x] **Printful Signup Link Added to Admin Fulfillment Page**
  - Added a “Need a Printful account?” card at the top of the Printful integration page
  - Added CTA link to `https://www.printful.com/a/2574152:3baba470beba68c22081db5479cd5b06`
  - Link opens in a new tab and was verified by frontend testing agent
- [x] **Printful OAuth Connect Flow Replaced Manual Key UI**
  - Added Printful Client ID / Secret management to Dev Settings → Feature Flags
  - Replaced the admin Printful page with OAuth-style Connect / Sync / Disconnect UI and removed the old manual API key / webhook entry form
  - Added backend OAuth-ready routes for app settings, connection status, connect URL, callback handling, disconnect, product sync, and webhook capture
- [x] **Printful Redirect Flow Verified**
  - Verified `/api/printful/connect-url` generates a Printful external install/login URL and correct callback URL on the public preview domain
  - Backend testing agent confirmed all new Printful OAuth endpoints pass with authentication and expected response shapes
  - Frontend verification passed by direct smoke testing; autonomous frontend agent was blocked by the recurring environment auth/gate issue rather than missing implementation
- [x] **Manual Printful Callback URL Override Added**
  - Added a manual callback URL field to Dev Settings → Printful OAuth App so each site/store can point OAuth back to its own chosen callback URL
  - If left blank, Printful connect still falls back to the current site URL automatically
  - Verified the override changes `/api/printful/connect-url` to use the manually entered callback exactly
- [x] **Printful Connect Popup Flow Added**
  - Changed Connect Printful to open Printful auth in a popup/new window instead of replacing the current admin page
  - Callback now posts a success/error result back to the opener window and closes itself when possible
  - Frontend testing agent verified popup behavior, unchanged parent URL, external Printful popup URL, and updated popup-window copy
- [x] **Printful Redirect Whitelist Note Added**
  - Added a clear note in Dev Settings warning that the exact callback URL must be added to Printful’s Redirect URLs whitelist
  - Note explicitly warns that a bare domain like `https://123bots.com` will fail and that `/api/printful/callback` must be included

### March 17, 2026
- [x] **General Settings Typing Regression Re-verified**
  - Re-tested `/dev/settings` using real keystrokes in the Site Name field
  - Confirmed the single-character typing bug does **not** reproduce in this fork
  - Added explicit test IDs for General Settings edit/save/cancel controls to support repeatable validation
- [x] **Frontend Branding Sync Expanded**
  - Added shared site settings context for public frontend branding
  - Public nav, login page, register page, welcome/coming-soon modal, footer logo, and favicon now read from `/api/settings/site`
  - Removed duplicated frontend branding fetch logic and centralized default site settings
- [x] **Public Site Settings API Expanded**
  - `/api/settings/site` now returns `support_email` for public frontend consumption
  - Legacy blank/AMINO-CHAIN site defaults are normalized back to 123Bots branding for public/frontend reads
- [x] **Product Duplication Re-verified**
  - Backend duplication flow validated via API create/verify/delete cycle
  - Admin products duplication UI validated from `/admin/products` with success toast and row-count increase

### March 16, 2026
- [x] **Full SEO Implementation** - Comprehensive SEO across all pages
  - Updated `index.html` with 123Bots branding, Open Graph, Twitter Cards, meta tags
  - Created enhanced `seo.js` library with JSON-LD schema generators (Organization, Product, Article, FAQ, Breadcrumb, LocalBusiness)
  - Created `useSeo.js` React hook for easy page-level SEO management
  - Updated `robots.txt` for 123Bots with proper allow/disallow rules
  - Updated `sitemap.xml` static file with main pages
  - Created dynamic `/api/sitemap.xml` endpoint with products and articles (58 URLs)
  - Updated `manifest.json` for PWA with 123Bots branding
  - Added SEO to all pages: HomePage, Shop, ProductDetail, Research, FAQ, About, Contact, legal pages
  - Schema types: WebSite, Organization, Product, Article, FAQPage, CollectionPage
- [x] **Coming Soon Password Gate** - Added password protection (8487) after welcome popup
- [x] **Chat Delete Bug Fix** - Fixed delete function using wrong API URL
- [x] **Research Article Content Replaced** - Replaced all 39 peptide research articles with 48 new sublimation/custom printing articles
  - Categories: Sublimation Printing, Custom T-Shirts, Drinkware, Home Decor, Business & Marketing, Gift Ideas, Design Tips, Care & Maintenance
  - Route updated from `/peptides-research` to `/research`
  - All peptide references removed from research pages (titles, SEO, links, buttons)
  - "Research" link added to homepage footer under Support section
- [x] **Location Page Articles Updated** - Replaced peptide research catalog section with sublimation content
  - Changed "Peptide Categories" to "123Bots Tips" badge
  - Added Design Inspiration & Tips section with 3 cards: Sublimation Printing, Design Tips, Business & Marketing
  - Updated testimonials from research partners to customer reviews (t-shirts, mugs, canvas, flags)
  - Updated all AMINO-CHAIN branding to 123Bots
  - Updated footer links from /peptides-research to /research
- [x] **Left Menu on Product Detail Pages** - Added left accordion menu to product detail pages, matching shop page layout
  - Controlled by `left_menu_enabled` feature flag
  - Uses same mega menu data from API
  - Responsive - hidden on mobile, visible on lg+ screens
- [x] **Peptide Content Removal** - Removed all peptide-related content from customer-facing pages:
  - Product detail trust badges: Changed from "HPLC Verified", "COA Included" to "Quality Guaranteed", "Made with Care", "Fast Shipping"
  - Product specs: Changed from peptide fields to "Category", "Quality", "Production", "SKU"
  - Order confirmation: Changed "FOR RESEARCH USE ONLY" to "Thank you for shopping with 123Bots!"
  - Registration toast: Changed "Welcome to AMINO-CHAIN!" to "Welcome to 123Bots!"
  - Email verification toast: Changed "Welcome to AMINO-CHAIN" to "Welcome to 123Bots"
  - Shop page: Changed "Lab Grade" default condition to "Premium Quality"
- [x] **UI Branding Updates** - Trust badges now use 123Bots orange/amber color scheme
- [x] **Mega Menu Builder Feature** - Full admin interface at `/admin/settings/mega-menu` under Website section
  - Create/edit/delete menu items with Label, Icon, URL, Description
  - Sub-menu support with Parent Menu Item selection
  - Multi-column mega menu support (4 columns)
  - Link types: Custom URL, Category, Site Page
  - Open in new tab toggle
  - Active/Inactive toggle
  - Full SEO settings per menu item:
    - Page Title, URL Alias/Slug
    - Meta Description with character counter
    - Meta Keywords
    - Canonical URL
    - OG Title, OG Image URL, OG Description
    - Robots Directive dropdown
- [x] **Dynamic Header Navigation** - Header now fetches menu from API with fallback to static menu
- [x] **Left Menu Accordion** - Reusable accordion component using same mega menu data
  - Purple header with +/- expand icons
  - Dark gray background for sub-items  
  - Purple left border on hover/active
  - Search products filter
  - Added to shop/product pages with left sidebar layout
- [x] **Left Menu Toggle** - `left_menu_enabled` feature flag in Dev Settings (default ON)
- [x] Backend API endpoints: `/api/mega-menu/items` (CRUD), `/api/public/mega-menu/navigation` (public)
- [x] Testing passed: 100% backend (12/12), 100% frontend UI verified

### March 15, 2026
- [x] Project setup from GitHub
- [x] 123Bots branding applied (logo, colors, nav)
- [x] Homepage redesigned with warm theme
- [x] HeroSection fixed - background image + video overlay both working
- [x] Welcome modal implemented (replaces age verification)
- [x] Navigation updated with new categories
- [x] A2G analytics script hardcoded via frontend router guard for all public routes (including product pages)
- [x] Shipping & Returns table contrast fixed for readable body-row text; test IDs added for key shipping rate fields
- [x] Product data model upgraded to support `categories[]` + primary `category`; admin editor now uses multi-select category assignment
- [x] Auto-create missing top-level categories during product create/update; category filtering supports primary OR secondary category membership
- [x] Product CSV import wired end-to-end in Admin Products (menu trigger + file upload + backend parser + summary card + downloadable error CSV)
- [x] Dev Settings now includes **Hero Media** menu/page to manage hero background image + hero overlay video; uploads route to dedicated iDrive folders (`hero/background`, `hero/video`)
- [x] Hero display API expanded with `hero_background_image_url` and `hero_video_url`; homepage hero reads these settings with current defaults preserved
- [x] Added Printful integration foundation: per-owner credentials (`api_key`, `store_id`, `webhook_secret`) with save/get/validate API endpoints and masked secret responses
- [x] Added `printful_enabled` feature flag in Dev Feature Flags; when enabled, main dashboard sidebar shows **Fulfillment → Printful** menu item
- [x] Added owner-facing Printful settings page at `/admin/fulfillment/printful` with save + validate actions and status card
- [x] Verified YOYCOL has public OpenAPI (2025.11) and added YOYCOL integration foundation with HMAC V4 signature validation flow
- [x] Added `yoycol_enabled` feature flag in Dev Feature Flags; Fulfillment accordion now conditionally shows **Printful** and **YOYCOL** items based on toggles
- [x] Added owner-facing YOYCOL settings page at `/admin/fulfillment/yoycol` with per-owner key storage (`access_key`, `secret_key`), masked retrieval, and signed validation endpoint
- [x] Added admin endpoint to create default test customer once (`customer.test@emergent.dev` / `TestCustomer123!`) without duplication and ensured corresponding `customers` record exists
- [x] Added admin impersonation endpoint for customer accounts and frontend row action button on `/admin/customers`
- [x] Added full impersonation session UX with global banner + Exit Impersonation restore flow in auth context
- [x] Added Dev Feature Flags: `owner_chat_enabled` (Communications) and `owner_chat_ai_enabled` (AI), both default OFF
- [x] Gated admin chat visibility/usage by `owner_chat_enabled` (sidebar Live Chat + `/admin/chat` route + backend admin chat access)
- [x] Gated Admin Settings > System > AI Keys by BOTH toggles (`owner_chat_enabled` AND `owner_chat_ai_enabled`)
- [x] Chat AI response generation now respects `owner_chat_ai_enabled`; when OFF it returns a clear “AI chat disabled” response
- [x] Frontend Chat Widget updated: when `owner_chat_ai_enabled` is OFF, AI tab is hidden and widget defaults to Live Rep-only mode
- [x] Added public chat availability endpoint (`GET /api/chat/availability/public`) returning owner chat flags + online live-rep status
- [x] Added offline fallback flow in widget: if no owner/support online, show required name/email/message form; submit creates lead with `source=chat_offline`, `subject=Live Chat Offline Request`, status=`opportunity`
- [x] Added browser desktop notification trigger + confirmation alert after offline message submission
- [x] Clarified online control in Admin Chat Dashboard with explicit switch label: `Live Rep Online` / `Live Rep Offline`

## Critical Rules (User Specified)
1. SEO is vitally important - Open Graph, Twitter Cards, JSON-LD, sitemap, robots.txt, canonical URLs, semantic markup
2. Mobile/responsive is critical on all pages
3. Add analytics script to all public pages: `<script data-host="https://a2ganalytics.com" data-dnt="false" src="https://a2ganalytics.com/js/script.js" id="ZwSg9rf6GA" async defer></script>`
4. Use modules instead of single files
5. Only make requested changes
6. No duplicate code - look for existing solutions
7. Security checks for injection, SSRF, mass assignment, data exfiltration

## Pending Tasks

### P0 - Critical
- [ ] Monitor and re-check the General Settings page if the user still sees the typing bug on their machine; current fork verification passes

### P1 - High Priority
- [ ] Complete any remaining frontend branding touchpoints still using hardcoded 123Bots copy/assets
- [ ] Security hardening pass for settings/admin routes
- [ ] Printful OAuth production verification on `123bots.com` after redeploy + Printful redirect domain verification (blocked on user-side deployment/config)
- [ ] Decide whether users should also get a “manage trusted browsers” view to revoke remembered devices manually
- [ ] Review the coming-soon overlay for flaky automated-test behavior, even though manual storefront validation passed

### P2 - Medium Priority
- [ ] Review code redundancies and remove duplicate settings-fetch patterns in remaining pages
- [ ] Import product catalog from `/app/uploads/123bots_products_import_ready.csv`
- [ ] Fully implement YOYCOL settings/webhook flows

### P3 - Low Priority
- [ ] Future redesign of generated location pages only with explicit user approval

## Tech Stack
- **Frontend:** React, TailwindCSS, Vite
- **Backend:** FastAPI (Python)
- **Database:** MongoDB

## Key Files Reference
- `/app/frontend/src/components/HeroSection.jsx` - **LOCKED**
- `/app/frontend/src/pages/HomePage.jsx`
- `/app/frontend/src/components/FloatingNav.jsx`
- `/app/frontend/tailwind.config.js`
- `/app/frontend/public/videos/butterfly_alpha.webm` - Video overlay asset
- `/app/backend/mega_menu.py` - Mega Menu API router
- `/app/frontend/src/pages/admin/AdminMegaMenu.jsx` - Mega Menu admin page
- `/app/frontend/src/components/Header.jsx` - Dynamic navigation header
- `/app/frontend/src/components/LeftMenuAccordion.jsx` - Left sidebar accordion menu
- `/app/frontend/src/pages/PawnShopPage.jsx` - Shop page with left menu integration
- `/app/frontend/src/pages/ProductDetailPage.jsx` - Product detail page with left menu
- `/app/frontend/src/pages/OrderConfirmationPage.jsx` - Order confirmation page
- `/app/frontend/src/pages/RegisterPage.jsx` - Registration page
- `/app/frontend/src/pages/VerifyEmailPage.jsx` - Email verification page
