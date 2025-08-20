import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-blur]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-muted-foreground">
          <p className="mb-2">
            All content is for informational and educational purposes only and is not financial advice. You are solely responsible for your own decisions. 
            <br></br> 
            By using this site, you agree to our{" "}
            <Link href="/tos" className="underline hover:text-foreground transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            . Follow us on{" "}
            <Link href="https://x.com/HelloBetterAI" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
              X (Twitter)
            </Link>
            .
          </p>
          <p className="text-xs text-muted-foreground/70">
             © {new Date().getFullYear()} BetterLabs LLC
          </p>
        </div>
      </div>
    </footer>
  )
} 