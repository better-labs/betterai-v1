import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface CTASectionProps {
  title?: string
  description?: string
  primaryButtonText?: string
  primaryButtonHref?: string
  secondaryButtonText?: string
  secondaryButtonHref?: string
  className?: string
}

export function CTASection({
  title = "Ready to Get Started?",
  description = "Join thousands of users who are already making smarter predictions with AI-powered market intelligence.",
  primaryButtonText = "Explore Markets",
  primaryButtonHref = "/",
  secondaryButtonText = "Search Markets",
  secondaryButtonHref = "/search",
  className = ""
}: CTASectionProps) {
  return (
    <div className={`text-center bg-card border rounded-lg p-8 max-w-2xl mx-auto ${className}`}>
      <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
      <p className="text-muted-foreground mb-6">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href={primaryButtonHref}>
            {primaryButtonText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={secondaryButtonHref}>
            {secondaryButtonText}
          </Link>
        </Button>
      </div>
    </div>
  )
}
