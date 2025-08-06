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
    category: integer("category"), // Add category field
    volume: numeric("volume").default("0"),
    
    startDate: timestamp("start_date"), // Add startDate field
    endDate: timestamp("end_date"), // Add endDate field
    marketProvider: text("market_provider"), // Add marketProvider field
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      volumeIdx: index("idx_events_volume").on(table.volume),
      
      slugIdx: index("idx_events_slug").on(table.slug),
      startDateIdx: index("idx_events_start_date").on(table.startDate),
      endDateIdx: index("idx_events_end_date").on(table.endDate),
      categoryIdx: index("idx_events_category").on(table.category), // Add category index
    }
  },
)

export const markets = pgTable(
  "markets",
  {
    id: text("id").primaryKey(),
    question: text("question").notNull(),
    eventId: text("event_id").references(() => events.id),
    slug: text("slug"), // Add slug field
    outcomePrices: numeric("outcome_prices").array(),
    outcomes: text("outcomes").array(),
    volume: numeric("volume").default("0"),
    liquidity: numeric("liquidity").default("0"),
    category: text("category"),
    description: text("description"),
    active: boolean("active"),
    closed: boolean("closed"),
    startDate: timestamp("start_date"), // Add startDate field
    endDate: timestamp("end_date"), // Add endDate field
    resolutionSource: text("resolution_source"), // Add resolutionSource field
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      eventIdIdx: index("idx_markets_event_id").on(table.eventId),
      slugIdx: index("idx_markets_slug").on(table.slug),
      volumeIdx: index("idx_markets_volume").on(table.volume),
      startDateIdx: index("idx_markets_start_date").on(table.startDate),
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
    probability: numeric("probability"),
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

export const marketQueryCache = pgTable(
  "market_query_cache",
  {
    id: serial("id").primaryKey(),
    marketId: text("market_id").references(() => markets.id),
    modelName: text("model_name").notNull(),
    systemMessage: text("system_message"),
    userMessage: text("user_message").notNull(),
    response: jsonb("response"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      createdAtIdx: index("idx_market_query_cache_created_at").on(
        table.createdAt,
      ),
      marketIdIdx: index("idx_market_query_cache_market_id").on(
        table.marketId,
      ),
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
