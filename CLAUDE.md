# Claude-Specific Documentation Guide

**For:** Claude AI (Anthropic)
**Project:** Nexora Nuxt 4 E-commerce Frontend
**Last Updated:** 2026-01-19

---

## 🎯 Quick Start for Claude

This guide helps you efficiently navigate the reorganized `ai/` folder structure. The documentation has been optimized for AI processing with modular, focused files.

**Start here:** [`ai/README.md`](ai/README.md) - Central navigation hub

---

## 📁 Folder Structure Overview

```
ai/
├── README.md                    ← START HERE
├── core/                        ← System architecture & rules
├── api/                         ← 9 domain-specific API files
│   └── README.md               ← API navigation index
├── stores/                      ← Pinia state management
│   └── README.md               ← Stores index
├── flows/                       ← Business process flows
├── constitution/                ← Immutable rules (NEVER violate)
├── operations/                  ← Planning & tracking
│   └── README.md               ← Operations index
└── reference/                   ← Quick reference materials
```

**Key Improvement:** API documentation split from 70KB monolithic file into 9 focused files (~8KB each) for efficient processing.

---

## 🚀 Common Task Workflows

### Task: Implement User Authentication

**1. Navigate:**
- Read: `ai/api/authentication.md` (Auth endpoints)
- Read: `ai/stores/stores.md` (Auth Store section)
- Check: `ai/constitution/tokens.md` (Token rules)

**2. Key Information:**
- Authentication: Cookie-based (Laravel Sanctum)
- Endpoints: `/login`, `/register`, `/logout`
- Store: `auth.store.ts`
- SSR: Partial SSR allowed (user hydration only)

**3. Implementation:**
- Create store actions using `useApi()`
- Handle 401 errors with auto-logout
- Store session in HTTP-only cookies

---

### Task: Build Product Catalog Page

**1. Navigate:**
- Read: `ai/api/catalog.md` (Catalog endpoints)
- Read: `ai/stores/stores.md` (Catalog Store section)
- Check: `ai/constitution/rendering.md` (SSR rules)

**2. Key Information:**
- Endpoints: `/api/v1/catalog/products`, `/api/v1/catalog/categories`
- Store: `catalog.store.ts`
- SSR: REQUIRED (SEO-critical)
- Rendering: Use `useAsyncData` for SSR fetch

**3. Implementation:**
- Fetch data in SSR using `useAsyncData`
- Store results in Pinia store
- Never access store at top level

---

### Task: Implement Shopping Cart

**1. Navigate:**
- Read: `ai/api/cart-favorites.md` (Cart endpoints)
- Read: `ai/stores/stores.md` (Cart Store section)
- Check: `ai/constitution/api-rules.md` (Versioning rules)

**2. Key Information:**
- Endpoints: `/api/v1/cart/*`
- Store: `cart.store.ts`
- SSR: FORBIDDEN (CSR-only)
- Versioning: Requires `If-Match` and `Idempotency-Key` headers

**3. Implementation:**
- Client-side only (`onMounted`)
- Handle version conflicts (409 errors)
- Use `X-Cart-Token` header

---

### Task: Build Checkout Flow

**1. Navigate:**
- Read: `ai/flows/checkout-flow.md` (Complete flow)
- Read: `ai/api/checkout-payments.md` (Checkout/Payment endpoints)
- Read: `ai/api/shipping-orders.md` (Shipping endpoints)
- Check: `ai/constitution/checkout.md` (Checkout rules)

**2. Key Information:**
- Multi-step flow: Start → Address → Shipping → Payment → Confirm
- Store: `checkout.store.ts`
- SSR: FORBIDDEN (CSR-only)
- Warehouse selection: Requires settlement + warehouse search

**3. Implementation:**
- Follow exact step sequence
- Handle cart invalidation on changes
- Support warehouse/pickup point selection
- Initialize payment after order creation

---

### Task: Add New Feature (Check Status)

**1. Navigate:**
- Read: `ai/operations/not-implemented.md` (Frontend roadmap)
- Read: `ai/operations/frontend-todo.md` (Quick checklist)

**2. Check Status:**
- Backend: ✅ All endpoints available
- Frontend: ❌ Many features need implementation

**3. Implementation:**
- Follow feature section in `not-implemented.md`
- Check off tasks in `frontend-todo.md`
- Consult relevant API files

---

## 🔍 Efficient File Discovery

### By Domain

Need to work with...
- **Authentication?** → `ai/api/authentication.md`
- **Products?** → `ai/api/catalog.md`
- **Cart?** → `ai/api/cart-favorites.md`
- **Checkout?** → `ai/api/checkout-payments.md` + `ai/flows/checkout-flow.md`
- **Orders?** → `ai/api/shipping-orders.md`
- **Blog?** → `ai/api/content.md`
- **Notifications?** → `ai/api/notifications-loyalty.md`
- **Newsletter?** → `ai/api/audience-support.md`
- **SEO/System?** → `ai/api/system-seo.md`

### By Endpoint

**Need specific endpoint?**
→ Check `ai/reference/endpoint-index.md` (alphabetical listing)

Example: Looking for `/api/v1/cart/items`
- Search in endpoint-index.md
- Find: "cart-favorites.md"
- Navigate to that file

### By Store

**Need store pattern?**
→ Open `ai/stores/stores.md`, use ToC to jump to specific store

