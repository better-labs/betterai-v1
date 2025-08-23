import { prisma } from "../prisma"

// Experiment queries
export const experimentQueries = {
  /**
   * Get predictions with experiment tags for experiment reporting
   */
  getExperimentPredictions: async () => {
    return await prisma.prediction.findMany({
      where: {
        experimentTag: {
          not: null
        }
      },
      select: {
        experimentTag: true,
        experimentNotes: true,
        modelName: true,
        createdAt: true,
        predictionChecks: {
          select: {
            absDelta: true,
            marketClosed: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }
}