
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Client } from '@microsoft/microsoft-graph-client';
import { getMicrosoftAccessToken } from './auth'

const toolSchema = z.object({
    path: z.string().describe('Full path to the file in OneDrive (e.g. /Documents/example.txt)'),
    content: z.string().describe('Content to write to the file'),
});

export const MicrosoftFilesWriteTool = tool(
    async ({ path, content }) => {
        try {
            const token = await getMicrosoftAccessToken();
            const client = Client.init({
                authProvider: (done) => done(null, token),
            });

            // Create or update the file
            await client.api(`/me/drive/root:${path}:/content`)
                .put(content);

            return JSON.stringify({
                status: 'success',
                message: `File at ${path} was successfully created/updated`,
            });
        } catch (e: any) {
            console.error('Microsoft Files Write tool error:', e);
            return JSON.stringify({
                status: 'error',
                message: e.message,
            });
        }
    },
    {
        name: 'MicrosoftFilesWriteTool',
        description: "Create or edit a file in the user's OneDrive",
        schema: toolSchema,
    },
);
