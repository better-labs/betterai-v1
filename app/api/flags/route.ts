import { NextResponse } from 'next/server';
import { getDefinitions } from '@vercel/flags';
import { showMarketAlphaPage } from '@/lib/flags';

export async function GET() {
  const definitions = await getDefinitions([showMarketAlphaPage]);
  return NextResponse.json(definitions);
}

