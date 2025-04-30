
export interface ConnectedService {
  connection: string;
  isSocial: boolean;
  provider: string;
  user_id: string;
}

export interface SupportedService {
  connection: string;
  isSocial: boolean; 
  provider: string;
  scope: string;
}

export const SUPPORTED_SERVICES: Record<string, SupportedService> = {
  microsoft: {
    connection: 'windowslive',
    isSocial: true,
    provider: 'microsoft',
    scope: 'offline_access files.readwrite.all mail.readwrite calendars.readwrite'
  },
  google: {
    connection: 'google-oauth2',
    isSocial: true,
    provider: 'google',
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar'
  },
  salesforce: {
    connection: 'salesforce-dev',
    isSocial: false,
    provider: 'oidc',
    scope: 'api refresh_token'
  }
} as const;

export function getServiceFromConnection(connection: string): string | undefined {
  const entry = Object.entries(SUPPORTED_SERVICES).find(([_, config]) => config.connection === connection);
  return entry ? entry[0] : undefined;
}
