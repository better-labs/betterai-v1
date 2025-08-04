import { pgTable, text, timestamp, numeric, jsonb, serial, index, integer, boolean } from "drizzle-orm/pg-core"

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    slug: text("slug"),
    icon: text("icon"), // Add icon URL field
    tags: jsonb("tags"),
    volume: numeric("volume").default("0"),
    trendingRank: integer("trending_rank"),
    endDate: timestamp("end_date"), // Add endDate field
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      volumeIdx: index("idx_events_volume").on(table.volume),
      trendingRankIdx: index("idx_events_trending_rank").on(table.trendingRank),
      slugIdx: index("idx_events_slug").on(table.slug),
      endDateIdx: index("idx_events_end_date").on(table.endDate),
    }
  },
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
    category: text("category"),
    description: text("description"),
    active: boolean("active"),
    closed: boolean("closed"),
    endDate: timestamp("end_date"), // Add endDate field
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      eventIdIdx: index("idx_markets_event_id").on(table.eventId),
      volumeIdx: index("idx_markets_volume").on(table.volume),
      endDateIdx: index("idx_markets_end_date").on(table.endDate),
    }
  },
)

export const predictions = pgTable(
  "predictions",
  {
    id: serial("id").primaryKey(),
    userMessage: text("user_message").notNull(),
    marketId: text("market_id").references(() => markets.id),
    predictionResult: jsonb("prediction_result").notNull(),
    modelName: text("model_name"),
    systemPrompt: text("system_prompt"),
    aiResponse: text("ai_response"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      createdAtIdx: index("idx_predictions_created_at").on(table.createdAt),
      marketIdIdx: index("idx_predictions_market_id").on(table.marketId),
    }
  },
)

export const aiModels = pgTable(
  "ai_models",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    created: integer("created"),
    description: text("description"),
    architecture: jsonb("architecture"),
    topProvider: jsonb("top_provider"),
    pricing: jsonb("pricing"),
    canonicalSlug: text("canonical_slug"),
    contextLength: integer("context_length"),
    huggingFaceId: text("hugging_face_id"),
    perRequestLimits: jsonb("per_request_limits"),
    supportedParameters: jsonb("supported_parameters"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      nameIdx: index("idx_ai_models_name").on(table.name),
      contextLengthIdx: index("idx_ai_models_context_length").on(table.contextLength),
      canonicalSlugIdx: index("idx_ai_models_canonical_slug").on(table.canonicalSlug),
    }
  },
)

// Drizzle inferred types
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type Market = typeof markets.$inferSelect
export type NewMarket = typeof markets.$inferInsert
export type Prediction = typeof predictions.$inferSelect
export type NewPrediction = typeof predictions.$inferInsert
export type AIModel = typeof aiModels.$inferSelect
export type NewAIModel = typeof aiModels.$inferInsert
