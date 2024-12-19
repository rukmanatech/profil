import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const authorization = request.headers.get('Authorization');
  const sessionCookie = cookies().get('session');

  if (!authorization?.startsWith('Bearer ') || !sessionCookie?.value) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const idToken = authorization.split('Bearer ')[1];

  // Verifikasi bahwa token yang dikirim sama dengan yang ada di session
  if (idToken === sessionCookie.value) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
} 