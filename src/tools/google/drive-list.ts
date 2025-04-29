
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { google } from 'googleapis'
import { getGoogleClient } from './auth'

const toolSchema = z.object({
  path: z.string().optional().nullable().describe('Path to the folder. Leave blank for root.'),
})

export const GoogleDriveListTool = tool(
  async ({ path = '' }) => {
    try {
      const auth = await getGoogleClient()
      const drive = google.drive({ version: 'v3', auth })

      let query = "'root' in parents"
      if (path) {
        const folders = path.split('/').filter(Boolean)
        for (const folder of folders) {
          const folderRes = await drive.files.list({
            q: `name='${folder}' and mimeType='application/vnd.google-apps.folder'`,
            fields: 'files(id)',
          })
          if (!folderRes.data.files?.length) {
            return JSON.stringify({ status: 'error', message: `Folder not found: ${folder}` })
          }
          query = `'${folderRes.data.files[0].id}' in parents`
        }
      }

      const res = await drive.files.list({
        q: query,
        fields: 'files(name, mimeType, modifiedTime, size)',
      })

      return JSON.stringify(
        res.data.files?.map(file => ({
          name: file.name,
          itemType: file.mimeType?.includes('folder') ? 'folder' : 'file',
          lastModified: file.modifiedTime,
          size: file.size,
        })) ?? []
      )
    } catch (e: any) {
      console.error('Google Drive list tool error:', e)
      return JSON.stringify({ status: 'error', message: e.message })
    }
  },
  {
    name: 'GoogleDriveListTool',
    description: "List files from the user's Google Drive folder",
    schema: toolSchema,
  }
)
