/**
 * Orders Store
 * Handles user order history and order details
 * CSR-only - requires authentication
 */

import { defineStore } from 'pinia'
import type { Order, OrdersState, OrderStatusOption, PaginatedResponse, Pagination } from '~/types'
import { getErrorMessage } from '~/utils/errors'

interface OrdersStoreState extends OrdersState {
  pagination: Pagination
  /** Available order statuses for filtering */
  statuses: OrderStatusOption[]
  /** Currently selected status IDs for filtering */
  selectedStatuses: number[]
  /** Loading state for statuses */
  statusesLoading: boolean
}

export const useOrdersStore = defineStore('orders', {
  state: (): OrdersStoreState => ({
    orders: [],
    order: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      perPage: 10,
      total: 0,
      lastPage: 1,
    },
    statuses: [],
    selectedStatuses: [],
    statusesLoading: false,
  }),

  getters: {
    /**
     * Check if there are orders
     */
    hasOrders: (state): boolean => {
      return state.orders.length > 0
    },

    /**
     * Get orders count
     */
    ordersCount: (state): number => {
      return state.pagination.total
    },
  },

  actions: {
    /**
     * Fetch available order statuses for filtering
     */
    async fetchOrderStatuses(): Promise<void> {
      const api = useApi()
      this.statusesLoading = true

      try {
        const response = await api.get<OrderStatusOption[] | { data: OrderStatusOption[] }>('/orders/statuses')
        // Handle both wrapped and unwrapped response
        this.statuses = Array.isArray(response) ? response : (response?.data ?? [])
      } catch (error) {
        console.error('Fetch order statuses error:', error)
        this.statuses = []
      } finally {
        this.statusesLoading = false
      }
    },

    /**
     * Set selected status filters
     */
    setSelectedStatuses(statusIds: number[]): void {
      this.selectedStatuses = statusIds
    },

    /**
     * Toggle a status filter
     */
    toggleStatus(statusId: number): void {
      const index = this.selectedStatuses.indexOf(statusId)
      if (index === -1) {
        this.selectedStatuses.push(statusId)
      } else {
        this.selectedStatuses.splice(index, 1)
      }
    },

    /**
     * Clear all status filters
     */
    clearStatusFilters(): void {
      this.selectedStatuses = []
    },

    /**
     * Fetch user orders
     * @param page - Page number
     * @param statuses - Optional array of status IDs to filter by
     */
    async fetchOrders(page = 1, statuses?: number[]): Promise<void> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        // Build query params
        const query: Record<string, string | number | string[]> = {
          page,
          per_page: this.pagination.perPage,
        }

        // Add status filters if provided, otherwise use selected from state
        const statusFilter = statuses ?? this.selectedStatuses
        if (statusFilter.length > 0) {
          // API expects statuses[]=1&statuses[]=2 format
          query['statuses[]'] = statusFilter.map(String)
        }

        const response = await api.get<PaginatedResponse<Order>>('/orders', query)

        this.orders = response.data
        this.pagination = {
          page: response.meta.current_page,
          perPage: response.meta.per_page,
          total: response.meta.total,
          lastPage: response.meta.last_page,
        }
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch orders error:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch single order by ID
     */
    async fetchOrder(id: number): Promise<Order | null> {
      const api = useApi()
      this.loading = true
      this.error = null

      try {
        const order = await api.get<Order>(`/orders/${id}`)
        this.order = order
        return order
      } catch (error) {
        this.error = getErrorMessage(error)
        console.error('Fetch order error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Go to page (preserves current status filters)
     */
    async goToPage(page: number): Promise<void> {
      await this.fetchOrders(page, this.selectedStatuses)
    },

    /**
     * Clear current order
     */
    clearOrder(): void {
      this.order = null
    },

    /**
     * Reset store state
     */
    reset(): void {
      this.orders = []
      this.order = null
      this.loading = false
      this.error = null
      this.pagination = {
        page: 1,
        perPage: 10,
        total: 0,
        lastPage: 1,
      }
      this.statuses = []
      this.selectedStatuses = []
      this.statusesLoading = false
    },
  },
})

