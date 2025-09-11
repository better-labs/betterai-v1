'use client'

import { components } from '@/lib/design-system'

interface StatItem {
  label: string
  value: number | null
  // Optional color override for progress bar
  progressColor?: string
}

interface StatsDisplaySectionProps {
  title: string
  stats: StatItem[]
  // Optional custom formatting function for values
  formatValue?: (value: number | null) => string
  // Show/hide progress bars
  showProgressBars?: boolean
  className?: string
}

export function StatsDisplaySection({
  title,
  stats,
  formatValue = (value) => value !== null ? `${Math.round(value * 100)}%` : '--',
  showProgressBars = true,
 
}: StatsDisplaySectionProps) {
  if (!stats || stats.length === 0) {
    return null
  }

  return (
    <div className={`${components.statsDisplay.container} `}>
      <h4 className={components.statsDisplay.sectionTitle}>{title}</h4>
      <div className={components.statsDisplay.statSpacing}>
        {stats.map((stat, index) => {
          const percentage = stat.value ? Math.round(stat.value * 100) : 0
          
          return (
            <div key={index} className={components.statsDisplay.statRow}>
              <span className={components.statsDisplay.statLabel}>{stat.label}</span>
              <div className={components.statsDisplay.statValue}>
                <span className={components.statsDisplay.valueText}>
                  {formatValue(stat.value)}
                </span>
                {showProgressBars && (
                  <div className={components.statsDisplay.progressContainer}>
                    <div 
                      className={components.statsDisplay.progressFill}
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: stat.progressColor || undefined
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface SingleStatDisplaySectionProps {
  title: string
  label: string
  value: number | null
  formatValue?: (value: number | null) => string
  className?: string
}

export function SingleStatDisplaySection({
  title,
  value,
  formatValue = (value: number | null) => value !== null ? `${Math.round(value * 100)}%` : '--',
  className = ''
}: SingleStatDisplaySectionProps) {
  return (
    <div className={`${components.statsDisplay.container} ${className}`}>
      <h4 className={components.statsDisplay.sectionTitle}>{title}</h4>
      <div className={components.statsDisplay.statSpacing}>
        <div className={components.statsDisplay.statRow}>
          <div className={components.statsDisplay.statValue}>
            <span className="text-3xl font-semibold">
              {formatValue(value)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

