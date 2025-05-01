import { Auth0Client } from '@auth0/nextjs-auth0/server'
import { getServiceFromConnection } from './services'
import { ReplDBSessionStore } from './repl-db-session-store'

import type { ConnectedService } from './services'

const sessionStore = new ReplDBSessionStore()

export const auth0 = new Auth0Client({
  secret: process.env.AUTH0_SECRET!,
  domain: process.env.AUTH0_ISSUER_BASE_URL!,
  appBaseUrl: process.env.APP_BASE_URL!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  authorizationParameters: {
    scope: process.env.AUTH0_SCOPES || "openid profile email offline_access",
    connection: process.env.AUTH0_CONNECTION_NAME || "Username-Password-Authentication",
  },

  sessionStore: {
    async get(id) {
      return await sessionStore.get(id)
    },
    async set(id, sessionData) {
      await sessionStore.set(id, sessionData)
    },
    async delete(id) {
      await sessionStore.delete(id)
    },
    // async deleteByLogoutToken({ sid, sub }: { sid: string; sub: string }) {
    //   // optional method to be implemented when using Back-Channel Logout
    // },
  },

  async beforeSessionSaved(session, idToken) {
    const decoded_jwt = decodeJwt(idToken)
    return {
      ...session,
      user: {
        ...session.user,
        connected_services: decoded_jwt?.connected_services || []
      },
    }
  },
})

export async function getConnectedServices(): Promise<ConnectedService[]> {
  const session = await auth0.getSession()
  if (!session) {
    throw new Error('Session not found')
  }

  const connectedServices = session.user?.connected_services || []
  return connectedServices
    .map((cs: ConnectedService) => getServiceFromConnection(cs.connection))
    .filter((service: ConnectedService) => service !== undefined)
}

// Cache object to store tokens with their expiry
const tokenCache: Record<string, { token: string; expiresAt: number }> = {}

export async function getAccessToken(service: string): Promise<string> {
  const now = Date.now()
  
  // Check cache first
  if (tokenCache[service] && tokenCache[service].expiresAt > now) {
    return tokenCache[service].token
  }

  try {
    const { token, expiresIn = 3600 } = await auth0.getAccessTokenForConnection({
      connection: service,
    })

    // Cache the token with expiry
    tokenCache[service] = {
      token,
      expiresAt: now + (expiresIn * 1000) - 300000 // Expire 5 minutes early
    }

    return token
  } catch (error: any) {
    if (error.code === 'user_not_found') {
      return '' // Return empty string for non-connected services
    }
    throw error
  }
}

function decodeJwt(token: string | null) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}
