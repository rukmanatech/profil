import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    await cookieStore.delete('session');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 