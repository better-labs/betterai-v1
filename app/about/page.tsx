import { TrendingUp, Brain, Target, BarChart3, Zap, Shield, Users, Globe, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
            <TrendingUp className="text-primary" />
            About BetterAI
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            BetterAI is an AI-powered prediction platform that combines cutting-edge artificial intelligence 
            with real-time market data to help you make smarter decisions on trending markets and events.
          </p>
        </div>

        {/* What is BetterAI Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">What is BetterAI?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A revolutionary platform that democratizes AI-powered market intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* AI-Powered Analysis */}
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">
                Leverage multiple state-of-the-art AI models to analyze market trends, sentiment, and patterns 
                that human analysts might miss.
              </p>
            </div>

            {/* Real-Time Data */}
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Real-Time Data</h3>
              <p className="text-muted-foreground">
                Access live market data from multiple sources including Polymarket, ensuring your predictions 
                are based on the most current information available.
              </p>
            </div>

            {/* Confidence Scoring */}
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Confidence Scoring</h3>
              <p className="text-muted-foreground">
                Get detailed confidence scores and reasoning for every prediction, helping you understand 
                the AI's decision-making process.
              </p>
            </div>

            {/* Multiple AI Models */}
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Multiple AI Models</h3>
              <p className="text-muted-foreground">
                Choose from various AI models including GPT-4, Claude, and others to find the best fit 
                for your specific analysis needs.
              </p>
            </div>

            {/* Market Coverage */}
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Comprehensive Coverage</h3>
              <p className="text-muted-foreground">
                Analyze markets across politics, sports, entertainment, technology, and more - 
                from local events to global phenomena.
              </p>
            </div>

            {/* Secure & Reliable */}
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Secure & Reliable</h3>
              <p className="text-muted-foreground">
                Built with enterprise-grade security and reliability, ensuring your data and predictions 
                are protected and accurate.
              </p>
            </div>
          </div>
        </div>

        {/* How it Works Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How BetterAI Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our platform combines advanced AI with comprehensive market data in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">1. Select Your Market</h3>
              <p className="text-muted-foreground">
                Browse our curated selection of trending markets and events. From political elections 
                to sports championships, choose the markets that matter to you.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">2. Configure Your Analysis</h3>
              <p className="text-muted-foreground">
                Choose your preferred AI model and data sources. Our platform aggregates information 
                from multiple sources to provide comprehensive market intelligence.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">3. Get AI Insights</h3>
              <p className="text-muted-foreground">
                Receive detailed predictions with confidence scores, reasoning, and supporting data. 
                Understand not just what the AI predicts, but why.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Technology</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built with cutting-edge technology for maximum accuracy and reliability
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">AI Models</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• GPT-4 for advanced reasoning and analysis</li>
                <li>• Claude for nuanced market understanding</li>
                <li>• Specialized models for different market types</li>
                <li>• Continuous model updates and improvements</li>
              </ul>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Data Sources</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Real-time Polymarket data integration</li>
                <li>• News and social media sentiment analysis</li>
                <li>• Historical market performance data</li>
                <li>• Expert commentary and analysis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-card border rounded-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of users who are already making smarter predictions with AI-powered market intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/">
                Explore Markets
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/search">
                Search Markets
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
