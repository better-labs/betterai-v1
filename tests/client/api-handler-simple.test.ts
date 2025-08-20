import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiRequest } from '@/lib/client/api-handler'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock rate limit utilities
vi.mock('@/lib/client/rate-limit-utils', () => ({
  isRateLimitError: vi.fn(() => false),
  extractRateLimitInfo: vi.fn(() => null),
  getRateLimitMessage: vi.fn(() => 'Rate limit exceeded'),
  isNearRateLimit: vi.fn(() => false),
}))

describe('apiRequest function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('makes successful API request', async () => {
    const mockData = { success: true, data: 'test' }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
      headers: new Headers(),
    } as Response)

    const result = await apiRequest('/api/test')

    expect(fetch).toHaveBeenCalledWith('/api/test', {})
    expect(result).toEqual(mockData)
  })

  it('handles API errors', async () => {
    const errorData = { error: 'Test error' }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve(errorData),
      headers: new Headers(),
    } as Response)

    await expect(apiRequest('/api/test')).rejects.toThrow('Test error')
    expect(toast.error).toHaveBeenCalledWith('Test error')
  })

  it('shows success toast when configured', async () => {
    const mockData = { success: true }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
      headers: new Headers(),
    } as Response)

    await apiRequest('/api/test', {}, { 
      showSuccessToast: true, 
      successMessage: 'Success!' 
    })

    expect(toast.success).toHaveBeenCalledWith('Success!')
  })

  it('handles network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    await expect(apiRequest('/api/test')).rejects.toThrow('Network error')
  })

  it('makes POST request with body', async () => {
    const mockData = { id: 123 }
    const requestBody = { name: 'test' }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
      headers: new Headers(),
    } as Response)

    const result = await apiRequest('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    expect(fetch).toHaveBeenCalledWith('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })
    expect(result).toEqual(mockData)
  })
})