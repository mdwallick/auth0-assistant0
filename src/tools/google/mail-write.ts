
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

const toolSchema = z.object({
  to: z.array(z.string()).describe('Array of recipient email addresses'),
  subject: z.string().describe('Subject of the email'),
  body: z.string().describe('Body content of the email (can include HTML)'),
  cc: z.array(z.string()).optional().nullable().describe('Array of CC recipient email addresses')
})

export class GoogleMailWriteTool {
  private client: OAuth2Client

  constructor(client: OAuth2Client) {
    this.client = client
  }

  getTool() {
    return tool(
      async ({ to, subject, body, cc }) => {
        try {
          const gmail = google.gmail({ version: 'v1', auth: this.client })

          const message = [
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `To: ${to.join(', ')}`,
            cc ? `Cc: ${cc.join(', ')}` : '',
            `Subject: ${subject}`,
            '',
            body
          ].filter(line => line !== '').join('\r\n')

          const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')

          await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage }
          })

          return JSON.stringify({
            status: 'success',
            message: `Email "${subject}" sent successfully to ${to.join(', ')}`
          })
        } catch (e: any) {
          return JSON.stringify({ status: 'error', message: e.message })
        }
      },
      {
        name: 'GoogleMailWriteTool',
        description: "Send an email using the user's Gmail account",
        schema: toolSchema
      }
    )
  }
}
