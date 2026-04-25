import { NextRequest, NextResponse } from 'next/server';
import { askHelper2 } from '@/app/[locale]/(public)/helper-2/actions';

export async function POST(req: NextRequest) {
  const { query, history } = await req.json();
  const result = await askHelper2(query, history || []);
  return NextResponse.json(result);
}
