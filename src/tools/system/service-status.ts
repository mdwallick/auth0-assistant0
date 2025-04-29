
import { tool } from '@langchain/core/tools'
import { auth0, type SupportedService } from '@/lib/auth0'

export const ServiceStatusTool = tool(
    async (_, runManager) => {
        // Skip status check if we're already in a status check (prevent recursion)
        if (runManager?.tags?.includes('status-check')) {
            return JSON.stringify({
                status: 'error',
                message: 'Status check already in progress'
            });
        }

        const allServices: SupportedService[] = ['microsoft', 'salesforce', 'google'];
        try {
            const session = await auth0.getSession();
            const connectedServices = session?.user?.connected_services || [];
            const activeServices = connectedServices
                .map(cs => {
                    if (cs.connection === 'windowslive') return 'microsoft';
                    if (cs.connection === 'google-oauth2') return 'google';
                    if (cs.connection === 'salesforce-dev') return 'salesforce';
                    return null;
                })
                .filter((s): s is SupportedService => s !== null);

            return JSON.stringify({
                activeServices,
                status: allServices.map(service => ({
                    service,
                    status: activeServices.includes(service) ? '✅' : '❌'
                }))
            });
        } catch (error) {
            return JSON.stringify({
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error checking service status'
            });
        }
    },
    {
        name: 'ServiceStatusTool',
        description: 'Check which services are currently registered and active',
        tags: ['status-check']
    }
)
