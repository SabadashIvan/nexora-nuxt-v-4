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
- 🔒 **Token Management** - Secure guest and user token handling
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
├── architecture.md     # Complete architecture specification
├── api.md              # API endpoints documentation
├── stores.md           # Store definitions
├── checkout-flow.md    # Checkout process flow
└── constitution/       # Immutable rules
```

## 🎯 Key Concepts

### SSR vs CSR Pages

**SSR Pages** (SEO-critical, server-rendered):
- `/` (home)
- `/categories/*` (catalog)
- `/product/*` (product pages)
- `/blog/*` (blog pages)

**CSR Pages** (client-only, token-dependent):
- `/cart`
- `/checkout`
- `/favorites`
- `/comparison`
- `/profile/*`
- `/auth/*`

### Token Model

The application uses a secure token system:

- **User Token**: `Authorization: Bearer <token>` (for authenticated users)
- **Guest Tokens**: 
  - `X-Guest-Id` (for favorites)
  - `X-Cart-Token` (for cart operations)
  - `X-Comparison-Token` (for comparison)

All tokens are handled automatically via the `useApi()` composable.

### State Management

Business logic is centralized in Pinia stores:

- `auth.store.ts` - Authentication state
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

**Important**: Never implement business logic in components. Always use stores.

### API Integration

All API calls must:
- Use the `useApi()` composable (never raw `fetch()`)
- Include required headers automatically
- Follow endpoints defined in `ai/api.md`
- Handle errors properly (401 → logout, 422 → validation errors)

### Multi-language & Multi-currency

- **Locale**: Managed via `system.store`, sent as `Accept-Language` header
- **Currency**: Managed via `system.store`, sent as `Accept-Currency` header
- Changing locale/currency triggers reactive updates across the application

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run preview      # Preview production build
npm run generate     # Generate static site

# Code Quality
npm run lint         # Run ESLint
```

## 📚 Documentation

Complete project documentation is available in the `ai/` folder:

- **`ai/master-prompt.md`** - AI agent guidelines and system rules
- **`ai/architecture.md`** - Complete architecture specification
- **`ai/api.md`** - All API endpoints and contracts
- **`ai/stores.md`** - Pinia store definitions and behavior
- **`ai/checkout-flow.md`** - Detailed checkout process
- **`ai/constitution/`** - Immutable system rules

## 🔧 Configuration

### Nuxt Config

Key configuration in `nuxt.config.ts`:

- **Runtime Config**: API backend URL, site URL
- **Route Rules**: Caching strategy (SWR) for SSR pages, CSR-only for user pages
- **Modules**: Nuxt Image, Pinia, Content, ESLint

### Route Caching

The application uses SWR (Stale-While-Revalidate) caching:

- Categories: 1 hour
- Products: 1 hour
- Blog: 1 hour
- Homepage: 30 minutes
- Static pages: 1 hour

## 🚨 Important Rules

### For Developers

1. **Never invent API endpoints** - Only use endpoints from `ai/api.md`
2. **Never access stores at top level** - Use inside `useAsyncData`, `onMounted`, or computed properties
3. **Never use SSR for CSR-only pages** - Check rendering rules first
4. **Always use `useApi()`** - Never use raw `fetch()` in components
5. **Business logic in stores** - Never implement cart/checkout logic in components
6. **Always handle errors** - 401 → logout, 422 → validation errors

### For AI Agents

See `ai/master-prompt.md` and `AGENTS.md` for complete guidelines.

## 🐛 Troubleshooting

### Common Issues

**Hydration errors**: Ensure SSR data keys are unique (include route params)

**Token issues**: Check middleware execution order and cookie settings

**API errors**: Verify `NUXT_API_BACKEND_URL` is set correctly

**Type errors**: Run `npm run postinstall` to regenerate types

## 📄 License

Private project - All rights reserved

## 🤝 Contributing

This is a private project. For contribution guidelines, see the project documentation in `ai/`.

---

**Built with ❤️ using Nuxt 4**

