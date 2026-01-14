import type { SyncRequest, SyncResponse, RestoreResponse, EmailRequest, ApiError } from '@/types'
import { API_URL } from '@/utils/constants'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Unknown error',
        code: 'UNKNOWN',
      }))
      throw new Error(error.error)
    }

    return response.json()
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
