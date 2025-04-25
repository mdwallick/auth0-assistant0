interface ServiceConfig {
  connection: string;
  scope?: string;
}

export type Auth0Connection = 'windowslive' | 'google-oauth2' | 'salesforce-dev'
export type SupportedService = 'microsoft' | 'salesforce' | 'google'

export const AUTH0_TO_SERVICE_MAP: Record<Auth0Connection, SupportedService> = {
  'windowslive': 'microsoft',
  'google-oauth2': 'google',
  'salesforce-dev': 'salesforce'
}

export const SERVICE_CONFIGS: Record<SupportedService, ServiceConfig> = {
  microsoft: { connection: 'windowslive' },
  salesforce: { connection: 'salesforce-dev' },
  google: { connection: 'google-oauth2' }
}
