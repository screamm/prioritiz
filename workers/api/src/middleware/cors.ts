const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'https://prioritiz.pages.dev',
]

// Pattern to match Cloudflare Pages preview deployments
const pagesDevPattern = /^https:\/\/[a-z0-9-]+\.prioritiz\.pages\.dev$/

export const corsConfig = {
  origin: (origin: string | undefined) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return '*'
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
  allowHeaders: ['Content-Type', 'X-Token', 'Authorization', 'X-Request-ID'],
  exposeHeaders: ['X-Request-Id', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
  credentials: true,
}
