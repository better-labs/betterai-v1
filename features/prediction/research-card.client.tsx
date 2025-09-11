'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { components, typography } from '@/lib/design-system'
import { TextCollapse } from '@/shared/ui/text-collapse.client'

interface ResearchData {
  source: string
  response: any // JSON response from research API
  createdAt?: string | null
}

interface ResearchCardProps {
  research: ResearchData
}

function formatResponseToText(response: any): string {
  if (!response) return 'No research data available'
  
  if (typeof response === 'string') {
    return response
  }
  
  // Handle common research response structures
  if (response.results && Array.isArray(response.results)) {
    return response.results
      .map((result: any, index: number) => {
        let text = `${index + 1}. `
        if (result.title) text += `**${result.title}**\n`
        if (result.snippet || result.description) text += `${result.snippet || result.description}\n`
        if (result.url) text += `Source: ${result.url}\n`
        return text
      })
      .join('\n')
  }
  
  if (response.content) {
    return response.content
  }
  
  if (response.summary) {
    return response.summary
  }
  
  // Fallback: JSON stringify with formatting
  try {
    return JSON.stringify(response, null, 2)
      .replace(/[{}[\]"]/g, '')
      .replace(/,\s*\n/g, '\n')
      .replace(/:\s*/g, ': ')
      .trim()
  } catch {
    return 'Unable to format research data'
  }
}

function capitalizeSource(source: string): string {
  return source.charAt(0).toUpperCase() + source.slice(1).toLowerCase()
}

export function ResearchCard({ research }: ResearchCardProps) {
  const formattedText = formatResponseToText(research.response)

  return (
    <Card 
      className={components.card.base}
      data-debug-id={`research-card-${research.source}`}
    >
      <CardHeader className={components.card.market.header}>
        <CardTitle className={typography.h4}>
          {capitalizeSource(research.source)} Research
        </CardTitle>
      </CardHeader>
      
      <CardContent className={components.card.market.content}>
        <TextCollapse maxLength={300}>
          {formattedText}
        </TextCollapse>
      </CardContent>
    </Card>
  )
}