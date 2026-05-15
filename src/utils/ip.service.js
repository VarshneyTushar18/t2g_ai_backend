export const getClientIp = (req) => {
  try {
    const forwarded = req.headers["x-forwarded-for"];

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    return (
      req.headers["cf-connecting-ip"] ||
      req.headers["x-real-ip"] ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      req.ip ||
      null
    );
  } catch (err) {
    console.error("IP extraction error:", err);
    return null;
  }
};

export const normalizeIp = (ip) => {
  if (!ip) return null;

  try {
    ip = ip.trim();

    if (ip === "::1") {
      return "127.0.0.1";
    }

    if (ip.startsWith("::ffff:")) {
      return ip.replace("::ffff:", "");
    }

    return ip;
  } catch (err) {
    console.error("IP normalize error:", err);
    return ip;
  }
};