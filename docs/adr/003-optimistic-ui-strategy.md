# ADR 003: Optimistic UI Strategy for Cart (Transaction Model + Rollback Policy)

**Status:** Accepted  
**Date:** 2026-01-14  
**Context:** Improve UX with immediate cart updates while maintaining consistency on errors

## Decision

Implement transaction-based optimistic UI with:
- **Feature flag**: `runtimeConfig.public.features.cartOptimisticUI`
- **Transaction model**: `pendingOps` queue with apply/revert functions
- **Deep clone**: Use `structuredClone()` for cart snapshots
- **Rollback policy**: Rollback on 409 (concurrency) and 422 (validation), not on transient errors
- **Supported operations**: `updateQty`, `removeItem`, `addItem` (when item exists)

## Implementation

**Entry Points:**
- `app/stores/cart.store.ts` - Lines 28-71 (optimistic operations), 277-346 (state management)
- `nuxt.config.ts` - Line 16 (feature flag)

**Key Components:**
1. `confirmedCart`: Last confirmed server state
2. `pendingOps`: Array of pending operations with IDs
3. `rebuildOptimisticCart()`: Applies pending ops to confirmed state
4. `rollbackOptimisticOperation()`: Removes op and rebuilds

## Alternatives Considered

1. **Shallow snapshot rollback** - Rejected for mutation bugs
2. **Full cart rollback on any error** - Rejected for UX (transient errors shouldn't rollback)
3. **No optimistic UI** - Rejected for perceived performance

## Consequences

**Positive:**
- Immediate UI feedback
- Consistent state on errors
- Safe concurrent operations

**Negative:**
- Complexity in cart store
- Requires feature flag management

## Testing Notes

- Test optimistic update visibility
- Test rollback on 409/422
- Test rapid consecutive updates (out-of-order responses)
- Test no rollback on transient errors
