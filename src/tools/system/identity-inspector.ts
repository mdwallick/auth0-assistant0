
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { auth0 } from '@/lib/auth0'

const toolSchema = z.object({
  input: z.string().nullish()
})

export const IdentityInspectorTool = tool(
  {
    name: 'IdentityInspectorTool',
    description: "Get a list of the user's linked identities from their Auth0 session",
    schema: toolSchema,
  },
  async () => {
    try {
      const session = await auth0.getSession()
      if (!session?.user) {
        return JSON.stringify({
          success: false,
          error: 'No active session found'
        })
      }

      const identities = session.user.identities || []
      return JSON.stringify({
        success: true,
        identities: identities.map(identity => ({
          provider: identity.provider,
          connection: identity.connection,
          isSocial: identity.isSocial,
          userId: identity.user_id,
          profileData: identity.profileData
        }))
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  }
)
