import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryProvider } from "@/shared/providers/query-provider"

describe('QueryProvider', () => {
  it('renders children correctly', () => {
    render(
      <QueryProvider>
        <div data-testid="test-child">Test Child</div>
      </QueryProvider>
    )

    expect(screen.getByTestId('test-child')).toBeInTheDocument()
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('wraps children with QueryClientProvider', () => {
    const TestComponent = () => <div data-testid="test-component">Test Component</div>

    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>
    )

    expect(screen.getByTestId('test-component')).toBeInTheDocument()
  })
})