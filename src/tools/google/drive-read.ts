
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

const toolSchema = z.object({
  path: z.string().describe('Full path to the file in Google Drive')
})

export class GoogleDriveReadTool {
  private client: OAuth2Client

  constructor(client: OAuth2Client) {
    this.client = client
  }

  getTool() {
    return tool(
      async ({ path }) => {
        try {
          const drive = google.drive({ version: 'v3', auth: this.client })

          const fileName = path.split('/').pop()
          const res = await drive.files.list({
            q: `name='${fileName}'`,
            fields: 'files(id, name, mimeType)'
          })

          if (!res.data.files?.length) {
            return JSON.stringify({ status: 'error', message: 'File not found' })
          }

          const file = res.data.files[0]
          const fileRes = await drive.files.get({
            fileId: file.id!,
            alt: 'media'
          }, { responseType: 'arraybuffer' })

          const content = Buffer.from(fileRes.data as any).toString('utf-8')
          return JSON.stringify({
            status: 'success',
            content,
            metadata: {
              name: file.name,
              type: file.mimeType
            }
          })
        } catch (e: any) {
          return JSON.stringify({ status: 'error', message: e.message })
        }
      },
      {
        name: 'GoogleDriveReadTool',
        description: "Read contents of text files from user's Google Drive",
        schema: toolSchema
      }
    )
  }
}
