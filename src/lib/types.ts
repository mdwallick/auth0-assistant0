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

export function mapConnectionToName(connection: string) {
  let name = ''
  switch(connection) {
    case "windowslive":
      name = "Microsoft"
      break
    case "google-oauth2":
      name = "Google"
      break
    case "salesforce-dev":
      name = "Salesforce"
      break
    default:
      name = "service not implemented"
  }
  return name
}
