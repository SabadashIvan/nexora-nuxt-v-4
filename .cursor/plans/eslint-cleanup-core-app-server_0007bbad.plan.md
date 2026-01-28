---
name: eslint-cleanup-core-app-server
overview: Fix all ESLint errors in the main Nuxt app and server code (excluding tests), based on the latest lint output.
todos:
  - id: triage-errors
    content: Enumerate all ESLint error locations in `app/` and `server/` from the provided log and confirm rule categories.
    status: completed
  - id: fix-unused-vars-imports
    content: Fix all `no-unused-vars` errors in `app/` and `server/` via removal or `_`-prefixing.
    status: completed
  - id: fix-no-explicit-any
    content: Replace `any` usages in `app/` and `server/` with concrete, `unknown`, or DTO-based types as appropriate.
    status: in_progress
  - id: fix-type-imports-and-interfaces
    content: Address `consistent-type-imports`, `no-empty-object-type`, and `no-invalid-void-type` issues in `app/types` and stores.
    status: pending
  - id: fix-validator-regex
    content: Update `app/utils/validator.ts` regexes to remove unnecessary escapes while preserving behavior.
    status: pending
  - id: verify-lint-clean
    content: Re-run ESLint for `app/` and `server/` and ensure there are no remaining errors.
    status: pending
isProject: false
---

## Goal

Bring the `app/` and `server/` source code to a clean ESLint state (no errors) while preserving behavior, leaving warnings and test files for a later pass.

## Scope

- **In scope**: Files under `app/` and `server/` that currently have ESLint errors in the provided log.
- **Out of scope**: Test files under `test/`, and style-only warnings (e.g., attribute order, self-closing tags, `no-v-html` warnings).

## Plan

### 1. Triage ESLint errors by category

- **Parse the lint log** to identify all errors in `app/` and `server/` files, grouped by rule:
  - `@typescript-eslint/no-unused-vars` / unused imports and variables
  - `@typescript-eslint/no-explicit-any`
  - `@typescript-eslint/consistent-type-imports`
  - `@typescript-eslint/no-empty-object-type`
  - `@typescript-eslint/no-invalid-void-type`
  - General rules like `prefer-const`, `no-useless-escape`, `import/first` (if any in app/server)
- **Confirm there are no other rule types** in app/server, so fixes can follow consistent patterns.

### 2. Fix unused variables and imports

- **Components and stores** (e.g., `ProductGrid.vue`, `OrderSummary.vue`, `ShippingMethodCard.vue`, `LoyaltyBalance.vue`, `LoyaltyHistory.vue`, `app/pages/checkout.vue`, `app/pages/stores.vue`, `app/layouts/profile.vue`, various stores and types):
  - For unused imports like icons (`Heart`, `ShoppingCart`, `Eye`, `Coins`, `CreditCard`, etc.) and types (`Pagination`, `CheckoutItem`, `CheckoutStatus`, `VariantOptionValue`, etc.), either:
    - Remove them if truly unused, or
    - If they are intended for future use and should stay, **prefix their identifiers with `_**` to satisfy the eslint rule.
  - For computed values or variables like `props`, `currentLabel`, `isFavorite`, `addToCart`, `toggleFavorite`, `hasSession`, `currentAttr`, `nuxtApp`, etc., decide per case:
    - If dead code: remove the declaration and any dependent code paths.
    - If needed later: rename with `_` prefix or wire them into the template/logic so they are actually used.
- **Server routes** (e.g., `seo.global.ts` `error` handler parameter):
  - If a parameter must exist for signature compatibility but isn’t used, rename to `_error` or similar.

### 3. Replace `any` types with concrete or generic-safe types

- **Server routes** like:
  - `server/routes/api/v1/customer-support/requests.post.ts`
  - `server/routes/forgot-password.post.ts`
  - `server/routes/login.post.ts`
  - `server/routes/reset-password.post.ts`
  - `server/routes/verify-email/[...path].get.ts`
- **App code** like `LanguageSwitcher.vue`, `checkout.vue`, `product.store.ts` (various methods), and any other `no-explicit-any` in `app/`:
  - Inspect how each `any` is used and replace with:
    - Proper DTO/interface types from `app/types/*.ts` when available.
    - Narrowed union or generic types that match actual usage (e.g., `Record<string, string>`, `unknown`, or `Error`), then use type guards/casts where necessary.
  - For callback signatures where the type is intentionally generic but unused, switch parameter type to `unknown` and narrow inside when needed.

### 4. Fix type-import style and empty/invalid types

- **Type-only imports** in `app/types/*.ts` (`blog.ts`, `cart.ts`, `catalog.ts`, `checkout.ts`, `menu.ts`, `support.ts`):
  - Change `import { Foo } from '...'` to `import type { Foo } from '...'` where the imported symbols are only used in type positions.
- **Empty interface issues** like in `blog.store.ts` and `checkout.ts` (`no-empty-object-type`):
  - Either add at least one meaningful property to the interface or remove/inline the interface if it adds no semantic value.
- **Invalid void type in `auth.store.ts**` (`no-invalid-void-type`):
  - Adjust the union type so `void` is used only in return position (e.g., change `Foo | void` to `Foo | undefined` or refactor the signature to use `void` as the function’s return type where appropriate).

### 5. Clean up utility regex escapes

- In `app/utils/validator.ts`:
  - Review the regex where `no-useless-escape` is reported.
  - Remove redundant backslashes that don’t change the regex semantics, ensuring the pattern still matches the desired strings (e.g., unescape `+`, `.`, `-`, parentheses where they are not special or already within character classes).
  - Re-run tests (if any) for validators to ensure behavior is unchanged.

### 6. Re-run ESLint for app/server and verify

- Execute `npm run lint -- app server` (or `npm run lint` if no scoped command exists) to confirm:
  - **Zero ESLint errors** for `app/` and `server/` paths.
  - Remaining issues are only warnings or limited to `test/` files.
- If any new errors appear due to type cascade changes, iteratively adjust the affected types or code until clean.

### 7. Optional small warning cleanups (only if trivial)

- If, during edits, it’s trivial and risk-free to resolve a warning in a touched file (e.g., `prefer-const` or simple attribute order), fix it while already modifying that file.
- Do **not** expand scope to full warning cleanup; keep focus on eliminating blocking ESLint errors.

