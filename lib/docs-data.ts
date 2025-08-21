// Client-side docs data - this will be populated by server components
export interface DocNavItem {
  title: string
  slug: string
  order: number
  section: string
}

// Static docs navigation data
export const docsNavigation: DocNavItem[] = [
  // Overview section
  {
    title: "What is BetterAI?",
    slug: "overview/what-is-betterai",
    order: 1,
    section: "overview"
  },
  {
    title: "What are Prediction Markets?",
    slug: "overview/prediction-markets",
    order: 2,
    section: "overview"
  },
  {
    title: "How It Works",
    slug: "overview/how-it-works",
    order: 3,
    section: "overview"
  },
  
  // Guides section
  {
    title: "Getting Started",
    slug: "guides/getting-started",
    order: 1,
    section: "guides"
  },
  {
    title: "Using AI Predictions Effectively",
    slug: "guides/using-predictions",
    order: 2,
    section: "guides"
  },
  
  // Legal section
  {
    title: "Terms of Service",
    slug: "legal/terms-of-service",
    order: 1,
    section: "legal"
  },
  {
    title: "Privacy Policy",
    slug: "legal/privacy-policy",
    order: 2,
    section: "legal"
  },
  
  // Changelog
  {
    title: "Changelog",
    slug: "changelog",
    order: 1,
    section: "root"
  },

  // Contact
  {
    title: "Contact Us",
    slug: "contact",
    order: 1,
    section: "contact"
  }
]