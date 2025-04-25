import { getAccessToken } from '@/lib/auth0'

export const getMicrosoftAccessToken = async () => {
  const token = await getAccessToken('microsoft')
    return token
}
