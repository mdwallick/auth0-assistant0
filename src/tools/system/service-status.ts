import { tool } from '@langchain/core/tools'
import { auth0, type SupportedService, getConnectedServices } from '@/lib/auth0'

export const ServiceStatusTool = tool(
    async () => {
        const allServices: SupportedService[] = ['microsoft', 'salesforce', 'google'];
        const activeServices = await getConnectedServices();

        return JSON.stringify({
            activeServices,
            status: allServices.map(service => ({
                service,
                status: activeServices.includes(service) ? 'active' : 'not registered'
            }))
        });
    },
    {
        name: 'ServiceStatusTool',
        description: 'Check which services are currently registered and active',
    }
)