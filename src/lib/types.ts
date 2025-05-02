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
