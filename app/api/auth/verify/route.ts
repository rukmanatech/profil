import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/config/firebase-admin';

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    const cookieStore = await cookies();
    const sessionCookie = await cookieStore.get('session');

    if (!authorization?.startsWith('Bearer ') || !sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    return NextResponse.json({ 
      success: true,
      uid: decodedToken.uid 
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
} 