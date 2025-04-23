
import { type NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { serviceRegistry } from '@/lib/service-registry'
import type { SupportedService } from '@/lib/service-registry'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const connection = searchParams.get('connection')
    
    if (!connection) {
      return NextResponse.json({ error: 'Connection parameter required' }, { status: 400 })
    }

    // Map connection to service
    const serviceMap: Record<string, SupportedService> = {
      'windowslive': 'microsoft',
      'salesforce-dev': 'salesforce',
      'google-oauth2': 'google'
    }
    
    const service = serviceMap[connection]
    if (!service) {
      return NextResponse.json({ error: 'Invalid connection' }, { status: 400 })
    }

    const { url } = await auth0.startInteractiveLogin({
      authorizationParameters: {
        connection,
        redirectUri: `${process.env.APP_BASE_URL}/auth/callback`,
        scope: 'openid profile email offline_access',
      }
    })

    // Register the service
    serviceRegistry.registerService(service)

    return NextResponse.redirect(url)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
