
import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { serviceRegistry, type SupportedService } from '@/lib/service-registry';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    console.log('Callback received with state:', state);
    
    // Complete the authentication flow
    await auth0.handleCallback(request, {
      redirectUri: `${process.env.APP_BASE_URL}/api/auth/callback`
    });

    if (!state) {
      throw new Error('No state parameter received');
    }

    const service = state as SupportedService;
    console.log('Processing service:', service);
    
    if (service) {
      // Register the service
      serviceRegistry.registerService(service);
      console.log(`Registered service: ${service}`);
      console.log('Current active services:', serviceRegistry.getActiveServices());
    }

    // Return HTML that closes the popup and sends a message to the parent window
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Complete</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f9fafb;
            }
            .message {
              text-align: center;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="message">
            <h3>Authentication Successful!</h3>
            <p>This window will close automatically...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'AUTH_COMPLETE', service: '${service}' }, '*');
              setTimeout(() => window.close(), 1000);
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
