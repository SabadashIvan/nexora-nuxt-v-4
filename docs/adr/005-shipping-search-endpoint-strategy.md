# ADR 005: Shipping Search Endpoint Strategy (Nitro Coalescing + TTL Cache)

**Status:** Proposed  
**Date:** 2026-01-14  
**Context:** Need secure shipping search (settlements/warehouses) with provider key isolation and reduced upstream load

## Decision

Implement Nitro endpoint `/api/shipping/search` with:
- **Provider isolation**: Provider keys never leave server
- **Request coalescing**: Identical concurrent requests share single upstream call
- **TTL cache**: Short-lived cache (5-30s) for repeated requests
- **Normalized response**: Provider-agnostic format for UI
- **Client debounce**: Debounced queries on client, not server

## Implementation

**Entry Points:**
- `server/routes/api/shipping/search.get.ts` - Endpoint implementation
- `server/utils/coalesce.ts` - Coalescing utility
- `app/composables/useShippingSearch.ts` - Client composable (to be created)

**Algorithm:**
1. Normalize params to stable cache key
2. Check cache (return if within TTL)
3. Check in-flight (await existing promise)
4. Create new request, store in in-flight, call provider, cache result

## Alternatives Considered

1. **Client-side direct calls** - Rejected (exposes provider keys)
2. **Server debounce** - Rejected (HTTP semantics make it unreliable)
3. **Global distributed cache** - Rejected (Nitro is instance-local)

## Consequences

**Positive:**
- Provider keys secured
- Reduced upstream load
- Better UX (coalescing + caching)

**Negative:**
- Instance-local only (no cross-instance sharing)
- Requires provider abstraction layer

## Testing Notes

- Test coalescing: N identical requests → 1 upstream call
- Test TTL cache: Repeated requests within TTL hit cache
- Test security: No provider keys in client bundle
- Test input validation: Invalid params return safe error
