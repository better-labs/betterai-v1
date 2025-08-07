import { EventTable } from "@/components/event-table"
import { TrendingUp, Menu, Target, Brain, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-16" data-section="hero">
            <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
              <TrendingUp className="text-primary" />
              AI-Powered Market Intelligence
            </h1>
          <p className="text-muted-foreground text-lg mx-auto">
            Leverage world-class AI models with enriched data to make smarter predictions on trending markets
          </p>
        </div>

        {/* How it Works Section */}
        <div className="mb-20" data-section="how-it-works">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How it Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get AI-powered market insights in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">1. Select a Market</h3>
              <p className="text-muted-foreground">
                Choose from trending markets and events that matter to you
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">2. Choose Your AI & Data</h3>
              <p className="text-muted-foreground">
                Select from multiple AI models and data sources to customize your analysis
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">3. Get Your Analysis</h3>
              <p className="text-muted-foreground">
                Receive detailed predictions with confidence scores and reasoning
              </p>
            </div>
          </div>
        </div>
{/* <div className="mt-16">
          <EventTable />
        </div> */}
        
      </main>
    </div>
  )
}
