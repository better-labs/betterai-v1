'use client'

import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function AiVsHumanAccuracyChart() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  // Generate time points (no specific labels)
  const timePoints = Array.from({length: 20}, () => '')
  
  // Human accuracy - flat line at 75%
  const humanAccuracy = Array(20).fill(75)
  
  // AI accuracy - S-curve that passes human at midpoint
  const aiAccuracy = timePoints.map((_, i) => {
    const x = (i - 10) / 3 // Center the sigmoid around midpoint
    const sigmoid = 100 / (1 + Math.exp(-x))
    return Math.round(sigmoid * 10) / 10
  })

  const data = {
    labels: timePoints,
    datasets: [
      {
        label: 'Human Accuracy',
        data: humanAccuracy,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 6
      },
      {
        label: 'AI Accuracy',
        data: aiAccuracy,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          font: {
            size: isMobile ? 12 : 14,
            weight: 'bold' as const
          },
          margin: isMobile ? 10 : 0,
          padding: isMobile ? 15 : 20,
          usePointStyle: true,
          pointStyle: 'circle' as const,
          boxWidth: isMobile ? 8 : 12,
          boxHeight: isMobile ? 8 : 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%'
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          font: {
            size: 16,
            weight: 'bold' as const
          },
          padding: 10
        },
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Accuracy',
          font: {
            size: isMobile ? 8 : 16,
            weight: 'bold' as const
          },
          padding: isMobile ? 8 : 10
        },
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          callback: function(value: any) {
            return value + '%'
          },
          font: {
            size: isMobile ? 10 : 12
          },
          padding: isMobile ? 5 : 8
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  }

  return (
    <div className={`w-full ${isMobile ? 'h-80' : 'h-96'}`} data-debug-id="ai-vs-human-chart">
      <Line data={data} options={options} />
    </div>
  )
}