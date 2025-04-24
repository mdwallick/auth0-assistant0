
import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const { service } = params;
    let connection: string;
    
    switch (service) {
      case 'microsoft':
        connection = 'windowslive';
        break;
      case 'salesforce':
        connection = 'salesforce-dev';
        break;
      case 'google':
        connection = 'google-oauth2';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid service' },
          { status: 400 }
        );
    }

    return auth0.startInteractiveLogin({
      authorizationParameters: {
        connection,
        redirectUri: `${process.env.APP_BASE_URL}/api/auth/callback`,
      }
    });

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
