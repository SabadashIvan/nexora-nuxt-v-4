# Nexora Nuxt 4 E-commerce Platform

A production-grade Nuxt 4 e-commerce frontend application with full SSR/CSR hybrid rendering, multi-language and multi-currency support, and comprehensive checkout flow.

## 🚀 Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com) (Vue 3)
- **Language**: TypeScript
- **State Management**: Pinia
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide Vue Next
- **Image Optimization**: Nuxt Image
- **Content**: Nuxt Content
- **Linting**: ESLint (Nuxt ESLint)

## 📋 Prerequisites

- Node.js 24+ 
- npm, pnpm, yarn, or bun

## 🛠️ Setup

### Installation

```bash
# Install dependencies
npm install
# or
pnpm install
# or
yarn install
# or
bun install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
# Development
NUXT_API_BACKEND_URL=http://localhost:8000
NUXT_PUBLIC_API_BACKEND_URL=http://localhost:8000

# Production
# NUXT_API_BACKEND_URL=https://api.nexora-room15.store
# NUXT_PUBLIC_API_BACKEND_URL=https://api.nexora-room15.store

# Site Configuration
NUXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: API Secret (for server-side operations)
NUXT_API_SECRET=your-secret-key
```

### Development Server

Start the development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
# or
bun run dev
```

The application will be available at `http://localhost:3000`

## ✨ Features

### Core E-commerce
- 🛍️ **Product Catalog** - Full catalog browsing with filters, sorting, and pagination
- 🛒 **Shopping Cart** - Guest and authenticated cart management
- 💳 **Checkout Flow** - Multi-step checkout (address → shipping → payment → confirm)
- ⭐ **Favorites** - Product wishlist functionality
- 🔄 **Product Comparison** - Side-by-side product comparison
- 📦 **Order Management** - Order history and tracking

### User Features
- 👤 **Authentication** - Login, registration, email verification
- 🔐 **Password Reset** - Forgot password and reset flow
- 📍 **Address Management** - Shipping and billing addresses
- 📋 **Profile Management** - User profile and settings

### Content & SEO
- 📝 **Blog System** - Blog posts with categories and pagination
- 🔍 **SEO Optimization** - Server-driven SEO metadata
- 🌐 **Multi-language** - Locale support with `Accept-Language` headers
- 💰 **Multi-currency** - Currency support with `Accept-Currency` headers

### Technical
- ⚡ **Hybrid Rendering** - SSR for SEO-critical pages, CSR for user-specific pages
- 🔒 **Authentication** - Cookie-based authentication (Laravel Sanctum SPA)
- 🎫 **Token Management** - Secure guest token handling (X-Guest-Id, X-Cart-Token, X-Comparison-Token)
- 🎯 **Type Safety** - Full TypeScript coverage
- 📱 **Responsive Design** - Mobile-first approach

## 🏗️ Project Structure

```
app/
├── components/          # Vue components
│   ├── blog/           # Blog components
│   ├── cart/           # Cart components
│   ├── catalog/        # Catalog components
│   ├── checkout/       # Checkout components
│   ├── layout/         # Layout components
│   ├── product/        # Product components
│   ├── search/         # Search components
│   └── ui/             # Base UI components
├── composables/        # Vue composables
├── layouts/            # Nuxt layouts
├── middleware/         # Route middleware
├── pages/              # Nuxt pages (file-based routing)
├── plugins/            # Nuxt plugins
├── stores/             # Pinia stores
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

server/
└── routes/             # Server API routes

ai/                     # Project documentation
├── README.md           # Central navigation hub
├── core/               # System architecture & rules
│   ├── master-prompt.md
│   ├── architecture.md
│   └── system-core.md
├── api/                # API endpoints (9 domain-specific files)
│   ├── README.md       # API navigation index
│   ├── authentication.md
│   ├── catalog.md
│   ├── cart-favorites.md
│   ├── checkout-payments.md
│   ├── shipping-orders.md
│   ├── content.md
│   ├── notifications-loyalty.md
│   ├── audience-support.md
│   └── system-seo.md
├── stores/             # Pinia state management
│   ├── README.md       # Stores index
│   └── stores.md       # Complete store definitions
├── flows/              # Business process flows
│   └── checkout-flow.md
├── constitution/       # Immutable rules
│   ├── api-rules.md
│   ├── rendering.md
│   ├── checkout.md
│   ├── seo-i18n.md
│   └── tokens.md
├── operations/         # Planning & tracking
│   ├── README.md
│   ├── not-implemented.md
│   ├── frontend-todo.md
│   └── ai-rules.md
└── reference/          # Quick reference materials
    ├── endpoint-index.md
    └── dto-mapping.md
```

