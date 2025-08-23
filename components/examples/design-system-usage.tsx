/**
 * Example component demonstrating design system usage
 * This shows how to import and use the centralized design tokens
 */

import { spacing, layout, typography, components } from '@/lib/design-system';

export function DesignSystemExample() {
  return (
    <div className={layout.page.container}>
      {/* Hero section using design system spacing */}
      <section className={spacing.hero}>
        <h1 className={typography.h1}>
          Welcome to BetterAI
        </h1>
        <p className={typography.bodyLarge}>
          Your AI-powered prediction market companion
        </p>
      </section>

      {/* Content section with consistent spacing */}
      <section className={spacing.section}>
        <h2 className={typography.h2}>
          How It Works
        </h2>
        <div className={spacing.content}>
          <p className={typography.body}>
            BetterAI integrates with Polymarket and AI models to provide enhanced market predictions.
          </p>
        </div>
        
        {/* Grid layout using design system */}
        <div className={`${layout.grid.cols['3']} ${layout.grid.gap.lg}`}>
          <div className={components.card.base}>
            <div className={components.card.padding}>
              <h3 className={typography.h3}>AI Models</h3>
              <p className={typography.body}>Access multiple AI models through OpenRouter</p>
            </div>
          </div>
          
          <div className={components.card.base}>
            <div className={components.card.padding}>
              <h3 className={typography.h3}>Market Data</h3>
              <p className={typography.body}>Real-time data from Polymarket</p>
            </div>
          </div>
          
          <div className={components.card.base}>
            <div className={components.card.padding}>
              <h3 className={typography.h3}>Predictions</h3>
              <p className={typography.body}>AI-generated market predictions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-action with consistent spacing */}
      <div className={spacing.cta}>
        <button className={`${components.button.base} ${components.button.size.md}`}>
          Get Started
        </button>
      </div>
    </div>
  );
}
