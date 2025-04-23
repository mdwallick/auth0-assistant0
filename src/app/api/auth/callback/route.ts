
import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(req: NextRequest) {
  const redirectUrl = await auth0.handleCallback(req);
  return Response.redirect(redirectUrl ?? '/');
}