## 🎯 Key Concepts

### SSR vs CSR Pages

**SSR Pages** (SEO-critical, server-rendered):
- `/` (home)
- `/categories/*` (catalog)
- `/product/*` (product pages)
- `/blog/*` (blog pages)

**CSR-Only Pages** (client-only, token-dependent):
- `/cart`
- `/checkout`
- `/favorites`
- `/comparison`
- `/profile/*`
- `/auth/*`

These pages are client-only because they depend on guest tokens or user session cookies and are not SEO-critical.

### Authentication & Token Model

The application uses **cookie-based authentication** (Laravel Sanctum SPA authorization):

- **Authentication**: HTTP-only session cookies (automatically managed by `useApi()`)
  - No Bearer tokens required
  - CSRF protection mandatory for state-changing requests
  - Session cookies automatically attached to all authenticated requests

- **Guest Tokens** (for guest operations):
  - `X-Guest-Id` (for favorites)
  - `X-Cart-Token` (for cart operations)
  - `X-Comparison-Token` (for comparison)
  - Stored in localStorage (CSR) + cookies (SSR fallback)

All tokens and authentication are handled automatically via the `useApi()` composable.

### State Management

Business logic is centralized in Pinia stores:

- `auth.store.ts` - Authentication, profile, and address management
- `cart.store.ts` - Shopping cart management
- `checkout.store.ts` - Checkout flow state
- `catalog.store.ts` - Product catalog
- `product.store.ts` - Product details
- `favorites.store.ts` - Wishlist management
- `comparison.store.ts` - Product comparison
- `orders.store.ts` - Order history
- `blog.store.ts` - Blog content
- `seo.store.ts` - SEO metadata
- `system.store.ts` - System config (locale, currency)
- `notifications.store.ts` - User notifications
- `audience.store.ts` - Email marketing subscriptions
- `support.store.ts` - Customer support requests
- `comments.store.ts` - Product comments
- `reviews.store.ts` - Product reviews

**Important**: 
- Never implement business logic in components. Always use stores.
- Never access stores at the top level of script setup. Access stores inside `useAsyncData` callbacks (for SSR), `onMounted` hooks (for CSR), computed properties, or functions.

### API Integration

All API calls must:
- Use the `useApi()` composable (never raw `fetch()` in components)
- Include required headers automatically:
  - `Accept-Language` (from `system.store`)
  - `Accept-Currency` (from `system.store`)
  - Session cookies (HTTP-only, automatically attached for authenticated requests)
  - `X-Guest-Id`, `X-Cart-Token`, `X-Comparison-Token` (when applicable)
- Follow endpoints defined in `ai/api/` domain-specific files (never invent endpoints)
  - See `ai/api/README.md` for navigation
  - Use `ai/reference/endpoint-index.md` for quick endpoint lookup
- Handle errors properly:
  - `401` → auto-logout (handled by `useApi`)
  - `422` → validation error handling
  - Never swallow errors, always provide user feedback

**Authentication**: All authentication uses cookie-based session (Laravel Sanctum). Session cookies are automatically attached by `useApi()`. No Bearer tokens required.

### Multi-language & Multi-currency

- **Locale**: Managed via `system.store`, sent as `Accept-Language` header
- **Currency**: Managed via `system.store`, sent as `Accept-Currency` header
- Changing locale/currency triggers reactive updates across the application

### Middleware

Global middleware (runs on every request):
- `auth.global.ts` - Authentication state management
- `cart-token.global.ts` - Cart token initialization
- `comparison-token.global.ts` - Comparison token initialization
- `guest-token.global.ts` - Guest ID initialization
- `locale.global.ts` - Locale detection and management
- `seo.global.ts` - SEO metadata management

Middleware execution order is critical for proper token and locale handling.

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)

# Production
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run generate     # Generate static site (SSG)

# Code Quality
npm run lint         # Run ESLint

