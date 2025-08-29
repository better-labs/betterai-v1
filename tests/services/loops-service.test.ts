import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createContact,
  addToMailingList,
  isLoopsConfigured,
  type CreateContactRequest,
  type CreateContactResponse
} from '@/lib/services/loops-service'

// Mock fetch globally
const fetchMock = vi.fn()
global.fetch = fetchMock

describe('Loops Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables
    delete process.env.LOOPS_API_KEY
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isLoopsConfigured', () => {
    it('should return false when LOOPS_API_KEY is not set', () => {
      expect(isLoopsConfigured()).toBe(false)
    })

    it('should return true when LOOPS_API_KEY is set', () => {
      process.env.LOOPS_API_KEY = 'test-key'
      expect(isLoopsConfigured()).toBe(true)
    })
  })

  describe('createContact', () => {
    const mockContactData: CreateContactRequest = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      mailingLists: {
        'list-id-1': true,
        'list-id-2': false
      }
    }

    const mockApiResponse: CreateContactResponse = {
      id: 'contact-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      subscribed: true,
      createdAt: '2024-01-01T00:00:00Z'
    }

    it('should return null when LOOPS_API_KEY is not configured', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await createContact(mockContactData)

      expect(result).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalledWith('LOOPS_API_KEY not configured, skipping contact creation')

      consoleWarnSpy.mockRestore()
    })

    it('should successfully create a contact', async () => {
      process.env.LOOPS_API_KEY = 'test-api-key'

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })

      const result = await createContact(mockContactData)

      expect(fetchMock).toHaveBeenCalledWith('https://app.loops.so/api/v1/contacts/create', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockContactData),
      })

      expect(result).toEqual(mockApiResponse)
    })

    it('should handle API errors gracefully', async () => {
      process.env.LOOPS_API_KEY = 'test-api-key'

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Invalid email format')
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await createContact(mockContactData)

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Loops API error (400):', 'Invalid email format')

      consoleErrorSpy.mockRestore()
    })

    it('should handle network errors gracefully', async () => {
      process.env.LOOPS_API_KEY = 'test-api-key'

      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await createContact(mockContactData)

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create Loops contact:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it('should handle minimal contact data', async () => {
      process.env.LOOPS_API_KEY = 'test-api-key'

      const minimalData: CreateContactRequest = {
        email: 'test@example.com'
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockApiResponse, firstName: undefined, lastName: undefined })
      })

      const result = await createContact(minimalData)

      expect(result).toBeDefined()
      expect(result?.email).toBe('test@example.com')
    })
  })

  describe('addToMailingList', () => {
    const mockApiResponse: CreateContactResponse = {
      id: 'contact-123',
      email: 'test@example.com',
      firstName: 'John',
      subscribed: true,
      createdAt: '2024-01-01T00:00:00Z'
    }

    it('should add user to default mailing list', async () => {
      process.env.LOOPS_API_KEY = 'test-api-key'

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })

      const result = await addToMailingList('test@example.com', 'John')

      expect(fetchMock).toHaveBeenCalledWith('https://app.loops.so/api/v1/contacts/create', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          firstName: 'John',
          mailingLists: {
            'cmel7blt51ca10izy3kyb7pn3': true
          }
        }),
      })

      expect(result).toEqual(mockApiResponse)
    })

    it('should add user to custom mailing list', async () => {
      process.env.LOOPS_API_KEY = 'test-api-key'
      const customListId = 'custom-list-123'

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      })

      const result = await addToMailingList('test@example.com', 'John', customListId)

      expect(fetchMock).toHaveBeenCalledWith('https://app.loops.so/api/v1/contacts/create', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          firstName: 'John',
          mailingLists: {
            [customListId]: true
          }
        }),
      })

      expect(result).toEqual(mockApiResponse)
    })

    it('should handle API failures gracefully', async () => {
      process.env.LOOPS_API_KEY = 'test-api-key'

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve('Email already exists')
      })

      const result = await addToMailingList('test@example.com', 'John')

      expect(result).toBeNull()
    })
  })

  describe('Integration with User Service', () => {
    it('should handle malformed email addresses', async () => {
      process.env.LOOPS_API_KEY = 'test-api-key'

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Invalid email format')
      })

      // This simulates what would happen in user-service.ts
      const malformedData: CreateContactRequest = {
        email: 'invalid-email',
        firstName: 'Test User'
      }

      const result = await createContact(malformedData)

      expect(result).toBeNull()
    })

    it('should handle empty names gracefully', async () => {
      process.env.LOOPS_API_KEY = 'test-api-key'

      const mockResponse: CreateContactResponse = {
        id: 'contact-123',
        email: 'test@example.com',
        subscribed: true,
        createdAt: '2024-01-01T00:00:00Z'
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await createContact({
        email: 'test@example.com',
        firstName: '',
        lastName: ''
      })

      expect(result).toBeDefined()
      expect(result?.email).toBe('test@example.com')
    })
  })
})
