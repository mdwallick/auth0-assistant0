
import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const connection = searchParams.get('connection');

  return auth0.startInteractiveLogin({
    authorizationParameters: {
      connection,
      redirectUri: `${process.env.APP_BASE_URL}/api/auth/callback`,
      scope: 'openid profile email offline_access',
    },
  });
}
