import { pgTable, index, foreignKey, text, numeric, timestamp, boolean, serial, jsonb, integer, bigint } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const markets = pgTable("markets", {
	id: text().primaryKey().notNull(),
	question: text().notNull(),
	eventId: text("event_id"),
	outcomePrices: numeric("outcome_prices").array(),
	volume: numeric().default('0'),
	liquidity: numeric().default('0'),
	endDate: timestamp("end_date", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	category: text(),
	description: text(),
	active: boolean(),
	closed: boolean(),
}, (table) => [
	index("idx_markets_end_date").using("btree", table.endDate.asc().nullsLast().op("timestamp_ops")),
	index("idx_markets_event_id").using("btree", table.eventId.asc().nullsLast().op("text_ops")),
	index("idx_markets_volume").using("btree", table.volume.asc().nullsLast().op("numeric_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "markets_event_id_events_id_fk"
		}),
]);

export const predictions = pgTable("predictions", {
	id: serial().primaryKey().notNull(),
	marketId: text("market_id"),
	predictionResult: jsonb("prediction_result").notNull(),
	aiResponse: text("ai_response"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	modelName: text("model_name"),
	systemPrompt: text("system_prompt"),
	userMessage: text("user_message").notNull(),
}, (table) => [
	index("idx_predictions_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_predictions_market_id").using("btree", table.marketId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.marketId],
			foreignColumns: [markets.id],
			name: "predictions_market_id_markets_id_fk"
		}),
]);

export const aiModels = pgTable("ai_models", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	created: integer(),
	description: text(),
	architecture: jsonb(),
	topProvider: jsonb("top_provider"),
	pricing: jsonb(),
	canonicalSlug: text("canonical_slug"),
	contextLength: integer("context_length"),
	huggingFaceId: text("hugging_face_id"),
	perRequestLimits: jsonb("per_request_limits"),
	supportedParameters: jsonb("supported_parameters"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ai_models_canonical_slug").using("btree", table.canonicalSlug.asc().nullsLast().op("text_ops")),
	index("idx_ai_models_context_length").using("btree", table.contextLength.asc().nullsLast().op("int4_ops")),
	index("idx_ai_models_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const events = pgTable("events", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	slug: text(),
	icon: text(),
	tags: jsonb(),
	volume: numeric().default('0'),
	trendingRank: integer("trending_rank"),
	endDate: timestamp("end_date", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	marketProvider: text("market_provider"),
}, (table) => [
	index("idx_events_end_date").using("btree", table.endDate.asc().nullsLast().op("timestamp_ops")),
	index("idx_events_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_events_trending_rank").using("btree", table.trendingRank.asc().nullsLast().op("int4_ops")),
	index("idx_events_volume").using("btree", table.volume.asc().nullsLast().op("numeric_ops")),
]);

export const marketQueryCache = pgTable("market_query_cache", {
	id: serial().primaryKey().notNull(),
	marketId: text("market_id"),
	modelName: text("model_name").notNull(),
	systemMessage: text("system_message"),
	userMessage: text("user_message").notNull(),
	response: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_market_query_cache_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_market_query_cache_market_id").using("btree", table.marketId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.marketId],
			foreignColumns: [markets.id],
			name: "market_query_cache_market_id_markets_id_fk"
		}),
]);

export const drizzleMigrations = pgTable("__drizzle_migrations", {
	id: serial().primaryKey().notNull(),
	hash: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }),
});
