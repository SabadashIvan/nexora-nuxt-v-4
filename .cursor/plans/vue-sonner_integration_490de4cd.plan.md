---
name: vue-sonner integration
overview: Integrate vue-sonner toast notification library into the Nuxt 4 project, replacing inline success/error messages with a centralized toast system.
todos:
  - id: install-package
    content: "Install vue-sonner package: Add to package.json and run npm install"
    status: completed
  - id: configure-module
    content: "Configure Nuxt module: Add vue-sonner/nuxt to modules array in nuxt.config.ts with css: false"
    status: completed
  - id: add-toaster
    content: Add Toaster component to app/app.vue with Tailwind styling configuration
    status: completed
  - id: create-composable
    content: "Create useToast composable (optional): app/composables/useToast.ts with wrapper functions"
    status: pending
  - id: update-contact
    content: "Update contact.vue: Replace inline success/error messages with toast calls"
    status: completed
  - id: update-quickbuy
    content: "Update QuickBuyModal.vue: Replace inline messages with toast calls"
    status: pending
  - id: update-comments
    content: "Update ProductComments.vue and BlogComments.vue: Replace inline messages with toast calls"
    status: pending
isProject: false
---

# Vue Sonner Toast Integration Plan

## Overview

Integrate `vue-sonner` toast notification library to provide a centralized, consistent way to display success, error, and info messages throughout the application. This will replace the current inline message displays in various components.

## Implementation Steps

### 1. Install vue-sonner Package

- Add `vue-sonner` to dependencies in `package.json`
- Run `npm install` to install the package

### 2. Configure Nuxt Module

- Add `vue-sonner/nuxt` to the `modules` array in `nuxt.config.ts`
- Configure `vueSonner` options:
  - Set `css: false` (since we'll use Tailwind styling with `unstyled` option)
  - This enables the `$toast` function globally via `useNuxtApp()`

### 3. Add Toaster Component

- Add `<Toaster />` component to `app/app.vue` (root component)
- Configure with:
  - `position="top-right"` (default, can be customized)
  - `unstyled: true` for Tailwind CSS styling
  - `richColors` for better error/success colors
  - `closeButton` for manual dismissal
  - Custom classes for Tailwind styling

### 4. Create Toast Composable (Optional but Recommended)

- Create `app/composables/useToast.ts` for easier access to toast functions
- Export wrapper functions: `toastSuccess()`, `toastError()`, `toastInfo()`, `toast()`
- Integrate with i18n for translated messages
- Provide consistent styling and behavior

### 5. Integration Points

The following components currently use inline messages and can be updated to use toasts:

**High Priority:**

- `app/pages/contact.vue` - Success/error messages after form submission
- `app/components/product/QuickBuyModal.vue` - Success/error messages
- `app/components/product/ProductComments.vue` - Success/error messages
- `app/components/blog/BlogComments.vue` - Success/error messages
- `app/components/product/ProductReviews.vue` - Success/error messages

**Medium Priority:**

- `app/pages/auth/*.vue` - Login/register/forgot password messages
- `app/components/audience/NewsletterForm.vue` - Subscription messages
- `app/pages/audience/confirm.vue` and `unsubscribe.vue` - Confirmation messages

**Future Enhancement:**

- Integrate with `useApi` composable to automatically show error toasts on API failures
- Add success toasts for successful API operations (cart add, favorites, etc.)

## Files to Modify

1. **package.json** - Add `vue-sonner` dependency
2. **nuxt.config.ts** - Add module and configuration
3. **app/app.vue** - Add `<Toaster />` component
4. **app/composables/useToast.ts** - Create new composable (optional)
5. **Components with inline messages** - Replace inline messages with toast calls

## Configuration Details

### Nuxt Config

```typescript
modules: [
  // ... existing modules
  'vue-sonner/nuxt'
],
vueSonner: {
  css: false // Use Tailwind instead
}
```

### Toaster Component Setup

```vue
<Toaster
  position="top-right"
  :toastOptions="{
    unstyled: true,
    classes: {
      toast: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg',
      title: 'text-gray-900 dark:text-gray-100 font-medium',
      description: 'text-gray-600 dark:text-gray-400 text-sm',
      error: 'border-red-200 dark:border-red-800',
      success: 'border-green-200 dark:border-green-800',
      actionButton: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      closeButton: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
    }
  }"
  richColors
  closeButton
/>
```

## Benefits

- Centralized notification system
- Consistent UI/UX across the application
- Better mobile experience with swipe-to-dismiss
- Automatic positioning and stacking
- Easy to use throughout the codebase
- Supports promises for async operations
- Accessible keyboard navigation

## Testing Considerations

- Test toast appearance in light/dark mode
- Verify toast positioning on mobile devices
- Test toast dismissal (auto-close, manual close, swipe)
- Verify i18n translations work with toast messages
- Test toast stacking when multiple toasts appear

## Notes

- The existing notifications store (`app/stores/notifications.store.ts`) is for backend notifications (bell icon), not toast notifications. These are separate systems.
- Toast notifications are for immediate user feedback (success/error messages)
- Backend notifications are for persistent notifications (order updates, etc.)