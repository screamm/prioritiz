import type { Context } from 'hono'

// Standard error codes used across the API
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  INVALID_EMAIL: 'INVALID_EMAIL',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

// Success response type
interface SuccessResponseData {
  success: boolean
  [key: string]: unknown
}

// Error response type
interface ErrorResponseData {
  error: string
  code: ErrorCode
  message?: string
  details?: unknown
}

/**
 * Creates a standardized success response
 */
export function successResponse<T extends Record<string, unknown>>(
  c: Context,
  data: T,
  status: 200 | 201 = 200
): Response {
  const responseData: SuccessResponseData = {
    success: true,
    ...data,
  }
  return c.json(responseData, status)
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  c: Context,
  code: ErrorCode,
  message: string,
  status: 400 | 401 | 403 | 404 | 429 | 500 = 400,
  details?: unknown
): Response {
  const responseData: ErrorResponseData = {
    error: getErrorTitle(code),
    code,
    message,
  }

  if (details !== undefined) {
    responseData.details = details
  }

  return c.json(responseData, status)
}

/**
 * Maps error codes to human-readable titles
 */
function getErrorTitle(code: ErrorCode): string {
  const titles: Record<ErrorCode, string> = {
    [ErrorCodes.VALIDATION_ERROR]: 'Validation Error',
    [ErrorCodes.INVALID_TOKEN]: 'Invalid Token',
    [ErrorCodes.TOKEN_NOT_FOUND]: 'Token Not Found',
    [ErrorCodes.INVALID_EMAIL]: 'Invalid Email',
    [ErrorCodes.EMAIL_SEND_FAILED]: 'Email Send Failed',
    [ErrorCodes.RATE_LIMITED]: 'Rate Limited',
    [ErrorCodes.NOT_FOUND]: 'Not Found',
    [ErrorCodes.INTERNAL_ERROR]: 'Internal Error',
    [ErrorCodes.DATABASE_ERROR]: 'Database Error',
  }
  return titles[code] || 'Error'
}

/**
 * Validates a token format (XXX-XXX-XXX)
 */
export function isValidTokenFormat(token: string): boolean {
  return /^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(token)
}

/**
 * Sanitizes a string by trimming and removing dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000) // Limit length
}

/**
 * Generates a request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
