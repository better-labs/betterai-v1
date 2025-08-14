import { HomePageWrapper } from "@/components/home-page-wrapper"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "BetterAI — Today’s Top Market Insights",
  description: "Invoke multiple LLMs with enriched datasets to analyze prediction markets. BetterAI by BetterLabs LLC is a research tool, not financial advice.",
}

export default async function HomePage() {
  return <HomePageWrapper />
}
