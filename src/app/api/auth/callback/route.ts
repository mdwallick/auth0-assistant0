
import { auth0 } from '@/lib/auth0';
import { NextRequest } from 'next/server';
import { serviceRegistry } from '@/lib/service-registry';

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const connection = searchParams.get('connection');
    
    const res = await auth0.callback({
      redirectUri: `${process.env.APP_BASE_URL}/auth/callback`
    });

    // Map connection to service and register if present
    if (connection) {
      const serviceMap: Record<string, any> = {
        'windowslive': 'microsoft',
        'salesforce-dev': 'salesforce',
        'google-oauth2': 'google'
      };
      
      const service = serviceMap[connection];
      if (service) {
        serviceRegistry.registerService(service);
      }
    }

    return res;
  } catch (error) {
    console.error('Callback error:', error);
    return Response.redirect('/auth/error');
  }
}
