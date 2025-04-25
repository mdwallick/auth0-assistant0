import jsforce from 'jsforce'
import { getAccessToken } from '@/lib/auth0'

export async function getSalesforceClient() {
  const token = await getAccessToken('salesforce')

  const conn = new jsforce.Connection({
    instanceUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
    accessToken: token,
  })

  return conn
}
