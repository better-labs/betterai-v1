"use client"

import { TrendingUp, Shield } from "lucide-react"
import { AIvsHumanAccuracyChart } from "@/src/features/landing/AIvsHumanAccuracyChart"
import { BetaSignupForm } from "@/src/features/landing/BetaSignupForm"
import { PageTransition } from "@/src/shared/layout/PageTransition"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <PageTransition>
       
       
        {/* Hero Section */}
        <section className="text-center py-16 mb-24">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 flex items-center justify-center gap-2">
            <TrendingUp className="text-primary" />
            What is BetterAI?
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            World-class AI predictions for prediction markets
          </p>
        </section>

        {/* Better Definition 1 */}
        <section className="mb-24" data-testid="better-definition-1">
          <div className="text-center mb-12">
            <h2 className="mb-6 flex items-baseline justify-center text-foreground">
              <span className="text-sm sm:text-base font-medium mr-2">[bet-er]¹ (noun)</span>
              <span className="text-3xl sm:text-4xl font-bold">a person who bets on an outcome</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A platform that democratizes access to the best in class AI powered predictions. BetterAI combines cutting-edge AI with real-time market data to help users make more informed decisions on prediction market outcomes.</p>
            <div className="mt-8">
              <a 
                href="/leaderboard" 
                className="text-primary hover:text-primary/80 underline text-sm font-medium"
              >
                View AI model performance leaderboard →
              </a>
            </div>
          </div>
        </section>

        <section className="mb-24" data-testid="better-definition-2">
          <div className="text-center mb-12">
            <h2 className="mb-6 flex items-baseline justify-center text-foreground">
              <span className="text-sm sm:text-base font-medium mr-2">[bet-er]<sup>2</sup> (adjective)</span>
              <span className="text-3xl sm:text-4xl font-bold">improved in accuracy or performance</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              <a href="https://hai.stanford.edu/ai-index/2025-ai-index-report" className="hover:underline">Leading AI models are close to beating our most difficult benchmarks. The world needs better, infinitely difficult benchmarks, to properly measure the AI model's intelligence growth beyond super intelligence.</a>
            </p>
          </div>
        </section>
        
        <div className="border-t border-border/40 my-16 max-w-4xl mx-auto" />
        
        {/* Bottom Beta Signup Section */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">Get Early Access</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Sign up now for early access to BetterAI.  Our public beta will be available soon.
            </p>
          </div>

          <BetaSignupForm variant="default" />
        </section>
        </PageTransition>
       
      </main>
    </div>
  )
}
