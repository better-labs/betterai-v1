'use client'

import { components } from '@/lib/design-system'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { RESEARCH_SOURCES, getAvailableResearchSources } from '@/lib/config/research-sources'

interface ResearchSourceSelectionCardProps {
  selectedSources: string[]
  onSourcesChange: (sources: string[]) => void
}

export function ResearchSourceSelectionCard({ 
  selectedSources, 
  onSourcesChange 
}: ResearchSourceSelectionCardProps) {
  const availableSources = getAvailableResearchSources()

  const handleSourceToggle = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      onSourcesChange(selectedSources.filter(id => id !== sourceId))
    } else {
      onSourcesChange([...selectedSources, sourceId])
    }
  }

  const handleSelectAll = () => {
    if (selectedSources.length === availableSources.length) {
      // Deselect all (but keep at least one)
      onSourcesChange([availableSources[0].id])
    } else {
      // Select all
      onSourcesChange(availableSources.map(source => source.id))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Research Sources</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select which sources AI models will use to gather market research data (at least one required)
        </p>
      </CardHeader>
      <CardContent className={components.researchSelection.container}>
        <Button
          variant={components.toggleAction.variant}
          size={components.toggleAction.sizeSecondary}
          onClick={handleSelectAll}
          className={components.toggleAction.buttonSecondary}
          data-debug-id="select-all-research-sources-button"
        >
          {selectedSources.length === availableSources.length ? 'Select One' : 'Select All'}
        </Button>
        
        <div className="space-y-3">
          {availableSources.map((source) => (
            <label
              key={source.id}
              className={components.researchSelection.sourceOption}
              data-debug-id={`research-source-${source.id}`}
            >
              <Checkbox
                checked={selectedSources.includes(source.id)}
                onCheckedChange={() => handleSourceToggle(source.id)}
                className="mt-0.5"
              />
              <div className={components.researchSelection.sourceContent}>
                <div className={components.researchSelection.sourceHeader}>
                  <div>
                    <div className={components.researchSelection.sourceName}>{source.name}</div>
                    <div className={components.researchSelection.sourceProvider}>{source.provider}</div>
                  </div>
                  <Badge variant="outline" className={components.researchSelection.sourceCost}>
                    {source.creditCost} credit{source.creditCost !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <p className={components.researchSelection.sourceDescription}>
                  {source.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}