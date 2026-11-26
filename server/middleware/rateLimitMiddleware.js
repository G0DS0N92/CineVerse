// In-memory sliding window IP rate limiter for public endpoints
const createRateLimiter = ({
  windowMs = 60 * 1000,
  maxRequests = 60,
  message = 'Too many requests, please try again later.',
} = {}) => {
  const requests = new Map();

  // Periodic cleanup every 5 minutes to prevent memory leaks
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return (req, res, next) => {
    const ip =
      req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    const record = requests.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    requests.set(ip, record);

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};

module.exports = { createRateLimiter };
