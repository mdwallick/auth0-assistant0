import { tool } from '@langchain/core/tools'
import { auth0, type SupportedService } from '@/lib/auth0'

export const ServiceStatusTool = tool(
    async () => {
        const session = await auth0.getSession();
        const connectedServices = session?.user?.connected_services || [];
        const activeConnections = connectedServices.map(cs => cs.connection);
        const allServices: SupportedService[] = ['microsoft', 'salesforce', 'google'];

        // Map connection names to service names
        const connectionMap: Record<string, SupportedService> = {
            'windowslive': 'microsoft',
            'google-oauth2': 'google',
            'salesforce-dev': 'salesforce'
        };

        const activeServices = activeConnections
            .map(conn => connectionMap[conn])
            .filter((service): service is SupportedService => service !== undefined);

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