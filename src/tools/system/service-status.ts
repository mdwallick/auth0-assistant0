import { tool } from '@langchain/core/tools'
import { auth0 } from '@/lib/auth0'
import { z } from 'zod'

import type { SupportedService } from '@/lib/services'

const inputSchema = z.object({
  input: z.string().nullish(),
  skipStatusCheck: z.boolean().optional().nullable().default(false)
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

        const allServices = Object.keys(SUPPORTED_SERVICES);
        try {
            const session = await auth0.getSession();
            const connectedServices = session?.user?.connected_services || [];
            const activeServices = connectedServices
                .map(cs => getServiceFromConnection(cs.connection))
                .filter((service): service is string => service !== undefined);

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