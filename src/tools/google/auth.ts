
import { getAccessToken } from '@/lib/auth0'

export async function getGoogleAccessToken(): Promise<string> {
  return await getAccessToken('google')
}
