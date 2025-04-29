
import { getAccessToken } from '@/lib/auth0'
import { google } from 'googleapis'

export async function getGoogleClient() {
  const token = await getAccessToken('google')
  return google.auth.OAuth2.prototype.setCredentials({ access_token: token })
}
