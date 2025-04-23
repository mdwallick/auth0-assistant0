import jsforce from 'jsforce'
import { auth0 } from '@/lib/auth0'

export async function getSalesforceClient() {
    const { token } = await auth0.getAccessTokenForConnection({
        connection: "salesforce",
    })

    const conn = new jsforce.Connection({
        instanceUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
        accessToken: token
    })

    return conn
}