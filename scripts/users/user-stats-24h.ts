import { config } from 'dotenv';
import { PrismaClient } from '../../lib/generated/prisma';

// Load environment variables
config({ path: '.env.local' });

async function getUserStats24Hours() {
  const prisma = new PrismaClient();
  
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get all predictions from the last 24 hours
    const predictions = await prisma.prediction.findMany({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      select: {
        userId: true
      }
    });
    
    // Count predictions per user
    const userPredictionCounts = predictions.reduce((acc, pred) => {
      if (pred.userId) {
        acc[pred.userId] = (acc[pred.userId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const totalUsers = Object.keys(userPredictionCounts).length;
    const totalPredictions = predictions.length;
    const predictionCounts = Object.values(userPredictionCounts);
    
    console.log('\n📊 User Statistics (Past 24 Hours)');
    console.log('═══════════════════════════════════');
    console.log(`Total users who created predictions: ${totalUsers}`);
    console.log(`Total predictions created: ${totalPredictions}`);
    
    if (totalUsers > 0) {
      const avgPredictions = (totalPredictions / totalUsers).toFixed(2);
      const maxPredictions = Math.max(...predictionCounts);
      const minPredictions = Math.min(...predictionCounts);
      
      console.log(`Average predictions per user: ${avgPredictions}`);
      console.log(`Max predictions by single user: ${maxPredictions}`);
      console.log(`Min predictions by user: ${minPredictions}`);
      
      console.log('\n📈 Detailed User Breakdown:');
      console.log('User ID                              | Predictions');
      console.log('-------------------------------------|------------');
      
      Object.entries(userPredictionCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([userId, count]) => {
          console.log(`${userId.padEnd(36)} | ${count}`);
        });
    } else {
      console.log('No predictions found in the past 24 hours.');
    }
    
  } catch (error) {
    console.error('Error fetching user statistics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getUserStats24Hours();