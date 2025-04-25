
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET() {
  const session = await auth0.getSession();
  console.log('Full Session:', session);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({
    ...session.user,
    id_token: session.tokenSet.idToken
  });
}
