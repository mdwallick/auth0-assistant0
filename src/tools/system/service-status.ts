
import { tool } from '@langchain/core/tools'
import { auth0, type SupportedService } from '@/lib/auth0'

export const ServiceStatusTool = tool(
    async () => {
        const session = await auth0.getSession()
        const connectedServices = session?.user?.connected_services || []
        const allServices: SupportedService[] = ['microsoft', 'salesforce', 'google']
        
        const status = allServices.map(service => ({
            service,
            status: connectedServices.includes(service) ? 'active' : 'not registered'
        }))

        return JSON.stringify({
            activeServices: connectedServices,
            status
        })
    },
    {
        name: 'ServiceStatusTool',
        description: 'Check which services are currently registered and active',
    }
)