**All 17 stores documented:**
Auth, System, Catalog, Product, Cart, Favorites, Comparison, Checkout, Orders, Blog, SEO, Support, Comments, Reviews, Loyalty, Notifications

---

## ⚡ Optimization Tips for Claude

### 1. Load Only What You Need

**Don't:** Read all 9 API files for a cart feature
**Do:** Read only `ai/api/cart-favorites.md`

**Benefit:** Faster processing, focused context

### 2. Use Navigation READMEs

**Don't:** Search through large files
**Do:** Check README.md files first:
- `ai/README.md` - Main navigation
- `ai/api/README.md` - API domains
- `ai/stores/README.md` - Store list
- `ai/operations/README.md` - Planning docs

**Benefit:** Quick orientation, faster navigation

### 3. Respect File Modularity

**Don't:** Try to remember everything from one large file
**Do:** Load specific domain file when needed

**Before reorganization:** 70KB api.md was hard to process
**After reorganization:** 9 files × ~8KB = Easy to process

### 4. Follow Task Workflows

**Don't:** Read documentation randomly
**Do:** Follow task-specific workflows above

**Benefit:** Systematic approach, nothing missed

### 5. Check Constitution First

**Before implementing anything:**
1. Check `ai/constitution/rendering.md` (SSR/CSR rules)
2. Check `ai/constitution/api-rules.md` (API contracts)
3. Check `ai/constitution/tokens.md` (Token management)

**Benefit:** Avoid rule violations, correct architecture

---

## 🎓 Learning the Codebase

### Phase 1: Core Understanding (30 min)
1. Read `ai/core/master-prompt.md` - Your role
2. Read `ai/core/architecture.md` - System structure
3. Read `ai/core/system-core.md` - Core rules
4. Skim `ai/README.md` - Navigation overview

### Phase 2: Domain Deep-Dive (per domain)
1. Pick a domain (e.g., catalog)
2. Read relevant `ai/api/{domain}.md`
3. Read store section in `ai/stores/stores.md`
4. Check constitution rules
5. Implement feature

### Phase 3: Advanced Flows
1. Read `ai/flows/checkout-flow.md`
2. Understand multi-step processes
3. Study error handling patterns
4. Implement complex features

---

## 🚫 Common Pitfalls

### ❌ Don't Do This

1. **Read everything at once** - Overloads context
2. **Ignore SSR/CSR rules** - Breaks rendering
3. **Access stores at top level** - Breaks SSR
4. **Invent API endpoints** - API contracts exist
5. **Use direct fetch()** - Use `useApi()` only
6. **Skip error handling** - Always handle 401, 422, 429
7. **Partial code output** - Always complete files

### ✅ Do This Instead

1. **Load files strategically** - Only what's needed
2. **Check rendering rules first** - Before any page
3. **Access stores correctly** - Inside computed/functions/onMounted
4. **Use documented endpoints** - Check `ai/api/*` or endpoint-index
5. **Use useApi() composable** - For all API calls
6. **Handle errors properly** - 401 → logout, 422 → validation, 429 → retry-after
7. **Output complete files** - With proper paths

---

## 📋 Pre-Implementation Checklist

Before writing any code:

- [ ] Identified correct API file (`ai/api/*.md`)
- [ ] Read relevant store section (`ai/stores/stores.md`)
- [ ] Checked SSR/CSR rules (`ai/constitution/rendering.md`)
- [ ] Verified API endpoints (`ai/reference/endpoint-index.md`)
- [ ] Understood token requirements (`ai/constitution/tokens.md`)
- [ ] Reviewed business flow if applicable (`ai/flows/*.md`)
- [ ] Checked for not-implemented status (`ai/operations/not-implemented.md`)

---

## 🎯 Quick Reference Card

**Authentication:**
- Cookie-based (Laravel Sanctum)
- No Bearer tokens on frontend
- GET `/sanctum/csrf-cookie` before login

**SSR Pages (use `useAsyncData`):**
- Home, Catalog, Product, Blog
- Public data only

**CSR-Only Pages (use `onMounted`):**
- Cart, Checkout, Favorites, Comparison
- Profile, Orders, Notifications

**Tokens:**
- `X-Cart-Token` - Cart operations
- `X-Guest-Id` - Favorites
- `X-Comparison-Token` - Comparison
- Cookies - Authentication

**Store Access:**
- ❌ Top level of `<script setup>`
- ✅ Inside `computed()`, `onMounted()`, `useAsyncData()`

**API Calls:**
- ✅ `useApi()` composable
- ❌ Direct `fetch()`

---

## 📚 Related Resources

- **[AGENTS.md](AGENTS.md)** - General rules for all AI agents
- **[ai/README.md](ai/README.md)** - Central documentation hub
- **[ai/operations/not-implemented.md](ai/operations/not-implemented.md)** - Features to implement
- **[ai/operations/frontend-todo.md](ai/operations/frontend-todo.md)** - Quick task list

---

## 🎉 You're Ready!

With this modular structure, you can:
- ✅ Find information 10x faster
- ✅ Load only relevant context
- ✅ Process documentation efficiently
- ✅ Implement features systematically
- ✅ Avoid common mistakes

**Start with:** [`ai/README.md`](ai/README.md) and navigate to what you need!

---

**Happy Coding!** 🚀
