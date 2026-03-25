# Quote System + Contracts + E-Signature Component

## Overview
A complete quote-to-signature system for a CRM built with React (frontend) and FastAPI (backend) with MongoDB. This includes:

- **Quote Builder** — Full-page split-screen editor with live preview, drag-and-drop line items, monthly/yearly billing options, contract document selection
- **Contract Template Editor** — WYSIWYG editor (TipTap) for creating contract templates with merge fields
- **Contract Documents Admin** — CRUD management for contract templates with print-to-PDF
- **Multi-Step E-Signature Wizard** — Public page where clients review quote, choose billing options, and sign each contract document
- **Signed Contract Books** — Immutable storage of signed document collections linked to clients

---

## File Structure

### Frontend Files
```
src/
├── crm/
│   ├── pages/
│   │   ├── QuoteBuilderPage.jsx          # Main quote builder (split-screen, drag-drop, live preview)
│   │   └── AdminContractsPage.jsx        # Admin contract template management with print button
│   └── components/
│       ├── QuoteCalculatorForm.jsx        # Quote form component (line items, billing types)
│       ├── ContractEditor.jsx            # TipTap WYSIWYG contract template editor
│       └── CreateInvoiceModal.jsx        # Invoice creation modal (products/services/lead sales)
└── pages/
    └── QuoteSigningPage.jsx              # Public multi-step e-signature wizard (no auth)
```

### Backend Files
```
backend/
├── backend_models.py              # Pydantic models (QuoteLineItem, etc.)
├── backend_quote_crud.py          # Quote CRUD, email, unlock, convert-to-invoice
├── backend_signatures.py          # Signature capture endpoints
├── backend_contracts.py           # Contract templates + signed contract books CRUD
└── backend_public_signing.py      # Public quote view + multi-doc signing + merge fields
```

---

## Setup Instructions

### 1. Install Dependencies

**Frontend:**
```bash
yarn add react-signature-canvas @tiptap/react @tiptap/starter-kit @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Backend:**
```bash
pip install pydantic aiosmtplib python-jose
```

### 2. Database Collections (MongoDB)

The system uses these collections:
- `lead_quotes` — Stores quotes linked to leads
- `contract_templates` — Contract document templates with merge fields
- `signed_contract_books` — Immutable signed document collections
- `signatures` — Individual signature records
- `leads` — Lead/prospect data (quotes are linked via `lead_id`)
- `clients` — Client data (created on quote signing)
- `invoices` — Invoices created from quotes

### 3. Backend Integration

Add the backend endpoints to your FastAPI server. The files are extracted sections — merge them into your `server.py` or create a route module.

**Required imports:**
```python
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid, hashlib, jwt
```

**Key API Endpoints:**
```
# Quotes (auth required)
GET    /api/leads/{lead_id}/quotes           # List quotes for a lead
POST   /api/leads/{lead_id}/quotes           # Create a new quote
PUT    /api/leads/{lead_id}/quotes/{id}      # Update a quote
DELETE /api/leads/{lead_id}/quotes/{id}      # Delete a quote
POST   /api/leads/{lead_id}/quotes/{id}/send-email      # Email quote to client
POST   /api/leads/{lead_id}/quotes/{id}/convert-to-invoice  # Convert to invoice

# Contract Templates (admin)
GET    /api/contract-templates               # List all templates
POST   /api/contract-templates               # Create template
PUT    /api/contract-templates/{id}          # Update template
DELETE /api/contract-templates/{id}          # Delete template

# Signed Contract Books (admin)
GET    /api/signed-contract-books            # List all
GET    /api/signed-contract-books/{id}       # Get one
DELETE /api/signed-contract-books/{id}       # Delete (requires super admin password)

# Signatures
POST   /api/signatures                       # Save a signature
GET    /api/signatures                       # List signatures

