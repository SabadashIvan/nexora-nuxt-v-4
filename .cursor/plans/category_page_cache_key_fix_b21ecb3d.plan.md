---
name: Category Page Cache Key Fix
overview: The category page fails to show products after hydration because the `useAsyncData` cache key differs between SSR (USD) and client (EUR). The root cause is that `getCurrencyForCacheKey` in `[category].vue` prefers `systemStore.currentCurrency`, which can diverge between server and client. The fix is to use cookie-only resolution for the cache key, matching the product page and categories index.
todos: []
isProject: false
---

# Category Page Cache Key Mismatch (SSR vs Client)

## Root cause

Console output shows:

- **SSR:** `category-...-ru-USD-{}` and `Products computed - count: 20`
- **Client:** `category-...-ru-EUR-{}`, `Payload lookup: hasData: true`, then `Products computed - count: 0 data: []`

So:

1. **Different keys:** SSR uses `USD`, client uses `EUR` in the `useAsyncData` key.
2. **Wrong payload:** The client looks up `useNuxtData('...-EUR-...')` and `useAsyncData` uses that same key. The serialized payload was stored under the **SSR** key (`...-USD-...`). The EUR key does not match, so the client gets the `default` from `useAsyncData` (empty `products: []`) and does not re-fetch because `server: true` disables client fetch.
3. **Source of the mismatch:** `getCurrencyForCacheKey()` in `[category].vue `uses `systemStore.currentCurrency` first, then `getToken(TOKEN_KEYS.CURRENCY) || 'USD'`. The system store can differ:

   - **SSR:** Store may reflect `getToken`/middleware from the request; if the request has no `currency` cookie or `getToken` fails (e.g. `useRequestEvent()` / `getCookie`), middleware uses `DEFAULT_CURRENCY` = `USD`, so the store stays `USD`.
   - **Client:** After hydration, middleware/client logic syncs the store from `document.cookie`; if the user has `currency=EUR`, the store becomes `EUR`.

Because the **category page** uses the store first, it can resolve to USD on the server and EUR on the client. The **product page**, **categories index**, and **home** use **only** `getToken(TOKEN_KEYS.CURRENCY) || 'USD'` for the cache key, so SSR and client both use the same source (request cookie vs `document.cookie`) and stay in sync.

---

## Fix

In [`app/pages/categories/[category].vue`](app/pages/categories/[category].vue), change `getCurrencyForCacheKey` to use **only** the cookie, and remove the system store preference.

### 1. Align `getCurrencyForCacheKey` with product and categories index

**Current (lines 20–30):**

```ts
const getCurrencyForCacheKey = (): string => {
  try {
    const systemStore = useSystemStore()
    if (systemStore.currentCurrency) {
      return systemStore.currentCurrency
    }
  } catch {
    // Store might not be available yet in some SSR edge cases
  }
  return getToken(TOKEN_KEYS.CURRENCY) || 'USD'
}
```

**Replace with (same as product/categories index):**

```ts
const getCurrencyForCacheKey = (): string => {
  return getToken(TOKEN_KEYS.CURRENCY) || 'USD'
}
```

This makes the cache key depend only on `getToken` (cookie on SSR via `getCookie` from the request, on client via `document.cookie`), so the key is consistent between SSR and client.

### 2. (Optional) Remove or guard debug logging

- **`debugCacheKey` (lines 85–96):** Used as the `useAsyncData` key getter. It can be replaced by a simple key function and the `console.log` removed or wrapped in `import.meta.dev`.
- **`payloadCategoryData` (lines 77–82):** Remove the `console.log('Payload lookup:', ...)` or guard with `import.meta.dev`.
- **`products` computed (lines 291–295):** Remove `console.log('Products computed - count:', ...)` or guard with `import.meta.dev`.

Recommendation: remove or dev‑guard these so production is not noisy; the key fix does not depend on them.

---

## Optional: simplify the `useAsyncData` key

Instead of passing `debugCacheKey` (which both returns the key and logs), pass a getter that only builds the key:

```ts
() => buildCategoryCacheKey(categorySlug.value, route.query, locale.value, getCurrencyForCacheKey())
```

`buildCategoryCacheKey` already exists and is used elsewhere. This keeps the key logic in one place and makes the `useAsyncData` call easier to read.

---

## Files to change

| File | Change |

|------|--------|

| [`app/pages/categories/[category].vue`](app/pages/categories/[category].vue) | 1) Simplify `getCurrencyForCacheKey` to cookie-only. 2) Optionally replace `debugCacheKey` with the `buildCategoryCacheKey` getter and remove or dev‑guard `console.log` in `payloadCategoryData` and the `products` computed. |

---

## Behaviour after the fix

- **SSR:** `getCurrencyForCacheKey()` → `getToken(TOKEN_KEYS.CURRENCY) || 'USD'`. If the request has `currency=EUR`, `getToken` returns `EUR`; if not, `USD`.
- **Client:** Same expression; `getToken` reads `document.cookie`. For the same user/session, the value matches the one used on SSR.
- **Cache key:** Same on SSR and client → `useAsyncData` and `useNuxtData` use the same key → the client reuses the serialized payload and `products` (and related computeds) stay correct.

`watch: [locale, currency] `and the `refresh` on locale/currency change remain valid; when the user switches currency, the cookie and `getToken` update, the key changes, and `useAsyncData` refetches as intended.

---

## Verification

1. Open a category with `currency=EUR` in the cookie (e.g. after switching via `CurrencySwitcher`).
2. Hard refresh (or open in a new tab) so the page is server-rendered.
3. Confirm in the console that the cache key uses the same currency on SSR and CLIENT (e.g. both `...-ru-EUR-{}`).
4. Confirm the product list and category info render correctly after hydration (no flash of empty state).

Repeat with no `currency` cookie (or `USD`) to ensure the `'USD'` fallback still aligns between SSR and client.