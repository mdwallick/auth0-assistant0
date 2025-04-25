import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Client, ResponseType } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import { getMicrosoftAccessToken } from './auth'

import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const pdf = require('pdf-parse');

const toolSchema = z.object({
    path: z
        .string()
        .describe('Full path to the file in OneDrive (e.g. /example.pdf or /notes.txt or /report.docx or /data.xlsx)'),
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
                .responseType(ResponseType.ARRAYBUFFER)
                .get();

            const buffer = Buffer.from(fileBuffer);

            // PDF
            if (fileMime.includes('pdf')) {
                const pdfData = await pdf(buffer);
                return success(pdfData.text, metadata, fileMime);
            }

            // Plain text
            if (fileMime.startsWith('text/')) {
                const text = buffer.toString('utf-8');
                return success(text, metadata, fileMime);
            }

            // Word document (.docx)
            if (fileMime.includes('wordprocessingml.document')) {
                const result = await mammoth.extractRawText({ buffer });
                return success(result.value, metadata, fileMime);
            }

            // Excel spreadsheet (.xlsx)
            if (fileMime.includes('spreadsheetml.sheet')) {
                const workbook = XLSX.read(buffer, { type: 'buffer' });
                const allText = workbook.SheetNames.map((sheetName) => {
                    const sheet = workbook.Sheets[sheetName];
                    return XLSX.utils.sheet_to_csv(sheet);
                }).join('\n\n');
                return success(allText, metadata, fileMime);
            }

            return error(`Unsupported file type: ${fileMime}`);
        } catch (e: any) {
            console.error('MicrosoftFilesReadTool error:', e);
            return error(e.message);
        }
    },
    {
        name: 'MicrosoftFilesReadTool',
        description: "Read the contents of plain text, PDF, Word, or Excel files from the user's OneDrive",
        schema: toolSchema,
    },
);

// 🔧 Helper functions
function success(content: string, metadata: any, type: string) {
    return JSON.stringify({
        status: 'success',
        content,
        metadata: {
            name: metadata.name,
            type,
            size: metadata.size,
        },
    });
}

function error(message: string) {
    return JSON.stringify({
        status: 'error',
        message,
    });
}
