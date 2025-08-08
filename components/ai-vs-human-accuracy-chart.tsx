"use client"

import React, { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

type DataPoint = {
  name: string
  aiModelAccuracy: number
  humanAccuracy: number
}

type CustomDotProps = {
  cx?: number | null
  cy?: number | null
  stroke?: string
}

type LabelViewBox = { x: number; y: number; width: number; height: number }

// Custom dot for the AI accuracy line to add a glowing effect
function GlowingDot(props: CustomDotProps) {
  const { cx, cy, stroke = "#4299e1" } = props
  if (cx == null || cy == null) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={stroke} fillOpacity={0.2} />
      <circle cx={cx} cy={cy} r={4} fill={stroke} />
    </g>
  )
}

// Custom label for the reference line
function HumanLevelLabel({ viewBox }: { viewBox?: LabelViewBox }) {
  if (!viewBox) return null
  const { x, y, width } = viewBox
  return (
    <g>
      <text x={x + width / 2} y={y - 10} fill="#9CA3AF" textAnchor="middle" dominantBaseline="middle">
        <tspan fontSize="12" fontWeight="bold">
          Human-Level Accuracy
        </tspan>
      </text>
    </g>
  )
}

export default function AiVsHumanAccuracyChart() {
  const [chartData, setChartData] = useState<DataPoint[]>([])

  // Full dataset we will animate towards
  const fullData: DataPoint[] = [
    { name: "Now", aiModelAccuracy: 75, humanAccuracy: 88 },
    { name: "", aiModelAccuracy: 80, humanAccuracy: 89 },
    { name: "", aiModelAccuracy: 86, humanAccuracy: 88 },
    { name: "", aiModelAccuracy: 92, humanAccuracy: 89 }, // AI surpasses human accuracy here
    { name: "", aiModelAccuracy: 95, humanAccuracy: 88 },
    { name: "", aiModelAccuracy: 97, humanAccuracy: 89 },
    { name: "Future", aiModelAccuracy: 99.6, humanAccuracy: 88 },
  ]

  // Animate the chart on mount
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < fullData.length) {
        setChartData((prev) => [...prev, fullData[i]])
        i += 1
      } else {
        clearInterval(interval)
      }
    }, 350)
    return () => clearInterval(interval)
  }, [])

  const axisColor = "#9CA3AF" // gray-400
  const gridColor = "#E5E7EB" // gray-200

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-foreground">Human vs AI Accuracy</h3>
        <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
          Human accuracy in prediction markets is stable, while AI models are on a parth accelerate and surpass it.
        </p>
      </div>
      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 12, bottom: 24 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="name"
              stroke={axisColor}
              tick={{ fill: axisColor }}
              interval={0}
            />
            <YAxis
              stroke={axisColor}
              tick={{ fill: axisColor }}
              domain={[70, 100]}
              label={{ value: "Accuracy (%)", angle: -90, position: "insideLeft", fill: axisColor, dy: 40 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.8)", borderColor: "#4B5563", backdropFilter: "blur(4px)" }}
              labelStyle={{ color: "#E5E7EB" }}
              formatter={(value: unknown, name: string, props: any) => {
                return [`${value as number}%`, name]
              }}
            />
            <Legend wrapperStyle={{ color: "#111827", paddingTop: 12 }} />

            {/* Reference Line for Human-Level Accuracy */}
            <ReferenceLine y={88.5} stroke="#F87171" strokeDasharray="4 4" strokeWidth={2} label={<HumanLevelLabel />} />

            {/* Human Accuracy */}
            <Line
              type="monotone"
              dataKey="humanAccuracy"
              name="Human Accuracy"
              stroke="#22C55E"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
               isAnimationActive
               animationDuration={500}
               animationEasing="ease-in-out"
            />

            {/* AI Model Accuracy */}
            <Line
              type="monotone"
              dataKey="aiModelAccuracy"
              name="AI Model Accuracy"
              stroke="#3B82F6"
              strokeWidth={3}
              activeDot={{ r: 8 }}
              dot={<GlowingDot />}
               isAnimationActive
               animationDuration={500}
               animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


