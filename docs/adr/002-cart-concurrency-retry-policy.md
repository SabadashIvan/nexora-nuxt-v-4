# ADR 002: Cart Concurrency & Retry Policy (If-Match + Idempotency)

**Status:** Accepted  
**Date:** 2026-01-14  
**Context:** Cart mutations require optimistic concurrency control (If-Match) and safe retries on 409 conflicts

## Decision

**Contract:** All cart mutations MUST be sent with `idempotent: true` so `Idempotency-Key` is always present for the entire retry cycle.

**Implementation:**
1. **If-Match scope**: Auto-added ONLY for `/api/v1/cart/**` routes (non-GET)
2. **Idempotency enforcement**: Auto-set `idempotent: true` for cart mutations (lines 325-327 in `useApi.ts`)
3. **409 retry safety**: Retry allowed ONLY if `Idempotency-Key` is present
4. **Retry mechanism**: Manual re-invoke (not ofetch's built-in retry)
5. **Max retries**: 3 attempts for 409, 1 attempt for 419

## Implementation

**Entry Points:**
- `app/composables/useApi.ts` - Lines 324-344 (If-Match), 356-382 (409 retry)
- `app/stores/cart.store.ts` - `getCurrentVersion()`, `updateVersion()`

**Key Rules:**
- 409 retry: Fetch latest cart version, update If-Match, re-invoke
- No retry for non-replayable bodies (FormData, streams)
- Separate retry counters: `_retry409Count`, `_retry419Count`

## Alternatives Considered

1. **Manual If-Match in stores** - Rejected for maintainability
2. **No retry on 409** - Rejected for UX (user would need to retry manually)
3. **Unlimited retries** - Rejected for safety (bounded at 3)

## Consequences

**Positive:**
- Safe concurrent cart updates
- Automatic conflict resolution
- No manual retry logic in stores

**Negative:**
- Requires understanding of idempotency contract
- Network layer complexity

## Testing Notes

- Test 409 retry with Idempotency-Key (succeeds)
- Test 409 without Idempotency-Key (throws immediately)
- Test max retry limit (3 attempts)
- Test cart version update after retry
