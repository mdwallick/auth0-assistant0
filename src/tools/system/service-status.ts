
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { auth0 } from '@/lib/auth0'
import { getServiceFromConnection, SUPPORTED_SERVICES, type SupportedService } from '@/lib/services'

const inputSchema = z.object({
  input: z.string().nullish()
})

export class ServiceStatusTool {
  constructor() {}

  getTool() {
    return tool(
      async () => {
        try {
          const session = await auth0.getSession()
          const connectedServices = session?.user?.connected_services || []
          const activeServices = connectedServices
            .map(cs => getServiceFromConnection(cs.connection))
            .filter((service): service is SupportedService => service !== undefined)

          const allServices = Object.keys(SUPPORTED_SERVICES)

          return JSON.stringify({
            activeServices,
            status: allServices.map(service => ({
              service,
              status: activeServices.includes(service) ? '✅' : '❌',
              active: activeServices.includes(service)
            }))
          })
        } catch (error) {
          return JSON.stringify({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error checking service status'
          })
        }
      },
      {
        name: 'ServiceStatusTool',
        description: 'Check which services are currently registered and active',
        schema: inputSchema
      }
    )
  }
}

export default new ServiceStatusTool().getTool()
