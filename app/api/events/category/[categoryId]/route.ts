import { NextRequest, NextResponse } from 'next/server'
import { getEventsByCategoryWithMarkets } from '@/lib/data/events'
import { CATEGORIES } from '@/lib/categorize'

export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const categoryId = parseInt(params.categoryId)
    
    // Validate category ID
    if (!CATEGORIES[categoryId as keyof typeof CATEGORIES]) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }

    const events = await getEventsByCategoryWithMarkets(categoryId)
    
    return NextResponse.json({
      success: true,
      data: {
        categoryId,
        categoryName: CATEGORIES[categoryId as keyof typeof CATEGORIES],
        events
      }
    })
  } catch (error) {
    console.error('Error fetching events by category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 