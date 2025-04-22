import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch'; // required by Microsoft Graph Client
import { getMicrosoftAccessToken } from '@/lib/auth0';
import pdf from 'pdf-parse'

const toolSchema = z.object({
    path: z.string().describe('Full path to the file in OneDrive (e.g. /example.pdf or /notes.txt)'),
});

export const MicrosoftFilesReadTool = tool(
    async ({ path }) => {
        try {
            const token = await getMicrosoftAccessToken();
            const client = Client.init({
                authProvider: (done) => done(null, token),
            });

            const normalizedPath = path.startsWith('/') ? path : `/${path}`;
            const metadata = await client.api(`/me/drive/root:${normalizedPath}`).get();

            const fileMime = metadata.file?.mimeType || '';
            const fileBuffer = await client
                .api(`/me/drive/items/${metadata.id}/content`)
                .responseType('arraybuffer')
                .get();

            if (fileMime.includes('pdf')) {
                const buffer = Buffer.from(fileBuffer);
                const pdfData = await pdf(buffer);
                return JSON.stringify({
                    status: 'success',
                    content: pdfData.text,
                    metadata: {
                        name: metadata.name,
                        type: fileMime,
                        size: metadata.size,
                    },
                });
            } else if (fileMime.startsWith('text/')) {
                const text = Buffer.from(fileBuffer).toString('utf-8');
                return JSON.stringify({
                    status: 'success',
                    content: text,
                    metadata: {
                        name: metadata.name,
                        type: fileMime,
                        size: metadata.size,
                    },
                });
            } else {
                return JSON.stringify({
                    status: 'error',
                    message: `Unsupported file type: ${fileMime}`,
                });
            }
        } catch (e: any) {
            console.error('MicrosoftFilesReadTool error:', e);
            return JSON.stringify({
                status: 'error',
                message: e.message,
            });
        }
    },
    {
        name: 'MicrosoftFilesReadTool',
        description: "Read the contents of plain text or PDF files from the user's OneDrive",
        schema: toolSchema,
    },
);
