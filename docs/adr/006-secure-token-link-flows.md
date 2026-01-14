# ADR 006: Secure Token/Link Flows (Signed URLs; URL Token Stripping; Logging Policy)

**Status:** Proposed  
**Date:** 2026-01-14  
**Context:** Handle signed links (email verification, password reset, audience unsubscribe) securely without token leakage

## Decision

**Policy:** Treat token processing as **client-first** unless SSR is required.

**Implementation:**
1. **Token removal**: Immediately remove token from URL after processing
   - Use `navigateTo(cleanUrl, { replace: true })` or `history.replaceState`
2. **No persistence**: Do not store tokens in Pinia or localStorage
3. **Logging policy**: Ensure analytics and error logs do not capture raw tokens
4. **Local scope**: Keep tokens in local scope and discard after use

## Implementation

**Entry Points:**
- `app/pages/auth/email-verification.vue` - Email verification flow
- `app/pages/auth/reset-password.vue` - Password reset flow
- `app/pages/audience/unsubscribe.vue` - Unsubscribe flow (to be created)

**Key Rules:**
- Extract token from query params
- Process token immediately
- Navigate to clean URL (replace history)
- Never log token in error messages or analytics

## Alternatives Considered

1. **Store tokens in state** - Rejected (security risk)
2. **Keep tokens in URL** - Rejected (leakage risk via referrers/logs)
3. **SSR token processing** - Rejected (not needed for most flows)

## Consequences

**Positive:**
- No token leakage
- Secure link handling
- Clean URLs after processing

**Negative:**
- Requires careful implementation
- Must audit all token flows

## Testing Notes

- Test token removal from URL after processing
- Test no token in state/storage
- Test no token in analytics payloads
- Test error handling without token exposure
