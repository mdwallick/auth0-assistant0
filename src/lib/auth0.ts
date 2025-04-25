
import { Auth0Client } from '@auth0/nextjs-auth0/server';

export type SupportedService = 'microsoft' | 'salesforce' | 'google';

interface ServiceConfig {
  connection: string;
  scope?: string;
}

type Auth0Connection = 'windowslive' | 'google-oauth2' | 'salesforce-dev';

const AUTH0_TO_SERVICE_MAP: Record<Auth0Connection, SupportedService> = {
  'windowslive': 'microsoft',
  'google-oauth2': 'google',
  'salesforce-dev': 'salesforce'
};

// const SERVICE_TO_AUTH0_MAP: Record<SupportedService, Auth0Connection> = {
//   'microsoft': 'windowslive',
//   'google': 'google-oauth2',
//   'salesforce': 'salesforce-dev'
// };

const SERVICE_CONFIGS: Record<SupportedService, ServiceConfig> = {
  microsoft: { connection: 'windowslive' },
  salesforce: { connection: 'salesforce-dev' },
  google: { connection: 'google-oauth2' }
};

// function mapAuth0ConnectionToService(connection: Auth0Connection): SupportedService {
//   return AUTH0_TO_SERVICE_MAP[connection];
// }

export const auth0 = new Auth0Client();

export async function getConnectedServices(): Promise<SupportedService[]> {
  const session = await auth0.getSession();
  if (!session?.tokenSet?.idToken) return [];

  try {
    // Decode ID token (it's a JWT)
    const parts = session.tokenSet.idToken.split('.');
    if (parts.length !== 3) return [];
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const connectedServices = payload.connected_services || [];
    console.log('Connected services from ID token:', connectedServices);
    
    const auth0Connections = connectedServices.map(cs => cs.connection);
    return auth0Connections
      .map(connection => AUTH0_TO_SERVICE_MAP[connection as Auth0Connection])
      .filter((service): service is SupportedService => service !== undefined);
  } catch (error) {
    console.error('Error parsing ID token:', error);
    return [];
  }
}

export async function getAccessToken(service: SupportedService): Promise<string> {
  const config = SERVICE_CONFIGS[service];
  if (!config) {
    throw new Error(`Unsupported service: ${service}`);
  }

  const { token } = await auth0.getAccessTokenForConnection({
    connection: config.connection,
  });

  return token;
}
