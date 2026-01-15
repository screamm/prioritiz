import type { SyncRequest, SyncResponse, RestoreResponse, EmailRequest, ApiError } from '@/types'
import { API_URL } from '@/utils/constants'

/**
 * Request timeout in milliseconds (30 seconds)
 */
const REQUEST_TIMEOUT_MS = 30000

/**
 * Generate a unique request ID for debugging
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Custom error class for API errors with additional context
 */
export class ApiRequestError extends Error {
  readonly statusCode: number
  readonly errorCode: string
  readonly requestId: string
  readonly isNetworkError: boolean
  readonly isTimeout: boolean

  constructor(options: {
    message: string
    statusCode: number
    errorCode: string
    requestId: string
    isNetworkError?: boolean
    isTimeout?: boolean
  }) {
    super(options.message)
    this.name = 'ApiRequestError'
    this.statusCode = options.statusCode
    this.errorCode = options.errorCode
    this.requestId = options.requestId
    this.isNetworkError = options.isNetworkError ?? false
    this.isTimeout = options.isTimeout ?? false
  }

  /**
   * Whether this error is retryable (network errors and 5xx responses)
   */
  get isRetryable(): boolean {
    return this.isNetworkError || this.isTimeout || (this.statusCode >= 500 && this.statusCode < 600)
  }

  /**
   * Whether this is a client error (4xx responses)
   */
  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  /**
   * Parse error response, handling non-JSON responses (like 502 HTML pages)
   */
  private async parseErrorResponse(response: Response, _requestId: string): Promise<ApiError> {
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      try {
        const errorData = await response.json()
        return {
          error: errorData.error || errorData.message || 'Unknown error',
          code: errorData.code || `HTTP_${response.status}`,
        }
      } catch {
        // JSON parsing failed
      }
    }

    // For non-JSON responses (HTML error pages, etc.)
    const statusText = response.statusText || 'Unknown error'
    return {
      error: `HTTP ${response.status}: ${statusText}`,
      code: `HTTP_${response.status}`,
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const requestId = generateRequestId()

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response, requestId)

        throw new ApiRequestError({
          message: errorData.error,
          statusCode: response.status,
          errorCode: errorData.code || 'UNKNOWN',
          requestId,
        })
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        // For non-JSON success responses, return empty object
        return {} as T
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      // Already an ApiRequestError, re-throw
      if (error instanceof ApiRequestError) {
        throw error
      }

      // Handle AbortError (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiRequestError({
          message: 'Request timed out',
          statusCode: 0,
          errorCode: 'TIMEOUT',
          requestId,
          isTimeout: true,
        })
      }

      // Handle network errors (fetch failed)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiRequestError({
          message: 'Network error - could not reach server',
          statusCode: 0,
          errorCode: 'NETWORK_ERROR',
          requestId,
          isNetworkError: true,
        })
      }

      // Handle other network-related errors
      if (error instanceof Error) {
        const isNetworkError =
          error.message.includes('network') ||
          error.message.includes('Network') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('ERR_INTERNET_DISCONNECTED')

        throw new ApiRequestError({
          message: error.message,
          statusCode: 0,
          errorCode: isNetworkError ? 'NETWORK_ERROR' : 'UNKNOWN',
          requestId,
          isNetworkError,
        })
      }

      // Unknown error type
      throw new ApiRequestError({
        message: 'An unknown error occurred',
        statusCode: 0,
        errorCode: 'UNKNOWN',
        requestId,
      })
    }
  }

  async sync(data: SyncRequest): Promise<SyncResponse> {
    return this.request<SyncResponse>('/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async restore(token: string): Promise<RestoreResponse> {
    return this.request<RestoreResponse>(`/restore/${token}`)
  }

  async sendEmail(data: EmailRequest): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/email', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async health(): Promise<{ status: string; timestamp: number }> {
    return this.request<{ status: string; timestamp: number }>('/health')
  }
}

export const api = new ApiClient(API_URL)
