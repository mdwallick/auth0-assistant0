
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { google } from 'googleapis'
import { getGoogleAccessToken } from './auth'

const toolSchema = z.object({
  query: z.string().optional().nullable().describe('Search query for email subject or body'),
  maxResults: z.number().optional().nullable().default(5).describe('Number of emails to return (default is 5)'),
  labelIds: z.array(z.string()).optional().nullable().default(['INBOX']).describe('Gmail label IDs to search in')
})

export const GoogleMailReadTool = tool(
  async ({ query, maxResults = 5, labelIds = ['INBOX'] }) => {
    try {
      const token = await getGoogleAccessToken()
      const gmail = google.gmail({ 
        version: 'v1', 
        auth: new google.auth.OAuth2().setCredentials({ access_token: token })
      })
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
        labelIds
      })

      const messages = await Promise.all(
        (response.data.messages || []).map(async (msg) => {
          const email = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'full'
          })
          const headers = email.data.payload?.headers
          return {
            id: email.data.id,
            threadId: email.data.threadId,
            subject: headers?.find(h => h.name === 'Subject')?.value,
            from: headers?.find(h => h.name === 'From')?.value,
            date: headers?.find(h => h.name === 'Date')?.value,
            snippet: email.data.snippet
          }
        })
      )

      return JSON.stringify(messages)
    } catch (e: any) {
      console.error('Gmail read tool error:', e)
      return JSON.stringify({ status: 'error', message: e.message })
    }
  },
  {
    name: 'GoogleMailReadTool',
    description: "Search and read emails from the user's Gmail inbox",
    schema: toolSchema
  }
)
