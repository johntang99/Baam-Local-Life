import { NextRequest, NextResponse } from 'next/server';
import { submitHelper2Feedback } from '@/app/[locale]/(public)/helper-2/actions';

export async function POST(req: NextRequest) {
  const { query, rating, meta } = await req.json();
  const result = await submitHelper2Feedback(query, rating, meta);
  return NextResponse.json(result);
}
