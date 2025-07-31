import { pgTable, text, timestamp, numeric, jsonb, serial, index, integer } from "drizzle-orm/pg-core"

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    slug: text("slug"),
    tags: jsonb("tags"),
    endDate: timestamp("end_date"),
    volume: numeric("volume").default("0"),
    trendingRank: integer("trending_rank"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    volumeIdx: index("idx_events_volume").on(table.volume),
    trendingRankIdx: index("idx_events_trending_rank").on(table.trendingRank),
    slugIdx: index("idx_events_slug").on(table.slug),
  }),
)

export const markets = pgTable(
  "markets",
  {
    id: text("id").primaryKey(),
    question: text("question").notNull(),
    eventId: text("event_id").references(() => events.id),
    outcomePrices: numeric("outcome_prices").array(),
    volume: numeric("volume").default("0"),
    liquidity: numeric("liquidity").default("0"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    eventIdIdx: index("idx_markets_event_id").on(table.eventId),
    volumeIdx: index("idx_markets_volume").on(table.volume),
  }),
)

export const predictions = pgTable(
  "predictions",
  {
    id: serial("id").primaryKey(),
    question: text("question").notNull(),
    marketId: text("market_id").references(() => markets.id),
    predictionResult: jsonb("prediction_result").notNull(),
    aiResponse: text("ai_response"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("idx_predictions_created_at").on(table.createdAt),
    marketIdIdx: index("idx_predictions_market_id").on(table.marketId),
  }),
)

// Drizzle inferred types
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type Market = typeof markets.$inferSelect
export type NewMarket = typeof markets.$inferInsert
export type Prediction = typeof predictions.$inferSelect
export type NewPrediction = typeof predictions.$inferInsert
