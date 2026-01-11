# Translation Implementation Plan for Static Elements

## Overview
This plan outlines the strategy for implementing translations for all static UI elements in the Nexora Nuxt 4 e-commerce application. The project uses `@nuxtjs/i18n` with locales: `ru` (default), `en`, `uk`, and `awa`.

## Current State
- **i18n Module**: `@nuxtjs/i18n` is configured
- **Current Translations**: Minimal (`i18n.config.ts` only has "welcome" example)
- **Hardcoded Strings**: Found throughout components, pages, and UI elements
- **Locale Strategy**: `prefix_except_default` (ru is default, others have prefix)

## Implementation Strategy

### Phase 1: Translation File Structure

#### 1.1 Create Locale Files Directory
Create organized translation files in `app/locales/`:

```
app/locales/
├── ru.json
├── en.json
├── uk.json
└── awa.json
```

#### 1.2 Organize Translations by Feature
Structure translations using nested keys organized by feature/component:

```json
{
  "common": {
    "buttons": {},
    "labels": {},
    "messages": {},
    "errors": {}
  },
  "navigation": {},
  "cart": {},
  "checkout": {},
  "product": {},
  "auth": {},
  "profile": {},
  "contact": {},
  "comparison": {},
  "favorites": {},
  "blog": {},
  "catalog": {},
  "search": {},
  "forms": {},
  "validation": {},
  "emptyStates": {},
  "breadcrumbs": {}
}
```

### Phase 2: Update i18n Configuration

#### 2.1 Modify `app/i18n.config.ts`
Change from inline messages to file-based translations:

```typescript
export default {
  legacy: false,
  locale: 'ru',
  // Messages will be loaded from app/locales/*.json
  // Configured in nuxt.config.ts
}
```

#### 2.2 Update `nuxt.config.ts`
Add `langDir` and `lazy` configuration:

```typescript
i18n: {
  strategy: 'prefix_except_default',
  defaultLocale: 'ru',
  locales: [
    { code: 'ru', name: 'Русский', file: 'ru.json' },
    { code: 'en', name: 'English', file: 'en.json' },
    { code: 'uk', name: 'Українська', file: 'uk.json' },
    { code: 'awa', name: 'Авадхи', file: 'awa.json' },
  ],
  detectBrowserLanguage: false,
  langDir: 'locales',
  lazy: true,
  vueI18n: './app/i18n.config.ts',
}
```

### Phase 3: Identify and Catalog Static Strings

#### 3.1 Categories of Static Elements

**Navigation & Header:**
- "Search", "Search products...", "Searching...", "No results found"
- "Register", "Login", "Logout", "Logging out...", "Profile"
- "favorites, view wishlist", "comparison, view comparison", "items in cart, view bag"
- "Close search", "Quick search"

**Breadcrumbs:**
- "Home"

**Cart:**
- "Order Summary", "Promo Code", "Enter code", "Apply"
- "Subtotal", "Shipping", "Discounts", "Total"
- "Proceed to Checkout", "Remove", "Invalid coupon code"
- "Add to Cart", "In Stock", "Out of Stock", "Unavailable"

**Checkout:**
- Form labels, placeholders, validation messages
- Step names, button labels

**Product:**
- "Add to Cart", "Add to Favorites", "Remove from Favorites"
- "In Stock", "Out of Stock", "Availability", "Rating", "Action"
- Review/comment form labels

**Comparison:**
- "Compare Products", "Clear All"
- "No products to compare", "Add products to compare their features side by side"
- "Browse Products", "Product", "Availability", "Rating", "Action"
- "Add to Cart", "Unavailable"

**Favorites:**
- Empty state messages, action buttons

**Contact:**
- "Contact Us", "Have a question or need help? We're here to assist you."
- Form labels: "Full Name", "Email Address", "Phone Number", "Request Type", "Subject", "Message"
- Placeholders, validation messages
- "General Inquiry", "Technical Support", "Billing Question", "Other"
- "Submit Request", "Submitting...", "Too many support request attempts"
- "Please try again in", "second", "seconds"
- "We typically respond within 24 hours..."

