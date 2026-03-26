const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'https://prioritiz.pages.dev',
  'https://prioritiz.com',
  'https://www.prioritiz.com',
  'https://prioritz.com',
  'https://www.prioritz.com',
]

// Pattern to match Cloudflare Pages preview deployments
const pagesDevPattern = /^https:\/\/[a-z0-9-]+\.prioritiz\.pages\.dev$/

export const corsConfig = {
  origin: (origin: string | undefined) => {
    // Requests without an Origin header (e.g. curl, Postman) are not browser-initiated
    // cross-origin requests — deny CORS access rather than granting wildcard
    if (!origin) {
      return null
    }

    // Check against allowed list
    if (allowedOrigins.includes(origin)) {
      return origin
    }

    // Check against Pages dev pattern for preview deployments
    if (pagesDevPattern.test(origin)) {
      return origin
    }

    // Block other origins
    return null
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Request-ID'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
  credentials: true,
}
