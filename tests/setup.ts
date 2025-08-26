import { vi } from 'vitest'
import '@testing-library/jest-dom'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables for development testing
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  config({ path: resolve(process.cwd(), '.env.local') })
}

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000/',
    pathname: '/',
  },
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock fetch globally
global.fetch = vi.fn()