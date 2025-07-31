import { db } from '@/lib/db'
import { markets } from '@/lib/db/schema'
import { eq, desc, gt } from 'drizzle-orm'
import type { Market, NewMarket } from '@/lib/types'

export async function getMarketsByEventId(eventId: string): Promise<Market[]> {
  return await db.query.markets.findMany({
    where: (markets, { eq }) => eq(markets.eventId, eventId),
    orderBy: (markets, { desc }) => [desc(markets.volume)]
  })
}

export async function getMarketById(id: string): Promise<Market | null> {
  const result = await db.query.markets.findFirst({
    where: (markets, { eq }) => eq(markets.id, id)
  })
  return result || null
}

export async function getHighVolumeMarkets(limit: number = 20): Promise<Market[]> {
  return await db.query.markets.findMany({
    where: (markets, { gt }) => gt(markets.volume, "10000"),
    orderBy: (markets, { desc }) => [desc(markets.volume)],
    limit
  })
}

export async function createMarket(marketData: NewMarket): Promise<Market> {
  const [result] = await db.insert(markets).values(marketData).returning()
  return result
}

export async function updateMarket(id: string, marketData: Partial<NewMarket>): Promise<Market | null> {
  const [result] = await db
    .update(markets)
    .set({ ...marketData, updatedAt: new Date() })
    .where(eq(markets.id, id))
    .returning()
  return result || null
}

export async function deleteMarket(id: string): Promise<boolean> {
  const result = await db.delete(markets).where(eq(markets.id, id))
  return result.rowCount > 0
}

export async function updateMarketVolume(id: string, newVolume: number): Promise<Market | null> {
  const [result] = await db
    .update(markets)
    .set({ volume: newVolume.toString(), updatedAt: new Date() })
    .where(eq(markets.id, id))
    .returning()
  return result || null
} 