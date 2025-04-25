
import { Auth0Client } from '@auth0/nextjs-auth0/server';

export type SupportedService = 'microsoft' | 'salesforce' | 'google';

interface ServiceConfig {
  connection: string;
  scope?: string;
}

const SERVICE_CONFIGS: Record<SupportedService, ServiceConfig> = {
  microsoft: { connection: 'windowslive' },
  salesforce: { connection: 'salesforce-dev' },
  google: { connection: 'google-oauth2' }
};

export const auth0 = new Auth0Client();

export async function getConnectedServices(): Promise<SupportedService[]> {
  const session = await auth0.getSession();
  return session?.user?.connected_services || [];
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
