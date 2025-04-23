
import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'

export async function POST(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    let connection: string
    switch (params.service) {
      case 'microsoft':
        connection = 'windowslive'
        break
      case 'salesforce':
        connection = 'salesforce-dev'
        break
      case 'google':
        connection = 'google-oauth2'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid service' },
          { status: 400 }
        )
    }

    const { location } = await auth0.getAuthorizationUrlForConnection({
      connection,
      redirectUri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
    })

    return NextResponse.json({ authUrl: location })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
