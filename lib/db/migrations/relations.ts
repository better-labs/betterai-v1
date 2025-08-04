import { relations } from "drizzle-orm/relations";
import { events, markets, predictions } from "./schema";

export const marketsRelations = relations(markets, ({one, many}) => ({
	event: one(events, {
		fields: [markets.eventId],
		references: [events.id]
	}),
	predictions: many(predictions),
}));

export const eventsRelations = relations(events, ({many}) => ({
	markets: many(markets),
}));

export const predictionsRelations = relations(predictions, ({one}) => ({
	market: one(markets, {
		fields: [predictions.marketId],
		references: [markets.id]
	}),
}));