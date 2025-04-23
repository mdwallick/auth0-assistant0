import { Auth0Client } from '@auth0/nextjs-auth0/server'
import { serviceRegistry } from './service-registry' // Added import for service registry

export const auth0 = new Auth0Client({
    // this is required to get federated access tokens from services like Google
    authorizationParameters: {
        access_type: 'offline',
        prompt: 'consent',
    },
})

export const getGoogleAccessToken = async () => {
    const { token } = await auth0.getAccessTokenForConnection({
        connection: 'google-oauth2',
    })
    serviceRegistry.registerService('google'); // Register Google service
    return token
}

export const getMicrosoftAccessToken = async () => {
    // Get access token for Microsoft social connection.
    const { token } = await auth0.getAccessTokenForConnection({
        connection: "windowslive",
    })
    serviceRegistry.registerService('microsoft'); // Register Microsoft service
    return token
}

export const getSalesforceAccessToken = async () => {
    // Get access token for Salesforce connection.
    const { token } = await auth0.getAccessTokenForConnection({
        connection: "salesforce-dev",
    })
    serviceRegistry.registerService('salesforce'); // Register Salesforce service
    return token
}
