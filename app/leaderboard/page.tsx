import { LeaderboardWrapper } from "@/components/client/leaderboard-wrapper"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Model Leaderboard — BetterAI",
  description: "Live rankings of AI models based on their prediction accuracy on resolved markets. Track which AI models are making the most accurate predictions.",
}

export default async function LeaderboardPage() {
  return <LeaderboardWrapper />
}