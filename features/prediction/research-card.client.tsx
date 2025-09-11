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
  
  let text = ''
  
  if (typeof response === 'string') {
    text = response
  } else if (response.results && Array.isArray(response.results)) {
    // Handle common research response structures
    text = response.results
      .map((result: any, index: number) => {
        let resultText = `${index + 1}. `
        if (result.title) resultText += `**${result.title}**\n`
        if (result.snippet || result.description) resultText += `${result.snippet || result.description}\n`
        if (result.url) resultText += `Source: ${result.url}\n`
        return resultText
      })
      .join('\n')
  } else if (response.content) {
    text = response.content
  } else if (response.summary) {
    text = response.summary
  } else {
    // Fallback: JSON stringify with formatting
    try {
      text = JSON.stringify(response, null, 2)
        .replace(/[{}[\]"]/g, '')
        .replace(/,\s*\n/g, '\n')
        .replace(/:\s*/g, ': ')
        .trim()
    } catch {
      return 'Unable to format research data'
    }
  }
  
  // Limit to 2000 characters
  if (text.length > 2000) {
    text = text.slice(0, 2000).trim()
  }
  
  return text
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