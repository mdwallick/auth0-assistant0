import { Auth0Client } from '@auth0/nextjs-auth0/server'

export const auth0 = new Auth0Client({
    // this is required to get federated access tokens from services like Google
    authorizationParameters: {
        access_type: 'offline',
        prompt: 'consent',
    },
})

export const getGoogleAccessToken = async () => {
    try {
        const { token } = await auth0.getAccessTokenForConnection({
            connection: 'google-oauth2',
        })
        return token
    } catch (e: any) {
        // swallow the error, user isn't logged in
        console.log('Error getting Google access token:', e)
    }
}

export const getMicrosoftAccessToken = async () => {
    try {
        // Get access token for Microsoft social connection.
        const { token } = await auth0.getAccessTokenForConnection({
            connection: "windowslive",
        })
        return token
    } catch (e: any) {
        
    }
}

export const getSalesforceAccessToken = async () => {
    try {
        // Get access token for Salesforce connection.
        const { token } = await auth0.getAccessTokenForConnection({
            connection: "salesforce-dev",
        })
        return token
    } catch (e: any) {

    }
}

// const isTokenExpired = () => {
//     if (!accessToken) {
//         return true; // No token has been issued
//     }

//     // Decode the JWT to extract expiration time
//     const decoded = jwt_decode(accessToken);
//     const currentTime = Date.now() / 1000; // Current time in seconds
//     return decoded.exp < currentTime; // exp is in seconds
// }
