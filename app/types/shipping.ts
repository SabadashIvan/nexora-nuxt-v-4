/**
 * Shipping domain types
 * API: /api/v1/shipping/*
 */

/**
 * Settlement/City from shipping provider search
 */
export interface Settlement {
  /** External ID from shipping provider */
  external_id: string
  /** Settlement/city name */
  name: string
  /** Region/state name */
  region?: string
  /** Postal/ZIP code */
  postal_index?: string
}

/**
 * Warehouse/pickup point from shipping provider
 */
export interface Warehouse {
  /** External ID from shipping provider */
  external_id: string
  /** Warehouse name */
  name: string
  /** Full address */
  address: string
  /** Working hours schedule */
  schedule?: string
  /** Whether cash on delivery is supported */
  supports_payment?: boolean
  /** Maximum parcel weight in kg */
  max_weight_kg?: number
}

/**
 * Response from settlements search
 */
export interface SettlementsSearchResponse {
  data: Settlement[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

/**
 * Response from warehouses search
 */
export interface WarehousesSearchResponse {
  data: Warehouse[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

/**
 * Parameters for settlement search
 */
export interface SettlementSearchParams {
  /** Shipping provider code (e.g., 'nova_post') */
  provider_code: string
  /** City/settlement name to search */
  city_name: string
  /** Results limit */
  limit?: number
  /** Page number */
  page?: number
}

/**
 * Parameters for warehouse search
 */
export interface WarehouseSearchParams {
  /** Shipping provider code */
  provider_code: string
  /** Shipping method code */
  method_code: string
  /** Settlement external ID from provider */
  city_external_id: string
  /** Current checkout session ID */
  checkout_session_id: string
  /** Search query within warehouses */
  search?: string
  /** Results limit */
  limit?: number
  /** Page number */
  page?: number
}
