/**
 * Domain Enums
 * 
 * Centralized enums for critical domain values.
 * Use enums instead of union types for:
 * - Better autocomplete
 * - Type safety
 * - Backend compatibility
 * - Explicit domain values
 */

/**
 * Order status values
 */
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * Payment status values
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Checkout step/status values
 */
export enum CheckoutStatus {
  IDLE = 'idle',
  ADDRESS = 'address',
  SHIPPING = 'shipping',
  PAYMENT = 'payment',
  CONFIRM = 'confirm',
  COMPLETED = 'completed',
}

/**
 * Support request types
 */
export enum SupportRequestType {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  BILLING = 'billing',
  OTHER = 'other',
}

/**
 * Payment provider types
 */
export enum PaymentProviderType {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

/**
 * Cart warning codes
 */
export enum CartWarningCode {
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PRICE_CHANGED = 'PRICE_CHANGED',
  ITEM_UNAVAILABLE = 'ITEM_UNAVAILABLE',
}

/**
 * Cart promotion types
 */
export enum CartPromotionType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

/**
 * Identity address types
 */
export enum IdentityAddressType {
  SHIPPING = 'shipping',
  BILLING = 'billing',
}

/**
 * Notification channels
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

/**
 * Loading/Async states
 */
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum AsyncStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Email verification status
 */
export enum EmailVerificationStatus {
  IDLE = 'idle',
  SENT = 'sent',
  VERIFIED = 'verified',
  ERROR = 'error',
}

/**
 * Password reset status
 */
export enum PasswordResetStatus {
  IDLE = 'idle',
  SENT = 'sent',
  RESET = 'reset',
  ERROR = 'error',
}

/**
 * Audience subscription status
 */
export enum AudienceSubscriptionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  UNSUBSCRIBED = 'unsubscribed',
  ERROR = 'error',
}

/**
 * Catalog sort options
 */
export enum CatalogSort {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

/**
 * Blog sort options
 */
export enum BlogSort {
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

/**
 * Filter types
 */
export enum FilterType {
  CHECKBOX = 'checkbox',
  RANGE = 'range',
  SELECT = 'select',
}

/**
 * Link target values
 */
export enum LinkTarget {
  SELF = '_self',
  BLANK = '_blank',
}

