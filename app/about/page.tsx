import { TrendingUp, Brain, BarChart3, Zap } from "lucide-react"
import AiVsHumanAccuracyChart from "@/components/ai-vs-human-accuracy-chart"
import { components } from "@/lib/design-system"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className={components.page.section}>
        {/* Hero Section */}
        <section className="text-center py-16 mb-24">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 flex items-center justify-center gap-2">
            <TrendingUp className="text-primary" />
            What is BetterAI?
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Democratizing access to world-class AI predictions for everyone
          </p>
        </section>

        {/* Better Definition 1 */}
        <section className="mb-24" data-testid="better-definition-1">
          <div className="text-center mb-12">
            <h2 className="mb-4 flex items-baseline justify-center text-foreground">
              <span className="text-sm sm:text-base font-medium mr-2">[bet-er]¹ (noun)</span>
              <span className="text-3xl sm:text-4xl font-bold">a person who bets on an outcome</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A platform that democratizes access to the best in class AI powered predictions. BetterAI combines cutting-edge AI with real-time market data to help users make more informed decisions on prediction market outcomes.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              {
                key: "analysis",
                Icon: Brain,
                title: "AI-Powered Analysis",
                body:
                  "Leverage multiple state-of-the-art AI models from OpenAI, Google, xAI, Anthropic, and more to find outcomes that h might miss.",
              },
              {
                key: "realtime",
                Icon: Zap,
                title: "Real-Time Data",
                body:
                  "Access live market data from multiple sources including Polymarket, ensuring your predictions are based on the most current information available.",
              },
              {
                key: "confidence",
                Icon: BarChart3,
                title: "Confidence Scoring",
                body:
                  "Get detailed confidence scores and reasoning for every prediction, helping you understand the AI's decision-making process.",
              },
            ].map(({ key, Icon, title, body }, index) => (
              <div
                key={key}
                className="bg-card border rounded-md p-4 shadow-sm opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
        
        <div className="border-t border-border/40 my-16 max-w-4xl mx-auto" />


        <section className="mb-24" data-testid="better-definition-2">
          <div className="text-center mb-12">
            <h2 className="mb-6 flex items-baseline justify-center text-foreground">
              <span className="text-sm sm:text-base font-medium mr-2">[bet-er]<sup>2</sup> (adjective)</span>
              <span className="text-3xl sm:text-4xl font-bold">improved in accuracy or performance</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              <a href="https://hai.stanford.edu/ai-index/2025-ai-index-report" className="hover:underline">Leading AI models are close to beating our most difficult benchmarks. The world needs better, infinitely difficult benchmarks, to properly measure the AI model&apos;s intelligence growth beyond super intelligence.</a>
            </p>
          </div>
          <div className="max-w-5xl mx-auto rounded-lg border bg-card p-6 shadow-sm">
            <AiVsHumanAccuracyChart />
          </div>
        </section>


      </section>
      
    </div>
  )
}
