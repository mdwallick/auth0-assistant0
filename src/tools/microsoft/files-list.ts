import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Client } from '@microsoft/microsoft-graph-client';
import { getMicrosoftAccessToken } from '@/lib/auth0';

type FileItem = {
    name: string;
    folder: string;
    lastModifiedDateTime: string;
    size: number;
};

const toolSchema = z.object({
    path: z.string().optional().nullable().describe('Path to the folder (e.g. /Documents). Leave blank for root.'),
});

export const MicrosoftFilesListTool = tool(
    async ({ path = '' }) => {
        const token = await getMicrosoftAccessToken();
        const client = Client.init({
            authProvider: (done) => done(null, token),
        });

        const drivePath = path ? `/me/drive/root:/${path}:/children` : `/me/drive/root/children`;

        const res = await client.api(drivePath).get();

        return JSON.stringify(
            res.value.map((item: FileItem) => ({
                name: item.name,
                itemType: item.folder ? 'folder' : 'file',
                lastModified: item.lastModifiedDateTime,
                size: item.size,
            })),
        );
    },
    {
        name: 'MicrosoftFilesListTool',
        description: "List files from the user's OneDrive folder",
        schema: toolSchema,
    },
);
