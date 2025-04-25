import { tool } from '@langchain/core/tools'
import { auth0, type SupportedService } from '@/lib/auth0'

export const ServiceStatusTool = tool(
    async () => {
        const connectedServices = (await auth0.getSession())?.user?.connected_services || [];
        const allServices: SupportedService[] = ['microsoft', 'salesforce', 'google'];

        return JSON.stringify({
            activeServices: connectedServices,
            status: allServices.map(service => ({
                service,
                status: connectedServices.includes(service) ? 'active' : 'not registered'
            }))
        });
    },
    {
        name: 'ServiceStatusTool',
        description: 'Check which services are currently registered and active',
    }
)