**Auth Pages:**
- Login, Register, Forgot Password, Reset Password forms
- All labels, placeholders, validation messages, error messages

**Profile:**
- Page titles, section headers, form labels
- Order history labels, address management labels

**Blog:**
- Comment form labels, "Leave a comment", etc.

**Catalog:**
- "Filter", "Sort", "No items found"
- Filter labels, sort options

**Search:**
- Placeholders, empty states, result labels

**UI Components:**
- `EmptyState`: "No items found" (default)
- `Breadcrumbs`: "Home"
- `Pagination`: "Previous", "Next", "Page", "of"
- `Spinner`: Loading states
- `Badge`: Status labels

**Forms & Validation:**
- "Required", "Optional", "Please enter a valid email address"
- "Message must be at least 10 characters", "Minimum 10 characters required"
- Field-specific validation messages

**Error Messages:**
- "Page Not Found", "No content available for this page"
- Generic error messages, network errors

**Newsletter:**
- "I agree to receive newsletter emails", "Subscribe", "Subscribing..."

**Home Page:**
- Feature descriptions, section titles
- "We built our business on great customer service" (and description)

### Phase 4: Create Translation Keys

#### 4.1 Naming Convention
Use dot notation with feature prefix:
- `common.buttons.addToCart`
- `cart.summary.subtotal`
- `forms.validation.emailRequired`
- `navigation.search.placeholder`

#### 4.2 Key Structure Examples

```json
{
  "common": {
    "buttons": {
      "addToCart": "Add to Cart",
      "remove": "Remove",
      "submit": "Submit",
      "cancel": "Cancel",
      "apply": "Apply",
      "clearAll": "Clear All",
      "browseProducts": "Browse Products",
      "proceedToCheckout": "Proceed to Checkout"
    },
    "labels": {
      "home": "Home",
      "search": "Search",
      "loading": "Loading...",
      "noResults": "No results found",
      "optional": "optional",
      "required": "required"
    },
    "status": {
      "inStock": "In Stock",
      "outOfStock": "Out of Stock",
      "unavailable": "Unavailable"
    }
  },
  "navigation": {
    "register": "Register",
    "login": "Login",
    "logout": "Logout",
    "loggingOut": "Logging out...",
    "profile": "Profile",
    "favorites": "Favorites",
    "comparison": "Comparison",
    "cart": "Cart",
    "itemsInCart": "items in cart, view bag",
    "viewWishlist": "favorites, view wishlist",
    "viewComparison": "comparison, view comparison",
    "closeSearch": "Close search",
    "quickSearch": "Quick search"
  },
  "search": {
    "placeholder": "Search products...",
    "searching": "Searching...",
    "noResults": "No results found"
  },
  "cart": {
    "summary": {
      "title": "Order Summary",
      "promoCode": "Promo Code",
      "enterCode": "Enter code",
      "apply": "Apply",
      "subtotal": "Subtotal",
      "shipping": "Shipping",
      "discounts": "Discounts",
      "total": "Total",
      "invalidCoupon": "Invalid coupon code"
    }
  },
  "comparison": {
    "title": "Compare Products",
    "clearAll": "Clear All",
    "empty": {
      "title": "No products to compare",
      "description": "Add products to compare their features side by side."
    },
    "table": {
      "product": "Product",
      "availability": "Availability",
      "rating": "Rating",
      "action": "Action"
    }
  },
  "contact": {
    "title": "Contact Us",
    "description": "Have a question or need help? We're here to assist you.",
    "form": {
      "fullName": "Full Name",
      "email": "Email Address",
      "phone": "Phone Number",
      "requestType": "Request Type",
      "subject": "Subject",
      "message": "Message",
      "placeholders": {
        "name": "John Doe",
        "email": "you@example.com",
        "phone": "+380501234567",
        "subject": "What is your question about?",
        "message": "Please provide details about your question or issue..."
      },
      "types": {
        "general": "General Inquiry",
        "technical": "Technical Support",
        "billing": "Billing Question",
        "other": "Other"
      },
      "submit": "Submit Request",
      "submitting": "Submitting...",
      "responseTime": "We typically respond within 24 hours. For urgent matters, please call our support line."
    },
    "errors": {
      "rateLimit": "Too many support request attempts",
      "tryAgain": "Please try again in",
      "second": "second",
      "seconds": "seconds"
    }
  },
  "forms": {
    "validation": {
      "emailRequired": "Please enter a valid email address",
      "messageMinLength": "Message must be at least 10 characters",
      "messageMinLengthHint": "Minimum 10 characters required"
    }
  },
  "emptyStates": {
    "noItems": "No items found",
    "noContent": "No content available for this page"
  },
  "errors": {
    "pageNotFound": "Page Not Found",
    "generic": "An error occurred. Please try again."
  },
  "newsletter": {
    "consent": "I agree to receive newsletter emails",
    "subscribe": "Subscribe",
    "subscribing": "Subscribing..."
  }
}
```

