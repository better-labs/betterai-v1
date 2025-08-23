import { NextRequest, NextResponse } from 'next/server'
import { experimentQueries } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    // Get experiment summary with accuracy metrics
    const experiments = await experimentQueries.getExperimentPredictions()

    // Group by experiment tag and calculate stats
    const experimentStats = experiments.reduce((acc: any, pred: any) => {
      const tag = pred.experimentTag!
      if (!acc[tag]) {
        acc[tag] = {
          experimentTag: tag,
          experimentNotes: pred.experimentNotes,
          modelName: pred.modelName,
          totalPredictions: 0,
          checkedPredictions: 0,
          avgAccuracy: null,
          firstCreated: pred.createdAt,
          lastCreated: pred.createdAt,
        }
      }

      acc[tag].totalPredictions += 1
      
      // Update date range
      if (pred.createdAt < acc[tag].firstCreated) {
        acc[tag].firstCreated = pred.createdAt
      }
      if (pred.createdAt > acc[tag].lastCreated) {
        acc[tag].lastCreated = pred.createdAt
      }

      // Calculate accuracy from prediction checks
      if (pred.predictionChecks && pred.predictionChecks.length > 0) {
        const validChecks = pred.predictionChecks.filter((check: any) => 
          check.absDelta !== null && check.marketClosed === true
        )
        
        if (validChecks.length > 0) {
          acc[tag].checkedPredictions += 1
          const avgDelta = validChecks.reduce((sum: number, check: any) => 
            sum + parseFloat(check.absDelta.toString()), 0
          ) / validChecks.length
          
          // Accuracy = 100 - (avgDelta * 100) to convert delta to percentage accuracy
          const accuracy = Math.max(0, 100 - (avgDelta * 100))
          
          if (acc[tag].avgAccuracy === null) {
            acc[tag].avgAccuracy = accuracy
          } else {
            // Running average
            acc[tag].avgAccuracy = ((acc[tag].avgAccuracy * (acc[tag].checkedPredictions - 1)) + accuracy) / acc[tag].checkedPredictions
          }
        }
      }

      return acc
    }, {})

    const results = Object.values(experimentStats).sort((a: any, b: any) => 
      new Date(b.lastCreated).getTime() - new Date(a.lastCreated).getTime()
    )

    return NextResponse.json({
      success: true,
      experiments: results
    })
  } catch (error) {
    console.error('Error fetching experiments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch experiments' },
      { status: 500 }
    )
  }
}