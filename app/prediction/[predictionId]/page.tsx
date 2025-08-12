import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { predictionQueries } from "@/lib/db/queries"
import { EventIcon } from "@/components/event-icon"
import { getPredictionDisplayData } from "@/lib/utils"

type PageParams = { predictionId: string }
type PageProps = { params: Promise<PageParams> }

export default async function PredictionDetailPage({ params }: PageProps) {
  const { predictionId } = await params
  const id = Number(predictionId)
  if (!Number.isFinite(id)) return notFound()

  const prediction = await predictionQueries.getPredictionWithRelationsById(id)
  if (!prediction) return notFound()

  const market = prediction.market
  const event = market?.event || null

  const { aiProbability, reasoning, marketProbability } = getPredictionDisplayData(
    prediction as any
  )

  const createdAtDisplay = prediction.createdAt ? format(new Date(prediction.createdAt), 'PP p') : ''
  // const eventExternalUrl = event?.id ? await generateEventURL(event.id) : null
  // const marketExternalUrl = market?.id ? await generateMarketURL(market.id) : null

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href={market?.id ? `/market/${market.id}` : '/'} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <span className="mr-2">←</span> Back {market?.id ? 'to Market' : 'Home'}
        </Link>
      </div>
      <div className="mb-6" data-testid="event-container">
        <Link href="/" className="flex items-center gap-3">
          <EventIcon image={event?.image ?? null} icon={event?.icon ?? null} title={event?.title ?? ''} size="lg" />
          <div>
            <div className="text-sm text-muted-foreground">Event</div>
            <h1 className="text-2xl font-semibold">{event?.title ?? '—'}</h1>
          </div>
        </Link>
      </div>
      
      <Link href={market?.id ? `/market/${market.id}` : '#'} className="block mb-8">
        <div className="text-sm text-muted-foreground">Market</div>
        <p className="text-lg font-medium">{market?.question ?? prediction.userMessage}</p>
      </Link>

      <div className="grid gap-6 sm:grid-cols-12">
        <div className="sm:col-span-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Market Probability</div>
          <div className="text-3xl font-semibold tabular-nums">{marketProbability !== null ? `${marketProbability}%` : '--'}</div>
        </div>
        <div className="sm:col-span-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">AI Probability</div>
          <div className="text-3xl font-semibold tabular-nums">{aiProbability}%</div>
        </div>
        <div className="sm:col-span-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Reasoning</div>
          <div className="mt-1 whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {reasoning ?? '—'}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Created</div>
          <div className="text-sm text-muted-foreground">{createdAtDisplay}</div>
        </div>
        {prediction.modelName && (
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Model</div>
            <div className="text-sm text-muted-foreground">{prediction.modelName}</div>
          </div>
        )}
      </div>
    </div>
  )
}


