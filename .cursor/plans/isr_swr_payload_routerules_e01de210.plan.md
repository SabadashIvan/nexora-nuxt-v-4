---
name: ISR/SWR Payload routeRules
overview: Enable Nuxt 4 routeRules for ISR/SWR so that cached `_payload.json` files are generated for SEO SSR routes. This allows client-side navigation and CDNs to serve cached payloads, reducing API calls. The existing commented routeRules in nuxt.config.ts will be updated, uncommented, and extended to cover i18n-prefixed paths and the new payload behavior.
todos:
  - id: uncomment-route-rules
    content: Uncomment routeRules in nuxt.config.ts and replace with CSR + ISR/SWR blocks
    status: pending
  - id: fix-i18n-prefix
    content: Remove /uk/ rules, ensure /en/ rules cover all CSR and ISR routes
    status: pending
  - id: align-static-pages
    content: Use /pages/** and /en/pages/** instead of /faq, /shipping, etc.
    status: pending
  - id: add-stores-and-en-home
    content: Add /stores, /en/stores, /en and optionally /en/ to routeRules
    status: pending
isProject: false
---

# ISR/SWR Payload Extraction – routeRules Plan

## Context

- **Nuxt 4.3.0** and Nitro support `isr` and `swr` in `routeRules`. As of [#33467](https://github.com/nuxt/nuxt/issues/33467), ISR/SWR (and `cache`) routes now produce `_payload.json` (or inlined payload), so:
  - Client-side navigation can use cached payloads.
  - CDNs (Vercel, Netlify, Cloudflare) can cache payloads with HTML.
  - Fewer API calls when payloads are served from cache.

- **Existing setup:** [nuxt.config.ts](nuxt.config.ts) has a large **commented** `routeRules` block using `swr` for categories, product, blog, home, static pages, and `ssr: false` for CSR. It also used `/uk/` (incorrect; i18n only has `en` as non-default) and omitted `/pages/**` (static pages are under [app/pages/pages/[slug].vue](app/pages/pages/[slug].vue)).

- **i18n:** `prefix_except_default`, default `ru`, locale `en`. So:
  - Default (ru): `/`, `/product/...`, `/categories`, `/blog`, `/pages/...`, `/stores`, etc. (no prefix).
  - English: `/en`, `/en/product/...`, `/en/categories`, `/en/blog`, `/en/pages/...`, `/en/stores`, etc.

- **SSR pages** (from [ai/constitution/rendering.md](ai/constitution/rendering.md) and code): `/`, `/categories`, `/categories/**`, `/product/**`, `/blog`, `/blog/**`, `/pages/**`, `/stores`. All use `useAsyncData` and are suitable for ISR/SWR.

- **CSR-only:** `/cart`, `/checkout`, `/favorites`, `/comparison`, `/profile/**`, `/auth/**` (and `/en/...` for each). These must keep `ssr: false` and must **not** get `isr`/`swr`.

---

## 1. `isr` vs `swr`

- **`swr`:** Nitro cache + `stale-while-revalidate` behavior. After TTL, serve cached response and revalidate in background. Works on any preset (e.g. `node-server`, reverse proxy).
- **`isr`:** Same behavior as `swr` plus CDN-friendly behavior on Netlify/Vercel (and possibly others). `isr: true` = “until next deploy”; `isr: 3600` = TTL in seconds.

**Recommendation:** Prefer **`isr`** when deploying to Vercel/Netlify (or similar) for CDN caching; use **`swr`** if not using those platforms or if you want to avoid CDN-specific behavior. TTLs below follow the existing commented intent (e.g. 3600 for catalog/blog, 1800 for home).

---

## 2. routeRules to add/update

Uncomment and **replace** the block in [nuxt.config.ts](nuxt.config.ts) with the following. Use **either** `isr` or `swr` consistently; the snippet uses `isr` to match the Nuxt 4 ISR/SWR payload example.

### 2.1. CSR rules (`ssr: false`) — first

Keep these so `/cart`, `/checkout`, etc. stay client-only. Fix `/uk/` → remove (only `en` exists). Keep `/en/` for the non-default locale.

```ts
// CSR-only (ssr: false) – order before any broad ISR/SWR rules
'/cart': { ssr: false },
'/checkout': { ssr: false },
'/favorites': { ssr: false },
'/comparison': { ssr: false },
'/profile/**': { ssr: false },
'/auth/**': { ssr: false },
'/en/cart': { ssr: false },
'/en/checkout': { ssr: false },
'/en/favorites': { ssr: false },
'/en/comparison': { ssr: false },
'/en/profile/**': { ssr: false },
'/en/auth/**': { ssr: false },
```

### 2.2. ISR/SWR rules for SSR routes

Map to real routes: `/categories` + `/categories/**`, `/product/**`, `/blog` + `/blog/**`, `/pages/**`, `/stores`, and home. Include both unprefixed (default locale) and `/en/` where applicable.

```ts
// Home
'/': { isr: 1800 },
'/en': { isr: 1800 },

// Categories (list + [category])
'/categories': { isr: 3600 },
'/categories/**': { isr: 3600 },
'/en/categories': { isr: 3600 },
'/en/categories/**': { isr: 3600 },

// Product
'/product/**': { isr: 3600 },
'/en/product/**': { isr: 3600 },

// Blog (index, category, posts)
'/blog': { isr: 3600 },
'/blog/**': { isr: 3600 },
'/en/blog': { isr: 3600 },
'/en/blog/**': { isr: 3600 },

// Static pages ([slug] e.g. /pages/faq, /pages/terms, /pages/privacy)
'/pages/**': { isr: 3600 },
'/en/pages/**': { isr: 3600 },

// Stores
'/stores': { isr: 3600 },
'/en/stores': { isr: 3600 },
```

If you prefer **`swr`**, substitute `swr` for `isr` in the block above and keep the same TTLs.

---

## 3. Static pages: `/pages/**` vs `/faq`, `/shipping`, etc.

The commented block used `/faq`, `/shipping`, `/returns`, `/privacy`, `/terms`. The app uses [app/pages/pages/[slug].vue](app/pages/pages/[slug].vue), so those live under `/pages/faq`, `/pages/shipping`, etc. The plan uses `/pages/**` and `/en/pages/**` to cover all `[slug]` pages. If you later add top-level `/faq`, `/terms`, etc., add matching rules (e.g. `/faq`: `{ isr: 3600 }`).

---

## 4. No code changes in pages

SSR pages already use `useAsyncData` with stable keys (including locale/currency where needed). With ISR/SWR, Nuxt/Nitro will:

- Cache the rendered HTML and the payload for each URL.
- On client-side navigation, reuse the cached payload when available (fewer API calls).
- On CDN, allow caching of `_payload.json` (or inlined payload) next to HTML.

No `getCachedData` or other useAsyncData changes are required. The product/category comments about avoiding `getCachedData` for locale/currency remain valid; route-level cache is per-URL, so locale is reflected by the path. Currency is still cookie-based (see below).

---

## 5. Currency and cache

Product, category, home, and categories index use **currency from a cookie** in `useAsyncData` keys. With ISR/SWR, the **cache is per URL**, not per cookie. The first request that fills the cache for e.g. `/product/foo` will use that request’s currency; other users with a different currency cookie will get the same cached payload until revalidation.

The previously commented `swr` rules already applied to these routes, so this trade-off is consistent with the earlier design. If it’s not acceptable, options are:

- Shorten TTL (e.g. 300–600s) for product/category and home, or  
- Omit ISR/SWR for those routes.

---

## 6. `nuxt generate` vs `nuxt build`

From the [Nuxt rendering docs](https://nuxt.com/docs/guide/concepts/rendering#route-rules): **Hybrid Rendering (and thus `isr`/`swr`) is not available when using `nuxt generate`.** These routeRules only take effect with `nuxt build` and a server (or a platform that runs the Nitro server, e.g. Vercel, Netlify, Node). If the project is today built with `nuxt generate`, you’d need to switch to `nuxt build` (and an appropriate preset) for ISR/SWR and payload caching to work.

---

## 7. Optional: `/en/` for non‑default locale home

Some i18n setups also serve `/en/` for the English home. If `/en/` is a distinct route in your app, add:

```ts
'/en/': { isr: 1800 },
```

---

## 8. Deployment and CDN

- **Vercel / Netlify:** `isr` is supported; cached HTML and payload can be stored at the edge.
- **Cloudflare (Pages, etc.):** Support depends on the Nitro preset and adapter; if you use one of the supported setups, the same `isr` rules can apply.
- **Other (e.g. plain Node):** `swr` still provides server- and reverse-proxy-level caching and payload reuse; `isr` can be used as well with the same TTL semantics where the CDN-specific parts are no-ops.

---

## 9. Files to touch

| File | Change |

|------|--------|

| [nuxt.config.ts](nuxt.config.ts) | Uncomment `routeRules`, remove the old block, and replace with the CSR block (2.1) plus the ISR block (2.2). Optionally add `/en/` and/or switch `isr`→`swr` as chosen. |

No edits to pages, composables, or [ai/constitution/rendering.md](ai/constitution/rendering.md) are required for basic ISR/SWR and payload caching.

---

## 10. Sanity checks after enabling

1. Run `nuxt build` (not `nuxt generate`) and deploy to a target that supports the Nitro server.
2. For an ISR’d route (e.g. `/product/xyz`):

   - First request: full render, then cache.
   - Later request within TTL: cached HTML + payload; in the network tab, payload may be loaded from cache or inlined.

3. Confirm CSR routes (`/cart`, `/checkout`, etc.) remain client-only (no SSR HTML).
4. If using a CDN, confirm it caches the relevant HTML and `_payload.json` (or equivalent) according to your platform’s docs.