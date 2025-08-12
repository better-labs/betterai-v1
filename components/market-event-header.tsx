import Link from 'next/link'
import { cn } from '@/lib/utils'
import { EventIcon } from '@/components/event-icon'

interface MarketEventHeaderProps {
  eventId?: string | null
  eventTitle?: string | null
  eventImage?: string | null
  eventIcon?: string | null
  marketId?: string | null
  marketQuestion?: string | null
  showEventLine?: boolean
  showMarketLine?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MarketEventHeader({
  eventId,
  eventTitle,
  eventImage,
  eventIcon,
  marketId,
  marketQuestion,
  showEventLine = true,
  showMarketLine = true,
  size = 'md',
  className,
}: MarketEventHeaderProps) {
  const titleClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl'

  return (
    <div className={cn('space-y-2', className)}>
      {showEventLine && (
        <div className="flex items-center gap-3">
          <Link href={eventId ? `/event/${eventId}` : '#'} className="flex items-center gap-3">
            <EventIcon image={eventImage ?? null} icon={eventIcon ?? null} title={eventTitle ?? ''} size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'} />
            <div>
              <div className="text-sm text-muted-foreground">Event</div>
              <div className={cn('font-semibold', titleClass)}>{eventTitle ?? '—'}</div>
            </div>
          </Link>
        </div>
      )}

      {showMarketLine && (
        <Link href={marketId ? `/market/${marketId}` : '#'} className="block">
          <div className="text-sm text-muted-foreground">Market</div>
          <div className="text-lg font-medium">{marketQuestion ?? '—'}</div>
        </Link>
      )}
    </div>
  )
}


