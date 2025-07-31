import { pgTable, index, foreignKey, serial, text, jsonb, timestamp, numeric, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const predictions = pgTable("predictions", {
	id: serial().primaryKey().notNull(),
	question: text().notNull(),
	predictionResult: jsonb("prediction_result").notNull(),
	aiResponse: text("ai_response"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	marketId: text("market_id"),
}, (table) => [
	index("idx_predictions_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_predictions_market_id").using("btree", table.marketId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.marketId],
			foreignColumns: [markets.id],
			name: "predictions_market_id_markets_id_fk"
		}),
]);

export const markets = pgTable("markets", {
	id: text().primaryKey().notNull(),
	question: text().notNull(),
	eventId: text("event_id"),
	outcomePrices: numeric("outcome_prices").array(),
	volume: numeric().default('0'),
	liquidity: numeric().default('0'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_markets_event_id").using("btree", table.eventId.asc().nullsLast().op("text_ops")),
	index("idx_markets_volume").using("btree", table.volume.asc().nullsLast().op("numeric_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "markets_event_id_events_id_fk"
		}),
]);

export const events = pgTable("events", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	volume: numeric().default('0'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	trendingRank: integer("trending_rank"),
	slug: text(),
	tags: jsonb(),
	icon: text(),
}, (table) => [
	index("idx_events_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_events_trending_rank").using("btree", table.trendingRank.asc().nullsLast().op("int4_ops")),
	index("idx_events_volume").using("btree", table.volume.asc().nullsLast().op("numeric_ops")),
]);