### Phase 5: Implementation Steps

#### 5.1 Create Base Translation Files
1. Create `app/locales/` directory
2. Create `ru.json`, `en.json`, `uk.json`, `awa.json` with base structure
3. Start with Russian (default locale) - complete all keys
4. Translate to other locales (or leave as placeholders initially)

#### 5.2 Update Components Systematically

**Priority Order:**
1. **Common UI Components** (`app/components/ui/`)
   - `Breadcrumbs.vue` - "Home"
   - `EmptyState.vue` - default title
   - `Pagination.vue` - navigation labels
   - `Badge.vue` - status labels (if any)

2. **Layout Components** (`app/components/layout/`)
   - `AppHeader.vue` - navigation, search
   - `MobileMenu.vue` - menu items
   - `AppFooter.vue` - footer text (if any)

3. **Feature Components**
   - `CartSummary.vue` - cart labels
   - `CartItem.vue` - item actions
   - Comparison page components
   - Product components (buttons, labels)

4. **Pages** (`app/pages/`)
   - `contact.vue` - complete form
   - `comparison.vue` - all labels
   - `cart.vue` - cart page
   - `checkout.vue` - checkout flow
   - `favorites.vue` - favorites page
   - Auth pages (`login.vue`, `register.vue`, etc.)
   - Profile pages
   - `index.vue` - home page static text

5. **Forms & Validation**
   - All form components
   - Validation messages
   - Error messages

#### 5.3 Replace Hardcoded Strings

**Pattern to Follow:**
```vue
<!-- Before -->
<button>Add to Cart</button>
<span>No results found</span>

<!-- After -->
<button>{{ $t('common.buttons.addToCart') }}</button>
<span>{{ $t('search.noResults') }}</span>
```

**In Script Setup:**
```typescript
const { t } = useI18n()
const buttonText = computed(() => t('common.buttons.addToCart'))
```

**For Dynamic Content:**
```vue
<!-- With parameters -->
<span>{{ $t('contact.errors.tryAgain', { count: retryCountdown }) }}</span>

<!-- In translation file -->
{
  "contact": {
    "errors": {
      "tryAgain": "Please try again in {count} {count, plural, one {second} other {seconds}}"
    }
  }
}
```

#### 5.4 Handle Pluralization
Use i18n pluralization for:
- "second" vs "seconds"
- "item" vs "items"
- Any other countable nouns

### Phase 6: Testing Strategy

#### 6.1 Manual Testing Checklist
- [ ] Switch between all locales (ru, en, uk, awa)
- [ ] Verify all static text is translated
- [ ] Check form validation messages
- [ ] Test error messages
- [ ] Verify empty states
- [ ] Check navigation labels
- [ ] Test search functionality
- [ ] Verify cart/checkout flow
- [ ] Check product pages
- [ ] Test comparison page
- [ ] Verify contact form
- [ ] Check auth pages
- [ ] Test profile pages

