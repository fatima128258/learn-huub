// Simple in-memory rate limiter for login attempts
// Tracks failed login attempts per email/IP

const loginAttempts = new Map();

const RATE_LIMIT = {
  MAX_ATTEMPTS: 3,        // Maximum failed attempts
  WINDOW_MS: 60000,       // Time window: 1 minute (60000ms)
  BLOCK_DURATION_MS: 60000 // Block duration: 1 minute
};

export function checkRateLimit(identifier) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);

  // No previous attempts
  if (!attempts) {
    return {
      allowed: true,
      remainingAttempts: RATE_LIMIT.MAX_ATTEMPTS,
      resetTime: null
    };
  }

  // Check if block period has expired
  if (attempts.blockedUntil && now < attempts.blockedUntil) {
    const remainingTime = Math.ceil((attempts.blockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: attempts.blockedUntil,
      remainingSeconds: remainingTime,
      message: `Too many failed attempts. Please try again in ${remainingTime} seconds.`
    };
  }

  // Block period expired, reset attempts
  if (attempts.blockedUntil && now >= attempts.blockedUntil) {
    loginAttempts.delete(identifier);
    return {
      allowed: true,
      remainingAttempts: RATE_LIMIT.MAX_ATTEMPTS,
      resetTime: null
    };
  }

  // Check if window has expired
  if (now - attempts.firstAttempt > RATE_LIMIT.WINDOW_MS) {
    loginAttempts.delete(identifier);
    return {
      allowed: true,
      remainingAttempts: RATE_LIMIT.MAX_ATTEMPTS,
      resetTime: null
    };
  }

  // Within window, check attempt count
  const remainingAttempts = RATE_LIMIT.MAX_ATTEMPTS - attempts.count;
  
  if (remainingAttempts <= 0) {
    // Block the user
    attempts.blockedUntil = now + RATE_LIMIT.BLOCK_DURATION_MS;
    const remainingTime = Math.ceil(RATE_LIMIT.BLOCK_DURATION_MS / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: attempts.blockedUntil,
      remainingSeconds: remainingTime,
      message: `Too many failed attempts. Please try again in ${remainingTime} seconds.`
    };
  }

  return {
    allowed: true,
    remainingAttempts,
    resetTime: null
  };
}

export function recordFailedAttempt(identifier) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);

  if (!attempts) {
    // First failed attempt
    loginAttempts.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      blockedUntil: null
    });
  } else {
    // Increment failed attempts
    attempts.count += 1;
    attempts.lastAttempt = now;

    // If max attempts reached, block the user
    if (attempts.count >= RATE_LIMIT.MAX_ATTEMPTS) {
      attempts.blockedUntil = now + RATE_LIMIT.BLOCK_DURATION_MS;
    }
  }
}

export function recordSuccessfulLogin(identifier) {
  // Clear attempts on successful login
  loginAttempts.delete(identifier);
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [identifier, attempts] of loginAttempts.entries()) {
    // Remove entries older than 5 minutes
    if (now - attempts.lastAttempt > 300000) {
      loginAttempts.delete(identifier);
    }
  }
}, 300000);

export default {
  checkRateLimit,
  recordFailedAttempt,
  recordSuccessfulLogin,
  RATE_LIMIT
};
