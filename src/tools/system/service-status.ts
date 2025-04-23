
import { tool } from '@langchain/core/tools'
import { serviceRegistry } from '@/lib/service-registry'

export const ServiceStatusTool = tool(
    async () => {
        const activeServices = serviceRegistry.getActiveServices()
        const allServices = ['microsoft', 'salesforce', 'google']
        
        const status = allServices.map(service => ({
            service,
            status: activeServices.includes(service) ? 'active' : 'not registered'
        }))

        return JSON.stringify({
            activeServices,
            status
        })
    },
    {
        name: 'ServiceStatusTool',
        description: 'Check which services are currently registered and active',
    }
)
