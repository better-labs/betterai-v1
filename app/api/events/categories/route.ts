import { NextResponse } from 'next/server'
import { getCategoryStats } from '@/lib/data/events'

export async function GET() {
  try {
    const categoryStats = await getCategoryStats()
    
    return NextResponse.json({
      success: true,
      data: categoryStats
    })
  } catch (error) {
    console.error('Error fetching category stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 