
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { google } from 'googleapis'
import { getGoogleClient } from './auth'

const toolSchema = z.object({
  path: z.string().describe('Full path to the file in Google Drive'),
})

export const GoogleDriveReadTool = tool(
  async ({ path }) => {
    try {
      const auth = await getGoogleClient()
      const drive = google.drive({ version: 'v3', auth })

      const fileName = path.split('/').pop()
      const res = await drive.files.list({
        q: `name='${fileName}'`,
        fields: 'files(id, name, mimeType)',
      })

      if (!res.data.files?.length) {
        return JSON.stringify({ status: 'error', message: 'File not found' })
      }

      const file = res.data.files[0]
      const fileRes = await drive.files.get({
        fileId: file.id!,
        alt: 'media',
      }, { responseType: 'arraybuffer' })

      const content = Buffer.from(fileRes.data as any).toString('utf-8')
      return JSON.stringify({
        status: 'success',
        content,
        metadata: {
          name: file.name,
          type: file.mimeType,
        },
      })
    } catch (e: any) {
      console.error('Google Drive read tool error:', e)
      return JSON.stringify({ status: 'error', message: e.message })
    }
  },
  {
    name: 'GoogleDriveReadTool',
    description: "Read contents of text files from user's Google Drive",
    schema: toolSchema,
  }
)
