/**
 * Resolve client IP address from request, handling proxy headers
 * Checks in order: X-Forwarded-For (first hop), X-Real-IP, CF-Connecting-IP, socket.remoteAddress
 * 
 * @param {Object} req - Express request object
 * @returns {string} Client IP address (IPv4 or IPv6)
 */
export const getClientIp = (req) => {
  // X-Forwarded-For: can contain multiple IPs, use the first (original client)
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map((ip) => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }

  // X-Real-IP: commonly used by nginx
  const xRealIp = req.headers["x-real-ip"];
  if (xRealIp) {
    return xRealIp.trim();
  }

  // CF-Connecting-IP: Cloudflare specific
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback to socket remote address
  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress;
  }

  // Final fallback to req.ip
  return req.ip || "Unknown";
};

/**
 * Normalize and format IP for storage/display
 * Handles IPv6 loopback (::1) and IPv4 loopback (127.0.0.1)
 * 
 * @param {string} ip - IP address
 * @returns {string} Normalized IP address
 */
export const normalizeIp = (ip) => {
  if (!ip) return "Unknown";

  // Remove port if present (e.g., "::ffff:127.0.0.1:5000" -> "::ffff:127.0.0.1")
  const normalized = ip.split(":").slice(0, -1).join(":") || ip;

  return normalized;
};
