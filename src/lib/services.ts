
export const SERVICES = {
  microsoft: {
    name: 'microsoft',
    connection: 'windowslive',
    scope: 'offline_access files.readwrite.all mail.readwrite calendars.readwrite',
  },
  salesforce: {
    name: 'salesforce',
    connection: 'salesforce-dev',
    scope: 'api refresh_token',
  },
  google: {
    name: 'google',
    connection: 'google-oauth2',
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar',
  },
} as const;

export type SupportedService = keyof typeof SERVICES;
export type ServiceConfig = typeof SERVICES[SupportedService];
export type Auth0Connection = typeof SERVICES[SupportedService]['connection'];

export function getAuth0Connection(service: SupportedService): Auth0Connection {
  return SERVICES[service].connection;
}

export function getServiceFromConnection(connection: Auth0Connection): SupportedService | undefined {
  const entry = Object.entries(SERVICES).find(([_, config]) => config.connection === connection);
  return entry ? entry[0] as SupportedService : undefined;
}
