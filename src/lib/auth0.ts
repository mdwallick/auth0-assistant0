import { NextResponse } from 'next/server'
import { Auth0Client } from '@auth0/nextjs-auth0/server'
import type { SessionData } from '@auth0/nextjs-auth0/types'

export type SupportedService = 'microsoft' | 'salesforce' | 'google'

interface ServiceConfig {
  connection: string;
  scope?: string;
}

interface IdTokenClaims {
  connected_services?: { connection: Auth0Connection }[]
}

interface Auth0Session extends SessionData {
  user: {
    connected_services: SupportedService[]
  }
  idTokenClaims: IdTokenClaims
  // other session properties...
}

type Auth0Connection = 'windowslive' | 'google-oauth2' | 'salesforce-dev'

const AUTH0_TO_SERVICE_MAP: Record<Auth0Connection, SupportedService> = {
  'windowslive': 'microsoft',
  'google-oauth2': 'google',
  'salesforce-dev': 'salesforce'
}

const SERVICE_CONFIGS: Record<SupportedService, ServiceConfig> = {
  microsoft: { connection: 'windowslive' },
  salesforce: { connection: 'salesforce-dev' },
  google: { connection: 'google-oauth2' }
}

export const auth0 = new Auth0Client({
  // Required settings
  secret: process.env.AUTH0_SECRET,
  domain: process.env.AUTH0_ISSUER_BASE_URL,
  appBaseUrl: process.env.APP_BASE_URL,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,

  // Handle callback to modify session
  async onCallback(error, context, session: Auth0Session | null) {
    // If there's an error during the callback
    if (error) {
      return NextResponse.redirect(
        new URL(`/error?error=${error.message}`, process.env.APP_BASE_URL)
      );
    }

    // Handle the case where the session could be null
    if (!session) {
      throw new Error('Session cannot be null');
    }
    
    // Accessing the custom claim from the ID token (session.idTokenClaims)
    const connectedServices = session.idTokenClaims?.connected_services || []

    // Add the custom claim to the session's user object
    session.user.connected_services = connectedServices.map(cs => AUTH0_TO_SERVICE_MAP[cs.connection])


    // Redirect the user to the provided returnTo URL or default to the home page
    return NextResponse.redirect(
      new URL(context.returnTo || '/', process.env.APP_BASE_URL)
    )
  },
})

export async function getConnectedServices(): Promise<SupportedService[]> {
  const session = await auth0.getSession()
  if (!session) {
    throw new Error('Session not found')
  }

  const connectedServices = session.user?.connected_services || []
  const auth0Connections = connectedServices.map((cs) => cs.connection)

  return auth0Connections
    .map((connection) => AUTH0_TO_SERVICE_MAP[connection as Auth0Connection])
    .filter((service): service is SupportedService => service !== undefined)
}

export async function getAccessToken(service: SupportedService): Promise<string> {
  const config = SERVICE_CONFIGS[service]
  if (!config) {
    throw new Error(`Unsupported service: ${service}`)
  }

  const { token } = await auth0.getAccessTokenForConnection({
    connection: config.connection,
  })

  return token
}
