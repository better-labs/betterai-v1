import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResearchSourceSelectionCard } from '@/features/prediction/research-source-selection-card.client'

// Mock the research sources config
vi.mock('@/lib/config/research-sources', () => ({
  getAvailableResearchSources: () => [
    {
      id: 'exa',
      name: 'Exa.ai',
      description: 'Advanced web search optimized for recent developments',
      provider: 'Exa.ai',
      creditCost: 1,
      available: true
    },
    {
      id: 'grok',
      name: 'X (Twitter)',
      description: 'X (Twitter) realtime market research via Grok AI',
      provider: 'Grok AI',
      creditCost: 2,
      available: true
    }
  ]
}))

// Mock design system
vi.mock('@/lib/design-system', () => ({
  components: {
    researchSelection: {
      container: 'space-y-4',
      sourceOption: 'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors',
      sourceContent: 'flex-1 min-w-0',
      sourceHeader: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1',
      sourceName: 'font-medium text-sm',
      sourceProvider: 'text-xs text-muted-foreground',
      sourceDescription: 'text-xs text-muted-foreground mt-1',
      sourceCost: 'text-xs w-fit'
    },
    toggleAction: {
      variant: 'outline',
      sizeSecondary: 'sm',
      buttonSecondary: 'w-fit mt-2'
    }
  }
}))

