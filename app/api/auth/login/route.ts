import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authorization.split('Bearer ')[1];
    const cookieStore = await cookies();
    
    await cookieStore.set('session', idToken, {
      maxAge: 60 * 60 * 24 * 5, // 5 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting session:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 