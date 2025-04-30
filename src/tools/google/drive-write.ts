
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

const toolSchema = z.object({
  path: z.string().describe('Full path to the file in Google Drive'),
  content: z.string().describe('Content to write to the file'),
  mimeType: z.string().default('text/plain').describe('MIME type of the file')
})

export class GoogleDriveWriteTool {
  private client: OAuth2Client

  constructor(client: OAuth2Client) {
    this.client = client
  }

  getTool() {
    return tool(
      async ({ path, content, mimeType }) => {
        try {
          const drive = google.drive({ version: 'v3', auth: this.client })

          const fileName = path.split('/').pop()
          const fileMetadata = {
            name: fileName,
            mimeType: mimeType
          }

          const media = {
            mimeType: mimeType,
            body: content
          }

          const res = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id'
          })

          return JSON.stringify({
            status: 'success',
            message: `File ${fileName} created successfully`,
            fileId: res.data.id
          })
        } catch (e: any) {
          return JSON.stringify({ status: 'error', message: e.message })
        }
      },
      {
        name: 'GoogleDriveWriteTool',
        description: "Create or update files in user's Google Drive",
        schema: toolSchema
      }
    )
  }
}
