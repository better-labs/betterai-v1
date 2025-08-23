/**
 * Example component demonstrating both design system and Tailwind custom spacing
 * This shows how to use the new custom spacing values directly in Tailwind classes
 */

import { spacing, layout, typography, components } from '@/lib/design-system';

export function TailwindDesignSystemExample() {
  return (
    <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero section using Tailwind custom spacing */}
      <section className="py-hero mb-section min-h-hero">
        <h1 className="text-4xl font-bold leading-tight mb-title">
          Welcome to BetterAI
        </h1>
        <p className="text-lg leading-relaxed">
          Your AI-powered prediction market companion
        </p>
      </section>

      {/* Content section with custom spacing */}
      <section className="mb-section min-h-section">
        <h2 className="text-3xl font-semibold leading-tight mb-heading">
          How It Works
        </h2>
        <div className="mb-content">
          <p className="text-base leading-relaxed">
            BetterAI integrates with Polymarket and AI models to provide enhanced market predictions.
          </p>
        </div>
        
        {/* Grid layout using design system + custom spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-lg shadow-sm p-card hover:shadow-md transition-shadow duration-200">
            <h3 className="text-2xl font-semibold leading-tight mb-4">AI Models</h3>
            <p className="text-base leading-relaxed">Access multiple AI models through OpenRouter</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg shadow-sm p-card hover:shadow-md transition-shadow duration-200">
            <h3 className="text-2xl font-semibold leading-tight mb-4">Market Data</h3>
            <p className="text-base leading-relaxed">Real-time data from Polymarket</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg shadow-sm p-card hover:shadow-md transition-shadow duration-200">
            <h3 className="text-2xl font-semibold leading-tight mb-4">Predictions</h3>
            <p className="text-base leading-relaxed">AI-generated market predictions</p>
          </div>
        </div>
      </section>

      {/* Section divider using custom spacing */}
      <div className="my-divider border-t border-border"></div>

      {/* Call-to-action with custom spacing */}
      <div className="mt-cta">
        <button className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 px-button py-2">
          Get Started
        </button>
      </div>

      {/* Content area with max-width constraints */}
      <div className="max-w-content mx-auto mt-content">
        <h3 className="text-2xl font-semibold leading-tight mb-heading">
          Narrow Content Area
        </h3>
        <p className="text-base leading-relaxed">
          This content is constrained to a narrower width for better readability.
        </p>
      </div>
    </div>
  );
}
