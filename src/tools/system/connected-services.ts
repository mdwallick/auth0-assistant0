import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { auth0 } from '@/lib/auth0'
import { mapConnectionToName, SUPPORTED_SERVICES } from '@/lib/types'
import type { ConnectedService } from '@/lib/types'

const toolSchema = z.object({
  input: z.string().nullish()
})

export const ConnectedServicesTool = new DynamicStructuredTool({
  name: 'ConnectedServicesTool',
  description: "Get a list of the user's linked identities from their Auth0 session. Use name field when describing the service",
  schema: toolSchema,
  func: getConnectedServices,
})

async function getConnectedServices() {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return JSON.stringify({
        success: false,
        error: 'No active session found'
      })
    }

    const user_id = session.user.user_id.split('|')[1]
    const filtered_identities = session.user.identities.filter((id: ConnectedService) => id.user_id !== user_id) || []
    const connected_services = new Set(filtered_identities.map(id => id.connection))
    
    const all_services = Object.values(SUPPORTED_SERVICES).map(service => ({
      name: service.displayName,
      connection: service.connection,
      isConnected: connected_services.has(service.connection)
    }))
    
    return JSON.stringify({
      success: true,
      services: all_services
    })
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}
