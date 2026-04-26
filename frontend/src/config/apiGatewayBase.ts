/**
 * Base URL cho REST qua gateway.
 * - Production / VPS: set `VITE_API_GATEWAY_URL` khi build (vd. https://domain).
 * - Docker + mở UI qua port publish (5173): để trống hoặc để logic bên dưới bỏ `http://localhost`
 *   (port 80) khi trang đang chạy trên cổng khác — tránh gọi nhầm host:80 (IIS / không có nginx).
 */
export function getApiGatewayBaseUrl(): string {
  const raw = import.meta.env.VITE_API_GATEWAY_URL
  if (typeof raw !== 'string' || raw.trim() === '') return ''
  const t = raw.trim()

  if (typeof window === 'undefined') return t

  try {
    const u = new URL(t)
    const localHost = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
    const apiPort = u.port === '' ? (u.protocol === 'https:' ? '443' : '80') : u.port
    const pagePort =
      window.location.port === ''
        ? window.location.protocol === 'https:'
          ? '443'
          : '80'
        : window.location.port

    if (localHost && apiPort === '80' && pagePort !== '80' && pagePort !== '443') {
      return ''
    }
  } catch {
    return ''
  }

  return t
}
