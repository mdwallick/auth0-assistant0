
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Client } from '@microsoft/microsoft-graph-client';
import { getMicrosoftAccessToken } from '@/lib/auth0';

const toolSchema = z.object({
    path: z.string().describe('Full path to the file in OneDrive (e.g. /Documents/example.txt)'),
});

export const MicrosoftFilesReadTool = tool(
    async ({ path }) => {
        try {
            const token = await getMicrosoftAccessToken();
            const client = Client.init({
                authProvider: (done) => done(null, token),
            });

            // First get the file metadata to determine the type
            const metadata = await client.api(`/me/drive/root:${path}`).get();
            
            if (metadata.file.mimeType.includes('officedocument')) {
                // For Office documents, we need to get the text content
                const response = await client.api(`/me/drive/root:${path}:/content`)
                    .header('accept', 'text/plain')
                    .get();
                return JSON.stringify({
                    status: 'success',
                    content: response,
                });
            } else {
                // For other files, get raw content
                const response = await client.api(`/me/drive/root:${path}:/content`)
                    .get();
                return JSON.stringify({
                    status: 'success',
                    content: response,
                });
            }
        } catch (e: any) {
            console.error('Microsoft Files Read tool error:', e);
            return JSON.stringify({
                status: 'error',
                message: e.message,
            });
        }
    },
    {
        name: 'MicrosoftFilesReadTool',
        description: "Read the contents of a file from the user's OneDrive",
        schema: toolSchema,
    },
);
