---
name: Route groups meta.groups auth
overview: Adopt Nuxt's route groups ((protected), (guest)) and the meta.groups API in page meta (#33460) to drive auth middleware from folder structure instead of hardcoded path arrays, reducing duplication and keeping protection rules colocated with routes.
todos:
  - id: move-protected-profile
    content: Create (protected)/profile/ and move all profile pages and order/[id].vue into it
    status: pending
  - id: move-guest-auth
    content: Create (guest)/auth/ and move only login.vue and register.vue from auth/ into it
    status: pending
  - id: update-auth-middleware
    content: Replace PROTECTED_ROUTES/GUEST_ONLY_ROUTES and path checks with to.meta.groups in auth.global.ts
    status: pending
  - id: typing-if-needed
    content: Add or adjust RouteMeta/PageMeta typing for groups if TypeScript or IDE requires it
    status: pending
  - id: verify-and-docs
    content: Verify meta.groups in 4.3, run app, and adjust docs only if paths are referenced
    status: pending
isProject: false
---

# Adopt Route Groups and meta.groups in Auth Middleware

## Current State

- **Auth middleware** ([app/middleware/auth.global.ts](app/middleware/auth.global.ts)) uses hardcoded arrays:
  - `PROTECTED_ROUTES = ['/profile'] `— `to.path.startsWith(route)`
  - `GUEST_ONLY_ROUTES = ['/auth/login', '/auth/register']` — same
- **Profile**: 8 pages under [app/pages/profile/](app/pages/profile/) with `definePageMeta({ layout: 'profile', ssr: false })`.
- **Auth**: 9 pages under [app/pages/auth/](app/pages/auth/); only **login** and **register** are guest-only today. Others (forgot-password, reset-password, email-verification, change-*-confirm) are not.
- **i18n**: `prefix_except_default` (ru default) — paths can be `/profile` or `/en/profile`; `to.meta` comes from the matched route and is unaffected by the locale prefix.

## How Route Groups and meta.groups Work

- Folders named `(groupName)` are **ignored for the URL** (e.g. `(protected)/profile/index.vue` → `/profile`).
- Nuxt **exposes** those folder names in `route.meta.groups` (e.g. `['protected']`) so middleware and other code can branch on group membership instead of path prefixes.
- No change to `definePageMeta` is required for `groups`; it is derived from the `(groupName)` segments in the file path.

## 1. Restructure Pages with Route Groups

### 1.1 Protected: `(protected)/profile/`

Move the entire [app/pages/profile/](app/pages/profile/) tree into a `(protected)` group. **URLs stay the same** (`/profile`, `/profile/orders`, etc.).

```
app/pages/(protected)/profile/
├── index.vue
├── addresses.vue
├── loyalty.vue
├── notifications.vue
├── notifications-preferences.vue
├── orders.vue
├── settings.vue
└── order/
    └── [id].vue
```

- **Action**: Create `app/pages/(protected)/profile/` and move all existing profile pages (and `order/[id].vue`) into it. Do **not** modify `definePageMeta` or component code; only change file paths.

### 1.2 Guest-only: `(guest)/auth/` for login and register only

To match current behavior (only login and register are guest-only), place **only** those two under `(guest)`:

```
app/pages/(guest)/auth/
├── login.vue
└── register.vue
```

The rest remain under `app/pages/auth/` (forgot-password, reset-password, email-verification, change-email-confirm, change-password-confirm). Their URLs stay `/auth/forgot-password`, etc., and they will **not** have `'guest'` in `meta.groups`, so the middleware will not redirect authenticated users from them.

- **Action**: Create `app/pages/(guest)/auth/`, move `login.vue` and `register.vue` from `app/pages/auth/` into it. Leave the other auth pages in `app/pages/auth/`.

## 2. Update Auth Middleware

In [app/middleware/auth.global.ts](app/middleware/auth.global.ts):

- **Remove** `PROTECTED_ROUTES` and `GUEST_ONLY_ROUTES`.
- **Replace**:
  - `isProtectedRoute` = `PROTECTED_ROUTES.some(route => to.path.startsWith(route))`  

→ `to.meta.groups?.includes('protected') ?? false`

  - `isGuestOnlyRoute` = `GUEST_ONLY_ROUTES.some(route => to.path.startsWith(route))`  

→ `to.meta.groups?.includes('guest') ?? false`

- Keep all other logic: `import.meta.server` early return, Pinia/authStore usage, `navigateTo` for redirects.

Example:

```ts
const isProtectedRoute = to.meta.groups?.includes('protected') ?? false
const isGuestOnlyRoute = to.meta.groups?.includes('guest') ?? false
```

## 3. Typing (Optional)

If TypeScript complains about `to.meta.groups`, extend `PageMeta` / `RouteMeta` so `groups` is typed (e.g. in `app/types` or a `*.d.ts`). Nuxt 4.3 may already include this; add only if the compiler or IDE flags it.

## 4. Verification and Docs

- **Nuxt version**: Project uses `nuxt@^4.3.0`. The `meta.groups` behavior for route groups (#33460) should be present; if not, upgrading or checking the 4.3 changelog may be needed.
- **Constitution / rendering**: [ai/constitution/rendering.md](ai/constitution/rendering.md) refers to paths (`/profile/*`, `/auth/*`), not folders. No change needed.
- **Links**: All `localePath('/profile/...')`, `localePath('/auth/login')`, etc. stay valid; only file locations change.

## 5. Behavior Summary

| Route            | Before (path-based)     | After (meta.groups)      |

|-----------------|-------------------------|---------------------------|

| `/profile`      | protected                | `groups` includes `protected` |

| `/profile/*`    | protected                | same                      |

| `/auth/login`   | guest-only               | `groups` includes `guest` |

| `/auth/register`| guest-only               | same                      |

| `/auth/forgot-password` etc. | not guest-only | no `guest` in `groups` → unchanged |

## Files to Touch

| Action   | Path |

|----------|------|

| Create   | `app/pages/(protected)/profile/` (and move profile tree here) |

| Create   | `app/pages/(guest)/auth/` (and move `login.vue`, `register.vue` here) |

| Edit     | [app/middleware/auth.global.ts](app/middleware/auth.global.ts) |

| Optional | `app/types` or `*.d.ts` for `meta.groups` if needed |

## Optional: Expand Guest-Only to All of `/auth/*`

If you prefer to redirect **all** authenticated users away from any `/auth/*` page, move the entire `auth/` directory under `(guest)/auth/` and keep `isGuestOnlyRoute = to.meta.groups?.includes('guest')`. That would add redirects for forgot-password, reset-password, email-verification, and the confirm pages. The plan above preserves the current, narrower guest-only set (login + register).