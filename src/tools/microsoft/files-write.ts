
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { Client } from '@microsoft/microsoft-graph-client'
import { Document, Packer, Paragraph, TextRun } from 'docx'

const toolSchema = z.object({
  path: z.string().describe('Full path to the file in OneDrive (e.g. /Documents/example.docx)'),
  content: z.string().describe('Content to write to the file'),
  type: z.enum(['text', 'docx', 'xlsx']).describe('Type of file to create'),
})

export class MicrosoftFilesWriteTool {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  getTool() {
    return tool(
      async ({ path, content, type }) => {
        try {
          const client = Client.init({
            authProvider: (done) => done(null, this.accessToken),
          })

          if (type === 'text') {
            await client.api(`/me/drive/root:${path}:/content`).put(content)
            return JSON.stringify({
              status: 'success',
              message: `Text file at ${path} was successfully created/updated`,
            })
          }

          const fileName = path.split('/').pop()
          const folderPath = path.substring(0, path.lastIndexOf('/'))
          
          let templateType = ''
          if (type === 'docx') {
            templateType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          } else if (type === 'xlsx') {
            templateType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }

          if (type === 'docx') {
            const doc = new Document({
              sections: [
                {
                  children: content.split('\n').map(
                    line => new Paragraph({ children: [new TextRun(line)] })
                  ),
                },
              ],
            });

            const buffer = await Packer.toBuffer(doc);

            const newFile = await client.api(`/me/drive/root:${path}:/content`)
              .header('Content-Type', templateType)
              .put(buffer);

            return JSON.stringify({
              status: 'success',
              message: `Word document at ${path} was successfully created/updated`,
              fileId: newFile.id
            });
          } else if (type === 'xlsx') {
            const XLSX = require('xlsx');
            
            const rows = content.split('\n').map(row => row.split(';'));
            
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            
            const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            
            const newFile = await client.api(`/me/drive/root:${path}:/content`)
              .header('Content-Type', templateType)
              .put(excelBuffer);

            return JSON.stringify({
              status: 'success',
              message: `Excel document at ${path} was successfully created/updated`,
              fileId: newFile.id
            });
          }
        } catch (e: any) {
          console.error('Microsoft Files Write tool error:', e)
          return JSON.stringify({
            status: 'error',
            message: e.message,
          })
        }
      },
      {
        name: 'MicrosoftFilesWriteTool',
        description: "Create or edit files in the user's OneDrive, including Office documents (docx, xlsx)",
        schema: toolSchema,
      }
    )
  }
}
