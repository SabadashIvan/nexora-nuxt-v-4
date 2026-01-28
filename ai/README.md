# AI Documentation - Navigation Index

**Last Updated:** 2026-01-19

This is the central documentation hub for the Nexora Nuxt 4 E-commerce project. All documentation is organized into focused, modular files for efficient AI processing.

---

## 📚 Quick Navigation

### Core Documentation
Essential system architecture and guidelines:
- **[core/master-prompt.md](core/master-prompt.md)** - AI role, responsibilities, and operational guidelines
- **[core/architecture.md](core/architecture.md)** - Complete frontend architecture specification
- **[core/system-core.md](core/system-core.md)** - Immutable system core rules

### API Documentation
Domain-specific API endpoints (9 focused files):
- **[api/README.md](api/README.md)** - API documentation index
- **[api/authentication.md](api/authentication.md)** - Auth, Identity, Email Verification, Password Reset, OAuth
- **[api/catalog.md](api/catalog.md)** - Categories, Brands, Products, Search
- **[api/cart-favorites.md](api/cart-favorites.md)** - Cart, Favorites, Comparison
- **[api/checkout-payments.md](api/checkout-payments.md)** - Checkout Flow & Payments
- **[api/shipping-orders.md](api/shipping-orders.md)** - Shipping Methods & Orders
- **[api/content.md](api/content.md)** - Blog, Comments, Reviews
- **[api/notifications-loyalty.md](api/notifications-loyalty.md)** - Notifications & Loyalty Points
- **[api/audience-support.md](api/audience-support.md)** - Audience, Leads, Support
- **[api/system-seo.md](api/system-seo.md)** - System Config, Languages, SEO

### State Management
Pinia stores and patterns:
- **[stores/README.md](stores/README.md)** - Stores documentation index
- **[stores/stores.md](stores/stores.md)** - Complete store definitions and behavior

### Business Flows
Complete process flows:
- **[flows/checkout-flow.md](flows/checkout-flow.md)** - Detailed checkout process

### Constitution (Immutable Rules)
Core rules that must never be violated:
- **[constitution/api-rules.md](constitution/api-rules.md)** - API contract rules
- **[constitution/rendering.md](constitution/rendering.md)** - SSR vs CSR rendering rules
- **[constitution/checkout.md](constitution/checkout.md)** - Checkout-specific rules
- **[constitution/seo-i18n.md](constitution/seo-i18n.md)** - SEO and i18n rules
- **[constitution/tokens.md](constitution/tokens.md)** - Token model rules

### Operations & Planning
Current implementation status and planning:
- **[operations/README.md](operations/README.md)** - Operations documentation index
- **[operations/not-implemented.md](operations/not-implemented.md)** - Frontend integration roadmap
- **[operations/frontend-todo.md](operations/frontend-todo.md)** - Quick actionable checklist
- **[operations/backend-endpoints-delta.md](operations/backend-endpoints-delta.md)** - Backend endpoints delta (update/add/implement)
- **[operations/ai-rules.md](operations/ai-rules.md)** - Operational rules for AI agents

### Reference
Quick reference materials:
- **[reference/dto-mapping.md](reference/dto-mapping.md)** - DTO mapping documentation
- **[reference/endpoint-index.md](reference/endpoint-index.md)** - Alphabetical endpoint index

---

## 🎯 Common Tasks → Files Mapping

**Implementing authentication:**
→ Read: `api/authentication.md`, `stores/stores.md` (Auth Store), `constitution/tokens.md`

**Building catalog pages:**
→ Read: `api/catalog.md`, `stores/stores.md` (Catalog/Product Store), `constitution/rendering.md`

**Implementing cart:**
→ Read: `api/cart-favorites.md`, `stores/stores.md` (Cart Store), `constitution/rendering.md`

**Building checkout:**
→ Read: `api/checkout-payments.md`, `api/shipping-orders.md`, `flows/checkout-flow.md`, `constitution/checkout.md`

**Adding notifications:**
→ Read: `api/notifications-loyalty.md`, `stores/stores.md` (Notifications Store)

**Setting up SEO:**
→ Read: `api/system-seo.md`, `constitution/seo-i18n.md`

**Working with orders:**
→ Read: `api/shipping-orders.md`, `stores/stores.md` (Orders Store)

**Implementing blog:**
→ Read: `api/content.md`, `constitution/rendering.md`

---

## 📋 File Size Reference

| File | Size | Lines | Purpose |
|------|------|-------|---------|
| **API Files** | 8-12KB each | 300-500 | Domain-specific endpoints |
| **Stores** | 17KB | 1028 | State management patterns |
| **Checkout Flow** | 18KB | 705 | Checkout process |
| **Architecture** | 19KB | 947 | System architecture |
| **Master Prompt** | 29KB | 1630 | AI guidelines |

**Before reorganization:** api.md was 70KB (3089 lines) - too large for efficient AI processing

**After reorganization:** 9 focused API files averaging 8KB each - optimal for AI processing

---

## 🔍 Search Strategies

### By Feature
1. Identify the domain (auth, cart, checkout, etc.)
2. Go to corresponding `api/{domain}.md` file
3. Find endpoint details
4. Check `stores/stores.md` for related store
5. Review `constitution/` for rules

### By Endpoint
1. Check `reference/endpoint-index.md` for quick lookup
2. Navigate to specific API file
3. Read endpoint documentation

### By Store
1. Open `stores/stores.md`
2. Find store section (Table of Contents at top)
3. Review state, getters, actions
4. Cross-reference with API files

---

## ⚠️ Important Rules

1. **Source of Truth**: ONLY use documents in this `ai/` folder
2. **No Assumptions**: If info is missing, respond "Insufficient documentation"
3. **Constitution First**: Always check `constitution/` before making architecture decisions
4. **Modular Loading**: Load only relevant files for your task
5. **Complete Files**: Always output complete files, never partial code

---

## 🆕 What's New (2026-01-19)

- ✅ Split massive api.md (70KB) into 9 focused domain files
- ✅ Reorganized folder structure for better discoverability
- ✅ Added navigation READMEs for quick orientation
- ✅ Updated all file paths and references
- ✅ Cleaned up outdated planning documents

---

## 📖 Entry Points for AI Agents

- **Root Guide**: `../AGENTS.md` - General rules and principles
- **Claude Guide**: `../CLAUDE.md` - Claude-specific optimization tips
- **This File**: Navigation hub within ai/ folder

---

For questions or issues with documentation, refer to the [AGENTS.md](../AGENTS.md) file in the project root.
