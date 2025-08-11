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
            .
          </p>
          <p className="text-xs text-muted-foreground/70">
            © 2025 BetterLabs
          </p>
        </div>
      </div>
    </footer>
  )
} 