
import { tool } from '@langchain/core/tools'
import { auth0, type SupportedService } from '@/lib/auth0'
import { z } from 'zod'

const inputSchema = z.object({
  input: z.string().nullish(),
  skipStatusCheck: z.boolean().optional().default(false)
})

export const ServiceStatusTool = tool(
    async ({ skipStatusCheck = false }) => {
        // Skip status check if flag is set
        if (skipStatusCheck) {
            return JSON.stringify({
                status: 'skipped',
                message: 'Status check skipped to prevent recursion'
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
        schema: inputSchema
    }
)
