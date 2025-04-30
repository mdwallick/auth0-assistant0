
export interface Service {
  connection: 'windowslive' | 'google-oauth2' | 'salesforce-dev';
  isSocial: boolean;
  provider: 'microsoft' | 'google' | 'salesforce';
  user_id: string;
}

export const SERVICES = {
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
    provider: 'salesforce',
    scope: 'api refresh_token'
  }
} as const;

export type SupportedService = keyof typeof SERVICES;

export function getServiceFromConnection(connection: Service['connection']): SupportedService | undefined {
  const entry = Object.entries(SERVICES).find(([_, config]) => config.connection === connection);
  return entry ? entry[0] as SupportedService : undefined;
}