#### 6.2 Automated Testing
- Create tests that verify translation keys exist
- Test locale switching
- Verify no hardcoded strings remain (regex check)

### Phase 7: Maintenance & Best Practices

#### 7.1 Guidelines
- **Never hardcode strings** - always use `$t()` or `t()`
- **Use descriptive keys** - `cart.summary.subtotal` not `cart.subtotal`
- **Group related translations** - keep feature translations together
- **Document new keys** - when adding features, add translations immediately
- **Keep keys consistent** - use same key for same concept across app

#### 7.2 Adding New Translations
1. Add key to all locale files (ru, en, uk, awa)
2. Use Russian as source of truth (default locale)
3. Translate to other locales
4. Update component to use new key
5. Test in all locales

#### 7.3 Missing Translations
- Use fallback locale (ru) if translation missing
- Log missing keys in development
- Create issue/task for missing translations

## Implementation Checklist

### Setup
- [ ] Create `app/locales/` directory
- [ ] Create base translation files (ru.json, en.json, uk.json, awa.json)
- [ ] Update `nuxt.config.ts` i18n configuration
- [ ] Update `app/i18n.config.ts`

### Translation Files
- [ ] Create `common` section (buttons, labels, status, errors)
- [ ] Create `navigation` section
- [ ] Create `search` section
- [ ] Create `cart` section
- [ ] Create `checkout` section
- [ ] Create `product` section
- [ ] Create `comparison` section
- [ ] Create `favorites` section
- [ ] Create `contact` section
- [ ] Create `auth` section
- [ ] Create `profile` section
- [ ] Create `blog` section
- [ ] Create `catalog` section
- [ ] Create `forms` section
- [ ] Create `validation` section
- [ ] Create `emptyStates` section
- [ ] Create `breadcrumbs` section
- [ ] Create `errors` section
- [ ] Create `newsletter` section

### Components (Priority Order)
- [ ] `app/components/ui/Breadcrumbs.vue`
- [ ] `app/components/ui/EmptyState.vue`
- [ ] `app/components/ui/Pagination.vue`
- [ ] `app/components/layout/AppHeader.vue`
- [ ] `app/components/layout/MobileMenu.vue`
- [ ] `app/components/cart/CartSummary.vue`
- [ ] `app/components/cart/CartItem.vue`
- [ ] `app/components/product/*` (all product components)
- [ ] `app/components/checkout/*` (all checkout components)
- [ ] `app/components/audience/NewsletterForm.vue`

### Pages
- [ ] `app/pages/index.vue`
- [ ] `app/pages/contact.vue`
- [ ] `app/pages/comparison.vue`
- [ ] `app/pages/cart.vue`
- [ ] `app/pages/checkout.vue`
- [ ] `app/pages/favorites.vue`
- [ ] `app/pages/auth/*` (all auth pages)
- [ ] `app/pages/profile/*` (all profile pages)
- [ ] `app/pages/pages/[slug].vue`
- [ ] `app/pages/blog/*` (all blog pages)

### Testing
- [ ] Test locale switching
- [ ] Verify all strings are translated
- [ ] Test form validation messages
- [ ] Test error messages
- [ ] Test pluralization
- [ ] Test in all locales (ru, en, uk, awa)

## Notes

1. **SSR Compatibility**: All translations work in SSR context - `useI18n()` is SSR-safe
2. **Performance**: Lazy loading translations reduces initial bundle size
3. **Type Safety**: Consider adding TypeScript types for translation keys (future enhancement)
4. **Missing Translations**: Will fallback to default locale (ru) if key missing
5. **Pluralization**: Use i18n pluralization rules for proper grammar

## Estimated Effort

- **Setup**: 2-4 hours
- **Translation File Creation**: 8-12 hours
- **Component Updates**: 16-24 hours
- **Testing**: 4-8 hours
- **Total**: 30-48 hours

## Next Steps

1. Review and approve this plan
2. Create translation file structure
3. Begin with common translations
4. Systematically update components
5. Test thoroughly
6. Deploy and monitor
