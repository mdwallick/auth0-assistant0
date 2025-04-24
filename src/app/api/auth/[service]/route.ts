
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

    const response = await auth0.startInteractiveLogin({
      authorizationParameters: {
        connection,
        redirectUri: `${process.env.APP_BASE_URL}/api/auth/callback`,
      }
    });

    // Add HTML content to close the window after successful auth
    const successHtml = `
      <html>
        <head>
          <title>Authentication Complete</title>
        </head>
        <body>
          <div style="text-align: center; padding: 20px;">
            <h2>Authentication Successful!</h2>
            <p>You can close this window now.</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 1000);
          </script>
        </body>
      </html>
    `;

    return new Response(successHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
