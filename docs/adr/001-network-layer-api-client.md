# ADR 001: Network Layer - API Client, Header Forwarding, Typed Errors

**Status:** Accepted  
**Date:** 2026-01-14  
**Context:** Need centralized API client with SSR/CSR support, automatic header management, and typed error handling

## Decision

Implement a unified API client using `$fetch.create()` with:
- **SSR instance isolation**: Per-request instances on server (no singleton)
- **Automatic header forwarding**: Cookie forwarding for SSR, conditional `accept-language`/`user-agent`
- **If-Match scope rule**: Auto-add `If-Match` only for `/api/v1/cart/**` mutations
- **Idempotency-Key**: Auto-generated when `options.idempotent === true`
- **Typed error taxonomy**: Single `parseApiError()` mapping point for all HTTP errors
- **Automatic retry**: 409 (cart version) and 419 (CSRF) with bounded attempts

## Implementation

**Entry Points:**
- `app/composables/useApi.ts` - Main API client
- `app/utils/errors.ts` - Error taxonomy and parsing

**Key Features:**
1. SSR cookie forwarding via `useRequestHeaders(['cookie'])`
2. Per-request instance creation on server (lines 415-424 in `useApi.ts`)
3. If-Match auto-injection for cart mutations only (lines 338-344)
4. Idempotency-Key persistence across retries (lines 329-336)
5. Error classes: `ConcurrencyEvent`, `ValidationError`, `SessionError`, `UnknownApiError`

## Alternatives Considered

1. **Global singleton on server** - Rejected due to cookie/header leakage risk
2. **Manual header management in stores** - Rejected for maintainability
3. **Generic error handling** - Rejected for type safety

## Consequences

**Positive:**
- Centralized network logic
- Type-safe error handling
- Automatic concurrency control
- SSR/CSR consistency

**Negative:**
- Slight complexity in `useApi()` composable
- Requires understanding of retry policies

## Testing Notes

- Test SSR instance isolation (no cross-user leakage)
- Test 409 retry with Idempotency-Key
- Test 419 CSRF retry
- Test error taxonomy mapping
