import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CreditsPage from '@/app/credits/page'

// Mock the hooks with realistic serialized data
vi.mock('@/hooks/use-user', () => ({
  useUser: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
    isReady: true
  })
}))

vi.mock('@privy-io/react-auth', () => ({
  usePrivy: () => ({
    getAccessToken: () => Promise.resolve('mock-token')
  })
}))

// Mock fetch to return serialized dates (strings, not Date objects)
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({
    credits: {
      credits: 100,
      // This simulates what actually comes back from JSON API
      creditsLastReset: '2024-01-01T00:00:00.000Z', // String, not Date!
      totalCreditsEarned: 200,
      totalCreditsSpent: 100
    },
    isAuthenticated: true
  })
})

describe('CreditsPage', () => {
  it('should handle serialized dates from API without crashing', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    // This test would have caught the .getTime() error
    expect(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <CreditsPage />
        </QueryClientProvider>
      )
    }).not.toThrow()

    // Wait for the component to load and verify it renders correctly
    await screen.findByText('Credits')
  })
})
