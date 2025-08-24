
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/src/shared/providers/theme-provider"
import { Header } from "@/src/shared/layout/Header"
import { Footer } from "@/src/shared/layout/Footer"
import { PrivyClientProvider } from "@/src/shared/providers/PrivyClientProvider"
import { PostHogProvider } from "@/src/shared/providers/PostHogProvider"
import { AnalyticsIdentify } from "@/src/features/user/AnalyticsIdentify"
import { QueryProvider } from "@/src/shared/providers/query-provider"

export const metadata: Metadata = {
  title: "BetterAI - AI-Powered Market Predictions",
  description: "Leverage world-class AI models with enriched data to make smarter predictions on trending markets.",
  icons: {
    icon: [
      {
        url: "/favicon/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        url: "/favicon/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
  other: {
    "msapplication-TileColor": "#3B82F6",
    "theme-color": "#3B82F6",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PostHogProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <PrivyClientProvider>
                <AnalyticsIdentify />
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                </div>
              </PrivyClientProvider>
            </ThemeProvider>
          </QueryProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}