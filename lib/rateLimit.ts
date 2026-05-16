export const generationRateLimit = {
  limit: async () => ({
    success: true,
    limit: 999,
    remaining: 999,
    reset: Date.now(),
  }),
};

export const otpRateLimit = {
  limit: async () => ({
    success: true,
    limit: 999,
    remaining: 999,
    reset: Date.now(),
  }),
};

export const loginRateLimitIP = {
  limit: async () => ({
    success: true,
    limit: 999,
    remaining: 999,
    reset: Date.now(),
  }),
};

export const loginRateLimitAccount = {
  limit: async () => ({
    success: true,
    limit: 999,
    remaining: 999,
    reset: Date.now(),
  }),
};