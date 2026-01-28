/**
 * Proxy for leads submission (quick buy/callback requests)
 * Routes: POST /api/v1/leads
 * Adds IP address and user agent from request headers
 */
export default defineEventHandler(async (event): Promise<unknown> => {
  // Log that server route is being hit
  console.log('[Leads Server Route] Request received')
  
  const config = useRuntimeConfig()
  const backendUrl = config.apiBackendUrl || 'http://localhost:8000'
  const body = await readBody(event)
  
  console.log('[Leads Server Route] Body received:', JSON.stringify(body, null, 2))

  // Extract IP address from request headers
  // Prefer X-Forwarded-For, then X-Real-IP, then socket remote address
  // Always fallback to '127.0.0.1' if extraction fails
  const nodeEvent = event as { node?: { req?: { socket?: { remoteAddress?: string } } } }
  
  let ipAddress: string = '127.0.0.1' // Default fallback
  
  // Try X-Forwarded-For header first
  const forwardedFor = getHeader(event, 'x-forwarded-for')
  if (forwardedFor && typeof forwardedFor === 'string') {
    const trimmed = forwardedFor.trim()
    if (trimmed) {
      // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2)
      // Extract the first (original client) IP
      if (trimmed.includes(',')) {
        const firstIp = trimmed.split(',')[0]?.trim()
        if (firstIp) {
          ipAddress = firstIp
        }
      } else {
        ipAddress = trimmed
      }
    }
  }
  
  // Try X-Real-IP header if X-Forwarded-For didn't work
  if (ipAddress === '127.0.0.1') {
    const realIp = getHeader(event, 'x-real-ip')
    if (realIp && typeof realIp === 'string') {
      const trimmed = realIp.trim()
      if (trimmed) {
        ipAddress = trimmed
      }
    }
  }
  
  // Try socket remote address if headers didn't work
  if (ipAddress === '127.0.0.1' && nodeEvent?.node?.req?.socket?.remoteAddress) {
    const socketIp = nodeEvent.node.req.socket.remoteAddress
    if (socketIp && socketIp.trim()) {
      ipAddress = socketIp.trim()
    }
  }
  
  // Final validation - ensure we always have a valid non-empty string
  // If somehow we still don't have a valid IP, use '127.0.0.1'
  const finalIpAddress: string = (ipAddress && ipAddress.trim() !== '') ? ipAddress.trim() : '127.0.0.1'

  // Get user agent from headers
  const userAgent = getHeader(event, 'user-agent') || ''

  // Merge with body data, ensuring required fields are present
  // Always override ip_address with server-extracted value (never use client-provided value)
  const payload = {
    ...body,
    // TODO: Replace hardcoded '127.0.0.1' with finalIpAddress after testing server route functionality
    // The IP extraction logic above should be used once we confirm the server route is working correctly
    ip_address: '127.0.0.1', // HARDCODED FOR TESTING - replace with: finalIpAddress
    user_agent: body.user_agent || userAgent,
  }
  
  // Debug logging in development
  if (import.meta.dev) {
    console.log('[Leads API] IP extraction:', {
      'x-forwarded-for': getHeader(event, 'x-forwarded-for'),
      'x-real-ip': getHeader(event, 'x-real-ip'),
      socketRemoteAddress: nodeEvent?.node?.req?.socket?.remoteAddress,
      extractedIp: finalIpAddress,
      payloadIp: payload.ip_address,
      note: 'HARDCODED to 127.0.0.1 for testing',
    })
  }

  // Forward cookies from client to backend
  const cookies = getHeader(event, 'cookie') || ''

  try {
    const response = await $fetch.raw<unknown>(`${backendUrl}/api/v1/leads`, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookies,
        'X-XSRF-TOKEN': getCookie(event, 'XSRF-TOKEN') || '',
      },
    })

    // Forward Set-Cookie headers from backend to client
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      for (const cookie of setCookieHeaders) {
        appendResponseHeader(event, 'Set-Cookie', cookie)
      }
    }

    setResponseStatus(event, response.status)
    return response._data || {}
  } catch (error: unknown) {
    const err = error as { status?: number; data?: unknown; statusMessage?: string }
    throw createError({
      status: err.status || 500,
      statusText: err.statusMessage || 'Lead submission failed',
      data: err.data,
    })
  }
})
