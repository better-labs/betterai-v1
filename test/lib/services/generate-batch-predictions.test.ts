import { runBatchPredictionGeneration } from '@/lib/services/generate-batch-predictions'

describe('generate-batch-predictions', () => {
  describe('runBatchPredictionGeneration', () => {
    it('should run with real data and generate actual predictions', async () => {
      // Execute the function with default values against real data
      await runBatchPredictionGeneration()
      
      // The test passes if the function completes without throwing an error
      // This will generate real predictions in the database
    }, 30000) // 30 second timeout for real API calls
  })
}) 