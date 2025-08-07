
import { NextResponse } from 'next/server';
import { runDataPipeline } from '../../../lib/services/run-data-pipeline';

export async function POST(request: Request) {
  try {
    const { marketId, modelName } = await request.json();

    if (!marketId) {
      return NextResponse.json({ success: false, message: 'Market ID is required' }, { status: 400 });
    }

    const result = await runDataPipeline(marketId, modelName);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in run-data-pipeline API route:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
