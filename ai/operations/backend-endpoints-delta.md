# Backend Endpoints Delta

**Last Updated:** 2026-01-28

This document compares the backend API spec (from `endpoints/` YAML) with frontend documentation and implementation. It lists what to **update**, **add**, and **implement** on the frontend.

---

## Overview

| Item | Source |
|------|--------|
| **Backend spec** | `endpoints/` (22 YAML files: `00.yaml`–`20.yaml` + `custom.0.yaml`) |
| **Frontend docs** | [endpoint-index.md](../reference/endpoint-index.md), [ai/api/*.md](../api/) |
| **Frontend code** | `app/` (stores, composables, pages) |

Use this file when aligning docs and code with the live backend API.

---

## 1. New Endpoints

Endpoints present in the backend spec but missing from frontend docs and/or code.

| Endpoint | Method | Domain | Doc updates | Implementation |
|----------|--------|--------|-------------|----------------|
| `/api/v1/site/locations` | GET | Site | Add to [endpoint-index](../reference/endpoint-index.md) and [system-seo.md](../api/system-seo.md) | **Done** — [system.store](../../app/stores/system.store.ts), [/stores](../../app/pages/stores.vue) |
| `/api/v1/catalog/recommendations/variants` | GET | Catalog | Add to [catalog.md](../api/catalog.md) and endpoint-index | **TODO** — e.g. "You may also like" on product page |
| `/api/v1/checkout/{id}/loyalty` | POST, DELETE | Checkout | Add to [checkout-payments.md](../api/checkout-payments.md), [checkout-flow.md](../flows/checkout-flow.md), endpoint-index | **TODO** — Apply/remove loyalty points during checkout |
| `/api/v1/identity/genders` | GET | Identity | Add to [authentication.md](../api/authentication.md) and endpoint-index | **TODO** — Only if profile forms need gender (e.g. edit profile) |
| `/api/v1/identity/me/profile` | PUT | Identity | Add to authentication.md and endpoint-index | **TODO** — Only if profile edit UI exists or is planned |
| `/api/v1/comments/{id}` | PATCH, DELETE | Content | Add to [content.md](../api/content.md) and endpoint-index | **TODO** — Only if we support comment edit/delete |

---

## 2. Updates / Mismatches

Discrepancies between backend spec and frontend docs or code. Verify with backend where needed, then update accordingly.

| Item | Backend (endpoints/) | Frontend (docs/code) | Action |
|------|----------------------|----------------------|--------|
| **Cart version** `GET /api/v1/cart/v` | YAML: **GET** (description says HEAD), 204 | Endpoint-index: **HEAD** | Verify actual HTTP method; align docs (and useApi if we add explicit cart-version fetch) |
| **Cart attach** | **Not present** in any endpoint YAML | [cart.store](../../app/stores/cart.store.ts) calls `POST /cart/attach` | Verify with backend whether attach exists; if not, remove usage and doc references |
| **Catalog products** | **Only** `/api/v1/catalog/variants` (list + detail). No `/catalog/products`. | Endpoint-index lists `/catalog/products`. [useApi](../../app/composables/useApi.ts) coalesces `/api/v1/catalog/products`. Catalog uses variants. | **Update** docs to variants-only. **Remove or repoint** products coalesce in useApi |
| **Catalog categories** | `categories/{idOrSlug}` (id or slug) | Docs say `categories/{slug}` | **Update** docs to `{idOrSlug}`; current usage remains valid |
| **Change-email confirm** | `GET /change-email/{id}/{hash}` (signed URL, redirect) | Auth store uses `POST /change-email/confirm/{token}` with `{ email }` | **Verify** which flow backend supports (redirect vs token POST). Align frontend flow and docs |
| **System / health** | **Not in** endpoints: no `system/config`, `system/currency`, `system/locale`, `system/currencies`, `system/locales`, `health` | Endpoint-index lists these. App uses `/app/languages`, `/app/currencies` only. | **Verify** existence of system/* and health; **update or remove** from endpoint-index |
| **Shipping providers** | **Not in** endpoints. Only `shipping/methods`, `webhook`, `settlements/search`, `warehouses/search`. | Endpoint-index lists `GET /api/v1/shipping/providers` | **Remove** or mark as N/A in docs; backend has no such route |

---

## 3. Deprecated / Remove

Endpoints or doc entries that should be removed or marked N/A.

- **`GET /api/v1/shipping/providers`** — Backend has no such route. Remove from [endpoint-index](../reference/endpoint-index.md) or mark N/A.
- **`/api/v1/catalog/products`** — Backend uses `/catalog/variants` only. Remove from endpoint-index; remove or repoint [useApi](../../app/composables/useApi.ts) coalesce for `/api/v1/catalog/products`.
- **`GET /api/v1/health`**, **`GET /api/v1/system/config`**, **`PUT /api/v1/system/currency`**, **`GET /api/v1/system/currencies`**, **`PUT /api/v1/system/locale`**, **`GET /api/v1/system/locales`** — Not in backend YAML. Confirm with backend; then update or remove from endpoint-index.

---

## 4. Implementation Checklist

Concrete tasks to bring frontend docs and code in line with the backend spec.

### Documentation

- [ ] Add `/api/v1/site/locations` to [endpoint-index.md](../reference/endpoint-index.md) and [system-seo.md](../api/system-seo.md).
- [ ] Add `/api/v1/catalog/recommendations/variants` to [catalog.md](../api/catalog.md) and endpoint-index.
- [ ] Add `POST`/`DELETE` `/api/v1/checkout/{id}/loyalty` to [checkout-payments.md](../api/checkout-payments.md), [checkout-flow.md](../flows/checkout-flow.md), and endpoint-index.
- [ ] Add `/api/v1/identity/genders`, `PUT /api/v1/identity/me/profile`, and `api/v1/identity/auth/*` to [authentication.md](../api/authentication.md) and endpoint-index.
- [ ] Add `PATCH`/`DELETE` `/api/v1/comments/{id}` to [content.md](../api/content.md) and endpoint-index.
- [ ] Update catalog docs: `categories/{slug}` → `categories/{idOrSlug}`; remove or clarify `/catalog/products` vs variants.
- [ ] Verify cart/v method (GET vs HEAD) and update endpoint-index.
- [ ] Verify cart attach, change-email confirm, system/*, health with backend; then update or remove from endpoint-index.
- [ ] Remove or mark N/A `GET /api/v1/shipping/providers` in endpoint-index.

### Code

- [ ] Remove or repoint [useApi](../../app/composables/useApi.ts) coalesce for `/api/v1/catalog/products` (use variants path if coalesce kept).
- [ ] If cart attach is confirmed missing: remove `attachCart` usage from [cart.store](../../app/stores/cart.store.ts) and related callers; remove doc references.
- [ ] Implement checkout loyalty (apply/remove points) in checkout store and [checkout](../../app/pages/checkout.vue) UI.
- [ ] Implement catalog recommendations (e.g. "You may also like") using `/api/v1/catalog/recommendations/variants`.
- [ ] Implement comment PATCH/DELETE only if we support edit/delete; add identity genders and profile PUT if needed.

---

**Navigate back:** [README.md](README.md)
