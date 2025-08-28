import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        // Design system spacing values
        'section': '6rem',      // 96px - major section spacing
        'content': '3rem',      // 48px - content block spacing
        'hero': '4rem',         // 64px - hero section padding
        'divider': '4rem',      // 64px - section divider spacing
        'title': '1.5rem',      // 24px - title bottom margin
        'heading': '1.5rem',    // 24px - heading bottom margin
        'cta': '2rem',          // 32px - call-to-action top margin
        'card': '1.5rem',       // 24px - card padding
        'button': '1rem',       // 16px - button horizontal padding
        'input': '0.75rem',     // 12px - input horizontal padding
      },
      maxWidth: {
        'page': '80rem',        // 1280px - page container max width
        'content': '64rem',     // 1024px - content area max width
        'narrow': '48rem',      // 768px - narrow content area
      },
      minHeight: {
        'hero': '32rem',        // 512px - minimum hero section height
        'section': '16rem',     // 256px - minimum section height
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
            'h1': {
              textDecoration: 'none',
            },
            'h2': {
              textDecoration: 'none',
            },
            'h3': {
              textDecoration: 'none',
            },
            'h4': {
              textDecoration: 'none',
            },
            'h5': {
              textDecoration: 'none',
            },
            'h6': {
              textDecoration: 'none',
            },
          },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography")
  ],
} satisfies Config

export default config
