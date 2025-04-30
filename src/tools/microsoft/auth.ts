import { getAccessToken } from '@/lib/auth0'

export const getMicrosoftAccessToken = async () => {
  const token = await getAccessToken('microsoft')
  console.log('Microsoft Access Token:', token)
  return token
}
