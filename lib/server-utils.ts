/**
 * Server-side utility functions that require database access
 * Separated from lib/utils.ts to avoid bundling server code in client
 */

import { prisma } from './db/prisma'
import * as eventService from './services/event-service'

/**
 * Builds a canonical external URL for an event on its source market provider
 * using the stored `slug` and `marketProvider`.
 *
 * Example: polymarket → https://polymarket.com/event/<slug>
 */
export async function generateEventURL(eventId: string): Promise<string | null> {
  if (!eventId) return null

  // Fetch event to get slug and provider
  const event = await eventService.getEventById(prisma, eventId)
  if (!event || !event.slug) return null

  const providerRaw = (event.marketProvider || 'polymarket').trim().toLowerCase()

  // Map known providers to their domains; default to <provider>.com
  let domain: string
  switch (providerRaw) {
    case 'polymarket':
      domain = 'polymarket.com'
      break
    case 'kalshi':
      domain = 'kalshi.com'
      break
    default:
      domain = `${providerRaw}.com`
  }

  // Construct final URL
  const baseUrl = `https://${domain}/event`
  return `${baseUrl}/${event.slug}`
}

/**
 * Builds a canonical external URL for a market on its source market provider
 * using stored market and event data.
 * 
 * Example: polymarket → https://polymarket.com/event/<event-slug>?market=<market-id>
 */
export async function generateMarketURL(marketId: string): Promise<string | null> {
  if (!marketId) return null

  try {
    // Try to fetch market data first from database to get event
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: { event: true }
    })

    if (!market || !market.event) {
      // Fallback: create Polymarket URL directly using marketId
      return `https://polymarket.com/market/${marketId}`
    }

    // Use event-based URL if available
    if (market.event.slug) {
      const eventURL = await generateEventURL(market.event.id)
      return eventURL ? `${eventURL}?market=${marketId}` : `https://polymarket.com/market/${marketId}`
    }

    // Final fallback
    return `https://polymarket.com/market/${marketId}`
  } catch (error) {
    console.error(`Failed to generate market URL for ${marketId}:`, error)
    // Fallback URL
    return `https://polymarket.com/market/${marketId}`
  }
}