# Public (no auth — client-facing)
GET    /api/public/quote/{quote_id}          # Get quote for signing
POST   /api/public/quote/{quote_id}/sign     # Submit signatures
```

### 4. Frontend Integration

**Routes to add (in App.js or your router):**
```jsx
// Public signing page (no auth)
<Route path="/sign/:quoteId" element={<QuoteSigningPage />} />

// CRM routes (auth required)
<Route path="/crm/leads/:leadId/quote/new" element={<QuoteBuilderPage />} />
<Route path="/crm/leads/:leadId/quote/:quoteId" element={<QuoteBuilderPage />} />

// Admin (add to admin section)
<Route path="/crm/admin/contracts" element={<AdminContractsPage />} />
```

**Sidebar menu item:**
```jsx
{ icon: PenTool, label: 'Signatures', path: '/crm/signatures' }
```

### 5. Contract Template Merge Fields

These placeholders auto-replace with real data in the contract preview and signed documents:

| Field | Description |
|-------|-------------|
| `{{client_name}}` | Client/owner full name |
| `{{company_name}}` | Client's business/company name |
| `{{business_name}}` | Your business name (provider) |
| `{{provider_name}}` | Your business name (provider) |
| `{{email}}` | Client email |
| `{{quote_name}}` | Quote/project name |
| `{{quote_total}}` | Total quote amount |
| `{{date}}` | Current date |
| `{{valid_until}}` | Quote expiration date |

### 6. Quote Builder Features

- **Split-screen layout**: Left = live preview (what client sees), Right = form controls
- **Drag-and-drop line items**: Reorder on both sides, stays in sync
- **Billing type per item**: One-Time, Monthly, Yearly
- **Dual pricing**: If both monthly AND yearly prices are set, client can choose on signing page
- **Contract selection**: Select default contract + additional documents (checkboxes)
- **Credit Card Processing Fee**: 2.9% + $0.30 auto-calculated after subtotal
- **65% deposit / 35% balance**: Payment terms shown on quote and signing page

### 7. E-Signature Flow

1. Client opens `/sign/{quoteId}` (public, no login)
2. **Step 0**: Quote review — line items with billing choices, totals, payment terms
3. **Step 1+**: Each contract document shown with signer name/email + signature canvas
4. **Completion**: All documents signed → contract book created immutably → lead converts to client → project auto-created
5. **Pay Deposit**: "Pay Deposit Now" button → Stripe checkout for 65% deposit

### 8. Key Data Models

**Quote:**
```json
{
  "id": "uuid",
  "lead_id": "uuid",
  "name": "Project Name",
  "items": [
    {
      "description": "CRM Software",
      "quantity": 1,
      "unit_price": 249,
      "billing_type": "monthly",
      "price_monthly": 249,
      "price_yearly": 2490
    }
  ],
  "total": 1500,
  "contract_id": "uuid",
  "additional_contract_ids": ["uuid", "uuid"],
  "valid_until": "2026-04-01",
  "signed_at": null
}
```

**Contract Template:**
```json
{
  "id": "uuid",
  "name": "Service Agreement",
  "content": "<h1>Service Agreement</h1><p>Between {{business_name}} and {{client_name}}...</p>",
  "document_type": "service_agreement",
  "is_default": true,
  "is_required": true,
  "sort_order": 1
}
```

**Signed Contract Book:**
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "quote_id": "uuid",
  "documents": [
    { "name": "Service Agreement", "content": "...", "signature": "base64...", "signed_at": "..." }
  ],
  "signer_name": "John Smith",
  "signer_email": "john@example.com",
  "signed_at": "2026-03-15T..."
}
```

---

## Notes

- The QuoteBuilderPage is large (~950 lines) — if using a Babel metadata plugin, you may need to split it further into sub-components
- The ContractEditor uses TipTap — ensure all TipTap extensions are installed
- The signature canvas uses `react-signature-canvas` — renders a drawable pad
- All `_id` fields from MongoDB are excluded from API responses (MongoDB ObjectId is not JSON serializable)
- The signing page is fully public (no auth) — security is through the quote UUID being hard to guess
