import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

/**
 * ログアウト
 * POST /api/auth/logout
 */
export async function POST() {
  await deleteSession();
  return NextResponse.json({ success: true });
}
