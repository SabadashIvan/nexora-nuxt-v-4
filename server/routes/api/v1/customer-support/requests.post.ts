/**
 * Proxy for customer support request submission
 * Routes: POST /api/v1/customer-support/requests
 * Adds IP address and user agent from request headers
 */
export default defineEventHandler(async (event): Promise<unknown> => {
  const config = useRuntimeConfig()
  const backendUrl = config.apiBackendUrl || 'http://localhost:8000'
  const body = await readBody(event)

  // Extract IP address from request headers
  // Check X-Forwarded-For first (for proxies/load balancers), then X-Real-IP, then direct connection
  const forwardedFor = getHeader(event, 'x-forwarded-for')
  const realIp = getHeader(event, 'x-real-ip')
  let ipAddress = forwardedFor 
    ? forwardedFor.split(',')[0].trim() 
    : realIp || '127.0.0.1'
  
  // Fallback to socket remote address if headers don't have IP
  if (ipAddress === '127.0.0.1' && event.node?.req?.socket?.remoteAddress) {
    ipAddress = event.node.req.socket.remoteAddress
  }

  // Get user agent from headers
  const userAgent = getHeader(event, 'user-agent') || ''

  // Get referer from headers
  const referer = getHeader(event, 'referer') || ''

  // Merge with body data, ensuring required fields are present
  const payload = {
    ...body,
    ip_address: body.ip_address || ipAddress,
    user_agent: body.user_agent || userAgent,
    source: body.source || 'contact_page',
    referer: body.referer || referer,
  }

  // Forward cookies from client to backend
  const cookies = getHeader(event, 'cookie') || ''

  try {
    const response = await $fetch.raw<unknown>(`${backendUrl}/api/v1/customer-support/requests`, {
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
      statusText: err.statusMessage || 'Support request failed',
      data: err.data,
    })
  }
})