describe('ResearchSourceSelectionCard', () => {
  const mockOnSourcesChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with title and description', () => {
    render(
      <ResearchSourceSelectionCard
        selectedSources={['exa']}
        onSourcesChange={mockOnSourcesChange}
      />
    )

    expect(screen.getByText('Choose Research Sources')).toBeInTheDocument()
    expect(screen.getByText(/Select which sources AI models will use/)).toBeInTheDocument()
    expect(screen.getByText(/at least one required/)).toBeInTheDocument()
  })

  it('should render all available research sources', () => {
    render(
      <ResearchSourceSelectionCard
        selectedSources={[]}
        onSourcesChange={mockOnSourcesChange}
      />
    )

    expect(screen.getByText('Exa.ai')).toBeInTheDocument()
    expect(screen.getByText('X (Twitter)')).toBeInTheDocument()
    expect(screen.getByText('Exa.ai')).toBeInTheDocument()
    expect(screen.getByText('Grok AI')).toBeInTheDocument()
  })

  it('should show credit costs for each source', () => {
    render(
      <ResearchSourceSelectionCard
        selectedSources={[]}
        onSourcesChange={mockOnSourcesChange}
      />
    )

    expect(screen.getByText('1 credit')).toBeInTheDocument()
    expect(screen.getByText('2 credits')).toBeInTheDocument()
  })

  it('should show correct checkbox states for selected sources', () => {
    render(
      <ResearchSourceSelectionCard
        selectedSources={['exa']}
        onSourcesChange={mockOnSourcesChange}
      />
    )

    const exaCheckbox = screen.getByTestId('research-source-exa').querySelector('button')
    const grokCheckbox = screen.getByTestId('research-source-grok').querySelector('button')

    expect(exaCheckbox).toHaveAttribute('data-state', 'checked')
    expect(grokCheckbox).toHaveAttribute('data-state', 'unchecked')
  })

  it('should call onSourcesChange when source is toggled', () => {
    render(
      <ResearchSourceSelectionCard
        selectedSources={['exa']}
        onSourcesChange={mockOnSourcesChange}
      />
    )

    const grokCheckbox = screen.getByTestId('research-source-grok').querySelector('button')
    fireEvent.click(grokCheckbox!)

    expect(mockOnSourcesChange).toHaveBeenCalledWith(['exa', 'grok'])
  })

  it('should remove source when unchecking', () => {
    render(
      <ResearchSourceSelectionCard
        selectedSources={['exa', 'grok']}
        onSourcesChange={mockOnSourcesChange}
      />
    )

    const exaCheckbox = screen.getByTestId('research-source-exa').querySelector('button')
    fireEvent.click(exaCheckbox!)

    expect(mockOnSourcesChange).toHaveBeenCalledWith(['grok'])
  })

  describe('Select All functionality', () => {
    it('should show "Select All" when not all sources are selected', () => {
      render(
        <ResearchSourceSelectionCard
          selectedSources={['exa']}
          onSourcesChange={mockOnSourcesChange}
        />
      )

      const selectAllButton = screen.getByTestId('select-all-research-sources-button')
      expect(selectAllButton).toHaveTextContent('Select All')
    })

    it('should show "Select One" when all sources are selected', () => {
      render(
        <ResearchSourceSelectionCard
          selectedSources={['exa', 'grok']}
          onSourcesChange={mockOnSourcesChange}
        />
      )

      const selectAllButton = screen.getByTestId('select-all-research-sources-button')
      expect(selectAllButton).toHaveTextContent('Select One')
    })

    it('should select all sources when clicking "Select All"', () => {
      render(
        <ResearchSourceSelectionCard
          selectedSources={['exa']}
          onSourcesChange={mockOnSourcesChange}
        />
      )

      const selectAllButton = screen.getByTestId('select-all-research-sources-button')
      fireEvent.click(selectAllButton)

      expect(mockOnSourcesChange).toHaveBeenCalledWith(['exa', 'grok'])
    })

    it('should keep only first source when clicking "Select One" (from all selected)', () => {
      render(
        <ResearchSourceSelectionCard
          selectedSources={['exa', 'grok']}
          onSourcesChange={mockOnSourcesChange}
        />
      )

      const selectOneButton = screen.getByTestId('select-all-research-sources-button')
      fireEvent.click(selectOneButton)

      expect(mockOnSourcesChange).toHaveBeenCalledWith(['exa'])
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <ResearchSourceSelectionCard
          selectedSources={['exa']}
          onSourcesChange={mockOnSourcesChange}
        />
      )

      // Check that checkboxes have proper roles
      const checkboxes = screen.getAllByRole('button', { name: /checkbox/i })
      expect(checkboxes).toHaveLength(2)

      // Check that labels are associated with checkboxes
      const exaLabel = screen.getByTestId('research-source-exa')
      expect(exaLabel).toBeInTheDocument()
    })

    it('should be keyboard accessible', () => {
      render(
        <ResearchSourceSelectionCard
          selectedSources={[]}
          onSourcesChange={mockOnSourcesChange}
        />
      )

      const selectAllButton = screen.getByTestId('select-all-research-sources-button')
      
      // Should be focusable
      selectAllButton.focus()
      expect(selectAllButton).toHaveFocus()

      // Should respond to Enter key
      fireEvent.keyDown(selectAllButton, { key: 'Enter' })
      expect(mockOnSourcesChange).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle empty selected sources array', () => {
      render(
        <ResearchSourceSelectionCard
          selectedSources={[]}
          onSourcesChange={mockOnSourcesChange}
        />
      )

      const checkboxes = screen.getAllByRole('button')
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAttribute('data-state', 'unchecked')
      })
    })

    it('should handle invalid source IDs in selectedSources', () => {
      render(
        <ResearchSourceSelectionCard
          selectedSources={['exa', 'invalid-source']}
          onSourcesChange={mockOnSourcesChange}
        />
      )

      // Should still render correctly, ignoring invalid sources
      const exaCheckbox = screen.getByTestId('research-source-exa').querySelector('button')
      expect(exaCheckbox).toHaveAttribute('data-state', 'checked')
    })

    it('should maintain selection state across re-renders', () => {
      const { rerender } = render(
        <ResearchSourceSelectionCard
          selectedSources={['exa']}
          onSourcesChange={mockOnSourcesChange}
        />
      )

      let exaCheckbox = screen.getByTestId('research-source-exa').querySelector('button')
      expect(exaCheckbox).toHaveAttribute('data-state', 'checked')

      rerender(
        <ResearchSourceSelectionCard
          selectedSources={['exa', 'grok']}
          onSourcesChange={mockOnSourcesChange}
        />
      )

      exaCheckbox = screen.getByTestId('research-source-exa').querySelector('button')
      const grokCheckbox = screen.getByTestId('research-source-grok').querySelector('button')
      
      expect(exaCheckbox).toHaveAttribute('data-state', 'checked')
      expect(grokCheckbox).toHaveAttribute('data-state', 'checked')
    })
  })
})