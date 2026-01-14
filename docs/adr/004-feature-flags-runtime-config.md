# ADR 004: Feature Flags - runtimeConfig vs build-time env

**Status:** Accepted  
**Date:** 2026-01-14  
**Context:** Need runtime-configurable feature flags for rollout control without rebuilds

## Decision

**Policy:** Feature flags that control functionality rollout must be **runtime configurable** via `runtimeConfig.public.features.*`.

**Implementation:**
- Use `runtimeConfig.public.features.*` as source of truth
- `app.config.ts` may include metadata (descriptions, UI labels) but not primary switch
- Flags read from runtimeConfig, not `process.env` directly in client code
- Ensure SSR/CSR consistency (same values on server and client)

## Implementation

**Entry Points:**
- `nuxt.config.ts` - Lines 15-17 (feature flags definition)
- `app/stores/cart.store.ts` - Line 271 (flag usage: `isOptimisticEnabled()`)

**Current Flags:**
- `cartOptimisticUI`: Controls optimistic cart updates

**Future Flags:**
- `serverFilters`: Server-side filter rendering
- `newSeo`: New SEO implementation

## Alternatives Considered

1. **Build-time env vars** - Rejected (requires rebuild for toggle)
2. **app.config.ts only** - Rejected (not runtime-configurable)
3. **Hybrid approach** - Accepted (runtimeConfig + metadata in app.config)

## Consequences

**Positive:**
- Runtime toggle without rebuild
- SSR/CSR consistency
- Easy rollout control

**Negative:**
- Requires deployment platform support for env vars
- Must document flag usage

## Testing Notes

- Test flag toggle without rebuild
- Test SSR/CSR consistency
- Test flag default values
