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

### Testing Status
- Frontend Testing: PASS (100% success rate)
- Backend Testing: PASS (leads API working)
- Mobile Responsive: PASS

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
- [ ] Build location landing page template (state-specific pages)
- [ ] Link robot info pages to shop products
- [ ] Code cleanup and security review
- [ ] Remove unused components (FloatingNav.jsx)
- [ ] Upload assets to iDrive E2 bucket (currently in local public folder)
- [ ] Add Healthcare industry page
