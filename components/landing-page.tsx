"use client"

import { TrendingUp, Shield, Mail, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import AiVsHumanAccuracyChart from "@/components/ai-vs-human-accuracy-chart"

export function LandingPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleBetaSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    try {
      // TODO: Implement actual beta signup logic
      // For now, just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSubmitted(true)
    } catch (error) {
      console.error("Beta signup error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
            <TrendingUp className="text-primary" />
            What is BetterAI?
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            
          </p>
        </div>

        {/* Better Definition 1 */}
        <div className="mb-20" data-testid="better-definition-1">
          <div className="text-center mb-12">
            <h2 className="mb-4 flex items-baseline justify-center text-foreground">
              <span className="text-sm sm:text-base font-medium mr-2">[bet-er]¹ (noun)</span>
              <span className="text-3xl sm:text-4xl font-bold">a person who bets on an outcome</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A platform that democratizes access to the best in class AI powered predictions. BetterAI combines cutting-edge AI with real-time market data to help users make more informed decisions on prediction market outcomes.</p>
          </div>

          
        </div>
          <div className="border-t border-border/40 my-12 max-w-4xl mx-auto" />


        <div className="mb-20" data-testid="better-definition-2">
          <div className="text-center mb-12">
            <h2 className="mb-4 flex items-baseline justify-center text-foreground">
              <span className="text-sm sm:text-base font-medium mr-2">[bet-er]<sup>2</sup> (adjective)</span>
              <span className="text-3xl sm:text-4xl font-bold">improved in accuracy or performance</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              <a href="https://hai.stanford.edu/ai-index/2025-ai-index-report" className="hover:underline">Leading AI models are close to beating our most difficult benchmarks. The world needs better, infinitely difficult benchmarks, to properly measure the AI model's intelligence growth beyond super intelligence.</a>
            </p>
          </div>
          <div className="max-w-5xl mx-auto rounded-lg border bg-card p-4 shadow-sm">
          
          </div>
        </div>

        {/* Beta Signup Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Join the Beta</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Be among the first to experience the future of AI-powered predictions. Sign up for early access to our public beta.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {!isSubmitted ? (
              <form onSubmit={handleBetaSignup} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing up..." : "Sign up for Beta Access"}
                </Button>
              </form>
            ) : (
              <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-green-800 mb-1">Thank you for signing up!</h3>
                <p className="text-green-700">
                  We'll notify you when the beta is ready. Stay tuned for updates!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Legal Disclaimer */}
        <section className="max-w-3xl mx-auto text-center text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-4 w-4" />
            <span>Important information</span>
          </div>
          <p>
            BetterAI is provided by BetterLabs LLC as a research and analysis tool. It does not offer financial, investment, legal, or tax advice, and it does not recommend or endorse any trades. Use at your own risk. Markets are volatile and you can lose money. By using BetterAI, you agree to our Terms and acknowledge our Privacy Policy.
          </p>
        </section>
      </main>
    </div>
  )
}
