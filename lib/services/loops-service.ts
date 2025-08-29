/**
 * Loops.so Email Marketing Service
 *
 * Service for integrating with Loops.so email marketing platform.
 * Follows clean service pattern with dependency injection.
 */

export interface CreateContactRequest {
  email: string
  firstName?: string
  lastName?: string
  userId?: string
  mailingLists?: Record<string, boolean>
}

export interface CreateContactResponse {
  id: string
  email: string
  firstName?: string
  lastName?: string
  userId?: string
  subscribed: boolean
  createdAt: string
}

export interface LoopsApiError {
  message: string
  status?: number
}

/**
 * Create a contact in Loops.so
 * @param contactData - Contact information to create
 * @returns Promise with created contact data or null if failed
 */
export async function createContact(contactData: CreateContactRequest): Promise<CreateContactResponse | null> {
  const apiKey = process.env.LOOPS_API_KEY

  if (!apiKey) {
    console.warn('LOOPS_API_KEY not configured, skipping contact creation')
    return null
  }

  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Loops API error (${response.status}):`, errorText)

      // Don't throw error to avoid breaking user registration
      return null
    }

    const data: CreateContactResponse = await response.json()

    console.log(`Successfully created Loops contact for ${contactData.email}`)
    return data
  } catch (error) {
    console.error('Failed to create Loops contact:', error)
    // Don't throw error to avoid breaking user registration
    return null
  }
}

/**
 * Add user to specific mailing list
 * @param email - User email
 * @param firstName - User first name
 * @param mailingListId - Loops mailing list ID
 * @returns Promise with created contact data or null if failed
 */
export async function addToMailingList(
  email: string,
  firstName: string,
  mailingListId: string = 'cmel7blt51ca10izy3kyb7pn3'
): Promise<CreateContactResponse | null> {
  return createContact({
    email,
    firstName,
    mailingLists: {
      [mailingListId]: true
    }
  })
}

/**
 * Check if Loops service is properly configured
 * @returns boolean indicating if service is ready to use
 */
export function isLoopsConfigured(): boolean {
  return !!process.env.LOOPS_API_KEY
}
