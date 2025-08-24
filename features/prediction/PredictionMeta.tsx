import { Badge } from "@/shared/ui/badge"
import { cn } from '@/lib/utils'

interface PredictionMetaProps {
  confidenceLevel?: 'High' | 'Medium' | 'Low' | null
  modelName?: string | null
  createdAt?: Date | string | null
  className?: string
  align?: 'left' | 'right'
}

function confidenceVariant(level?: 'High' | 'Medium' | 'Low' | null) {
  switch (level) {
    case 'High':
      return 'default' as const
    case 'Medium':
      return 'secondary' as const
    case 'Low':
      return 'outline' as const
    default:
      return 'secondary' as const
  }
}

export function PredictionMeta({ confidenceLevel, modelName, createdAt, className, align = 'left' }: PredictionMetaProps) {
  const created = createdAt ? new Date(createdAt).toLocaleString() : null

  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-xs text-muted-foreground', align === 'right' && 'justify-end', className)}>
      {confidenceLevel && (
        <Badge variant={confidenceVariant(confidenceLevel)}>{confidenceLevel} confidence</Badge>
      )}
      {modelName && (
        <span className="rounded border px-2 py-0.5">{modelName}</span>
      )}
      {created && (
        <span className="rounded border px-2 py-0.5">{created}</span>
      )}
    </div>
  )
}


