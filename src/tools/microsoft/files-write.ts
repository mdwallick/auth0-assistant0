
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { Client } from '@microsoft/microsoft-graph-client'
import { getMicrosoftAccessToken } from './auth'

const toolSchema = z.object({
  path: z.string().describe('Full path to the file in OneDrive (e.g. /Documents/example.docx)'),
  content: z.string().describe('Content to write to the file'),
  type: z.enum(['text', 'docx', 'xlsx']).describe('Type of file to create'),
})

export const MicrosoftFilesWriteTool = tool(
  async ({ path, content, type }) => {
    try {
      const token = await getMicrosoftAccessToken()
      const client = Client.init({
        authProvider: (done) => done(null, token),
      })

      if (type === 'text') {
        // Create or update plain text file
        await client.api(`/me/drive/root:${path}:/content`).put(content)
        return JSON.stringify({
          status: 'success',
          message: `Text file at ${path} was successfully created/updated`,
        })
      }

      // Create a new Office document
      const fileName = path.split('/').pop()
      const folderPath = path.substring(0, path.lastIndexOf('/'))
      
      let templateType = ''
      if (type === 'docx') {
        templateType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      } else if (type === 'xlsx') {
        templateType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }

      // Create empty document
      const newFile = await client.api(`/me/drive/root:${path}`).put({
        name: fileName,
        '@microsoft.graph.conflictBehavior': 'replace',
        'file': { mimeType: templateType }
      })

      // Update content
      if (content) {
        await client.api(`/me/drive/items/${newFile.id}/content`)
          .put(content)
      }

      return JSON.stringify({
        status: 'success',
        message: `Office document at ${path} was successfully created/updated`,
        fileId: newFile.id
      })
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
  },
)
