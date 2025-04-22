
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

            // Handle path with or without leading slash
            const normalizedPath = path.startsWith('/') ? path : `/${path}`;
            // First get the file metadata to determine the type
            const metadata = await client.api(`/me/drive/root:${normalizedPath}`).get();
            
            if (metadata.file.mimeType.includes('officedocument.wordprocessingml') || 
                metadata.file.mimeType.includes('msword')) {
                // For Word documents, use the /content endpoint with text format
                const response = await client.api(`/me/drive/items/${metadata.id}/content`)
                    .header('accept', 'text/plain')
                    .get();
                
                if (!response) {
                    // Try alternative method for Word docs
                    const textContent = await client.api(`/me/drive/items/${metadata.id}/microsoft.graph.workbook/worksheets/Item/range(address='A1:Z1000')/text`)
                        .get();
                    return JSON.stringify({
                        status: 'success',
                        content: textContent,
                        metadata: {
                            name: metadata.name,
                            type: metadata.file.mimeType,
                            size: metadata.size
                        }
                    });
                }
                
                return JSON.stringify({
                    status: 'success',
                    content: response,
                    metadata: {
                        name: metadata.name,
                        type: metadata.file.mimeType,
                        size: metadata.size
                    }
                });
            } else {
                // For other files, get raw content
                const response = await client.api(`/me/drive/root:${path}:/content`)
                    .get();
                return JSON.stringify({
                    status: 'success',
                    content: response,
                    metadata: {
                        name: metadata.name,
                        type: metadata.file.mimeType,
                        size: metadata.size
                    }
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
