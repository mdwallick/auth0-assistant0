
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
          const allServices = Object.keys(SUPPORTED_SERVICES)
          
          const statusChecks = await Promise.all(
            allServices.map(async (service) => {
              try {
                const connection = SUPPORTED_SERVICES[service].connection
                await auth0.getAccessTokenForConnection({ connection })
                return { service, active: true, status: '✅' }
              } catch (error) {
                return { service, active: false, status: '❌' }
              }
            })
          )

          const activeServices = statusChecks
            .filter(check => check.active)
            .map(check => check.service)

          return JSON.stringify({
            activeServices,
            status: statusChecks
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
