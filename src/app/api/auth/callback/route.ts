
import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { serviceRegistry } from '@/lib/service-registry';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    // Complete the authentication flow
    await auth0.handleCallback(request);

    // Extract service from state parameter (you may need to modify this based on your state format)
    const service = state.split('_')[0];
    
    if (service) {
      // Register the service
      await serviceRegistry.registerService(service);
    }

    // Return HTML that closes the popup and sends a message to the parent window
    const successHtml = `
      <html>
        <head>
          <title>Authentication Complete</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'AUTH_COMPLETE', service: '${service}' }, '*');
              window.close();
            }
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
    console.error('Callback error:', error);
    
    // Return HTML that shows error and closes the popup
    const errorHtml = `
      <html>
        <head>
          <title>Authentication Failed</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'AUTH_ERROR', error: 'Authentication failed' }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `;

    return new Response(errorHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}
