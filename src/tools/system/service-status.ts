
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { auth0 } from '@/lib/auth0'
import { getServiceFromConnection, SUPPORTED_SERVICES, type SupportedService } from '@/lib/services'

const inputSchema = z.object({
  input: z.string().nullish(),
  skipStatusCheck: z.boolean().nullish().default(false)
})

export class ServiceStatusTool {
  constructor() {}

  getTool() {
    return tool(
      async ({ skipStatusCheck = false }) => {
        // Skip status check if flag is set
        if (skipStatusCheck) {
          return JSON.stringify({
            status: 'skipped',
            message: 'Status check skipped to prevent recursion'
          })
        }

        try {
          const session = await auth0.getSession()
          const connectedServices = session?.user?.connected_services || []
          const activeServices = connectedServices
            .map(cs => getServiceFromConnection(cs.connection))
            .filter((service): service is SupportedService => service !== undefined)

          //const allServices: SupportedService[] = ['microsoft', 'salesforce', 'google']
          
          return JSON.stringify({
            activeServices,
            status: SUPPORTED_SERVICES.map(service => ({
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
