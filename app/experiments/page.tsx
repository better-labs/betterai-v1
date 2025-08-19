'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ExperimentStat {
  experimentTag: string
  experimentNotes: string | null
  modelName: string | null
  totalPredictions: number
  checkedPredictions: number
  avgAccuracy: number | null
  firstCreated: string
  lastCreated: string
}

interface ApiResponse {
  success: boolean
  experiments: ExperimentStat[]
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<ExperimentStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExperiments()
  }, [])

  const fetchExperiments = async () => {
    try {
      const response = await fetch('/api/experiments')
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setExperiments(data.experiments)
      } else {
        setError('Failed to fetch experiments')
      }
    } catch (err) {
      setError('Network error fetching experiments')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAccuracy = (accuracy: number | null) => {
    if (accuracy === null) return 'N/A'
    return `${accuracy.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">🧪 Prediction Experiments</h1>
        <div>Loading experiments...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">🧪 Prediction Experiments</h1>
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">🧪 Prediction Experiments</h1>
      
      {experiments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No experiments found. Run the batch prediction script with --experiment-tag to create your first experiment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {experiments.map((exp, index) => (
            <Card key={index} className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">
                    {exp.experimentTag}
                  </CardTitle>
                  <div className="flex gap-2">
                    {exp.modelName && (
                      <Badge variant="outline">{exp.modelName}</Badge>
                    )}
                    <Badge variant="secondary">
                      {exp.totalPredictions} predictions
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Accuracy</div>
                    <div className="text-2xl font-bold">
                      {formatAccuracy(exp.avgAccuracy)}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({exp.checkedPredictions} checked)
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Total Predictions</div>
                    <div className="text-2xl font-bold">{exp.totalPredictions}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Started</div>
                    <div className="text-lg">{formatDate(exp.firstCreated)}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Last Activity</div>
                    <div className="text-lg">{formatDate(exp.lastCreated)}</div>
                  </div>
                </div>
                
                {exp.experimentNotes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">Notes</div>
                    <div className="text-sm">{exp.experimentNotes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}