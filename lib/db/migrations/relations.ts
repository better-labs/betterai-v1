import { relations } from "drizzle-orm/relations";
import { markets, predictions, events } from "./schema";

export const predictionsRelations = relations(predictions, ({one}) => ({
	market: one(markets, {
		fields: [predictions.marketId],
		references: [markets.id]
	}),
}));

export const marketsRelations = relations(markets, ({one, many}) => ({
	predictions: many(predictions),
	event: one(events, {
		fields: [markets.eventId],
		references: [events.id]
	}),
}));

export const eventsRelations = relations(events, ({many}) => ({
	markets: many(markets),
}));