import { Auth0AI, getAccessTokenForConnection } from '@auth0/ai-langchain'

// Get the access token for a connection via Auth0
export const getAccessToken = async () => getAccessTokenForConnection()

const auth0AI = new Auth0AI()

// Connection for Google services
export const withGoogleConnection = auth0AI.withTokenForConnection({
  connection: 'google-oauth2',
  scopes: [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/drive',
  ],
})

// Connection for Microsoft services
export const withMicrosoftConnection = auth0AI.withTokenForConnection({
  // accessToken: async (params, config) => {
  //   return config?.configurable?._credentials?.accessToken
  // },
  refreshToken: async (params, config) => {
    console.log("Refreshing token...");
    console.log("Current credentials:", config?.configurable?._credentials);

    const accessToken = config?.configurable?._credentials?.accessToken;
    if (!accessToken) {
      console.error("No access token available");
      throw new Error("No access token available.");
    }
    
    return config?.configurable?._credentials?.refreshToken
  },
  connection: 'windowslive',
  scopes: [
    'Mail.Send',
    'Mail.ReadWrite',
    'Calendars.ReadWrite',
    'Files.ReadWrite',
  ],
})

// Connection for Salesforce services
export const withSalesforceConnection = auth0AI.withTokenForConnection({
  connection: 'salesforce-dev',
  scopes: [
    'openid',
    'api',
    'refresh_token',
    'offline_access',
  ],
})
