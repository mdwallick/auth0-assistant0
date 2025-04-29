
import { getAccessToken } from '@/lib/auth0'
import { google } from 'googleapis'

export async function getGoogleClient() {
  const token = await getAccessToken('google')
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: token })
  return oauth2Client
}

export async function getGoogleAccessToken(): Promise<string> {
  return await getAccessToken('google')
}
