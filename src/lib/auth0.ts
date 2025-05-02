import { Auth0Client } from '@auth0/nextjs-auth0/server'
import { ReplDBSessionStore } from './repl-db-session-store'

const sessionStore = new ReplDBSessionStore()

export type ConnectedService = {
  name: string
  provider: string
  user_id: string
  connection: string
  isSocial: boolean
}

export const SUPPORTED_SERVICES = {
  'microsoft': {
    connection: 'windowslive',
    displayName: 'Microsoft'
  },
  'salesforce': {
    connection: 'salesforce-dev',
    displayName: 'Salesforce'
  },
  'google': {
    connection: 'google-oauth2',
    displayName: 'Google'
  }
}

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
        identities: decoded_jwt?.identities || []
      },
    }
  },
})

// Get the refresh token from Auth0 session
export const getRefreshToken = async () => {
  const session = await auth0.getSession()
  return session?.tokenSet?.refreshToken
}

// export async function getAccessToken(connection: string): Promise<string> {
//   try {
//     const token = await auth0.getAccessTokenForConnection({
//       connection: connection,
//     })
//     return token.token
//   } catch (error: any) {
//       // Return empty string for non-connected services
//     return ''
//   }
// }

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
