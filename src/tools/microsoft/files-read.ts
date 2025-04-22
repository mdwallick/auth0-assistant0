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

            if (metadata.file.mimeType.includes('officedocument') || 
                metadata.file.mimeType.includes('msword') ||
                metadata.file.mimeType.includes('pdf')) {
                // For Office documents, try to get text content
                try {
                    const response = await client.api(`/me/drive/items/${metadata.id}/content`)
                        .get();

                    if (response) {
                        // If we got text content, return it
                        return JSON.stringify({
                            status: 'success',
                            content: response.toString(),
                            metadata: {
                                name: metadata.name,
                                type: metadata.file.mimeType,
                                size: metadata.size
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error reading file content:', error);
                    // Try getting file content through the /preview endpoint
                    try {
                        const preview = await client.api(`/me/drive/items/${metadata.id}/preview`)
                            .post({});

                        if (preview && preview.getUrl) {
                            const previewContent = await fetch(preview.getUrl)
                                .then(res => res.text());

                            return JSON.stringify({
                                status: 'success',
                                content: previewContent,
                                metadata: {
                                    name: metadata.name,
                                    type: metadata.file.mimeType,
                                    size: metadata.size
                                }
                            });
                        }
                    } catch (previewError) {
                        console.error('Error getting preview:', previewError);
                    }
                }
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