# Type Generation
npm run postinstall  # Regenerate Nuxt types (runs automatically after install)
```

## 📚 Documentation

Complete project documentation is available in the `ai/` folder. **Start here:** [`ai/README.md`](ai/README.md) - Central navigation hub

### Core Documentation
- **`ai/core/master-prompt.md`** - AI agent guidelines and system rules
- **`ai/core/architecture.md`** - Complete architecture specification
- **`ai/core/system-core.md`** - Immutable system core rules

### API Documentation (9 domain-specific files)
- **`ai/api/README.md`** - API documentation index
- **`ai/api/authentication.md`** - Auth, Identity, OAuth
- **`ai/api/catalog.md`** - Products, Categories, Search
- **`ai/api/cart-favorites.md`** - Cart, Wishlist, Comparison
- **`ai/api/checkout-payments.md`** - Checkout & Payments
- **`ai/api/shipping-orders.md`** - Shipping & Orders
- **`ai/api/content.md`** - Blog, Comments, Reviews
- **`ai/api/notifications-loyalty.md`** - Notifications & Loyalty
- **`ai/api/audience-support.md`** - Audience & Support
- **`ai/api/system-seo.md`** - System Config & SEO

### State Management
- **`ai/stores/stores.md`** - Complete Pinia store definitions (17 stores)

### Business Flows
- **`ai/flows/checkout-flow.md`** - Detailed checkout process

### Constitution (Immutable Rules)
- **`ai/constitution/api-rules.md`** - API contract rules
- **`ai/constitution/rendering.md`** - SSR vs CSR rendering rules
- **`ai/constitution/checkout.md`** - Checkout-specific rules
- **`ai/constitution/seo-i18n.md`** - SEO and i18n rules
- **`ai/constitution/tokens.md`** - Token model rules

### Reference Materials
- **`ai/reference/endpoint-index.md`** - Alphabetical endpoint listing
- **`ai/reference/dto-mapping.md`** - DTO mapping guide

**For AI Agents:** See [`AGENTS.md`](AGENTS.md) and [`CLAUDE.md`](CLAUDE.md) for complete guidelines.

## 🔧 Configuration

### Nuxt Config

Key configuration in `nuxt.config.ts`:

- **Runtime Config**: API backend URL, site URL
- **Route Rules**: Caching strategy (SWR) for SSR pages, CSR-only for user pages
- **Modules**: Nuxt Image, Pinia, Content, ESLint

### Route Caching

The application uses SWR (Stale-While-Revalidate) caching strategy defined in `nuxt.config.ts`:

- Categories (`/categories`, `/categories/**`): 1 hour (3600s)
- Products (`/product/**`): 1 hour (3600s)
- Blog (`/blog`, `/blog/**`): 1 hour (3600s)
- Homepage (`/`): 30 minutes (1800s)
- Static pages (`/faq`, `/shipping`, `/returns`, `/privacy`, `/terms`): 1 hour (3600s)

CSR-only pages (`/cart`, `/checkout`, `/favorites`, `/comparison`, `/profile/**`, `/auth/**`) are not cached and use client-side rendering only.

## 🚨 Important Rules

### For Developers

1. **Never invent API endpoints** - Only use endpoints from `ai/api/` domain-specific files (see `ai/api/README.md`)
2. **Never access stores at top level** - Use inside `useAsyncData`, `onMounted`, or computed properties
3. **Never use SSR for CSR-only pages** - Check `ai/constitution/rendering.md` first
4. **Always use `useApi()`** - Never use raw `fetch()` in components
5. **Business logic in stores** - Never implement cart/checkout logic in components
6. **Always handle errors** - 401 → logout, 422 → validation errors

### For AI Agents

See [`AGENTS.md`](AGENTS.md) and [`CLAUDE.md`](CLAUDE.md) for complete guidelines. Start with `ai/README.md` for navigation.

## 🐛 Troubleshooting

### Common Issues

**Hydration errors**: Ensure SSR data keys are unique (include route params)

**Token issues**: 
- Check middleware execution order and cookie settings
- Verify tokens are stored in cookies for SSR compatibility
- Ensure `X-Guest-Id`, `X-Cart-Token`, and `X-Comparison-Token` headers are set correctly

**API errors**: 
- Verify `NUXT_API_BACKEND_URL` is set correctly
- Check that all API calls use `useApi()` composable (never raw `fetch()`)
- Ensure required headers are included automatically

**Authentication issues**:
- Verify session cookies are being set correctly (check browser DevTools)
- Ensure CSRF cookie is retrieved before authenticated requests
- Check that `useApi()` is automatically attaching session cookies

**Type errors**: 
- Run `npm run postinstall` to regenerate types
- Verify TypeScript types are imported from `app/types/` folder

**Store access errors**:
- Never access stores at the top level of script setup
- Access stores inside `useAsyncData`, `onMounted`, computed properties, or functions
- Check if Pinia is available before accessing stores during SSR

## 📄 License

Private project - All rights reserved

## 🤝 Contributing

This is a private project. For contribution guidelines, see the project documentation in `ai/`.

---

**Built with ❤️ using Nuxt 4**

