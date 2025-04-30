
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { Client } from '@microsoft/microsoft-graph-client'

const toolSchema = z.object({
  subject: z.string().describe('Subject of the email'),
  body: z.string().describe('Body content of the email (can include HTML)'),
  to: z.array(z.string()).describe('Array of recipient email addresses'),
  cc: z.array(z.string()).optional().nullable().describe('Array of CC recipient email addresses'),
  importance: z
    .enum(['low', 'normal', 'high'])
    .optional()
    .nullable()
    .default('normal')
    .describe('Importance of the email'),
})

export class MicrosoftMailWriteTool {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  getTool() {
    return tool(
      async ({ subject, body, to, cc, importance = 'normal' }) => {
        try {
          const client = Client.init({
            authProvider: (done) => done(null, this.accessToken),
          })

          const message = {
            subject,
            body: {
              contentType: 'HTML',
              content: body,
            },
            toRecipients: to.map((email) => ({
              emailAddress: { address: email },
            })),
            ccRecipients:
              cc?.map((email) => ({
                emailAddress: { address: email },
              })) || [],
            importance,
          }

          await client.api('/me/sendMail').post({ message })

          return JSON.stringify({
            status: 'success',
            message: `Email "${subject}" sent successfully to ${to.join(', ')}`,
          })
        } catch (e: any) {
          console.error('Mail write tool error:', e)
          return JSON.stringify({
            status: 'error',
            message: e.message,
          })
        }
      },
      {
        name: 'MicrosoftMailWriteTool',
        description: "Send an email using the user's Microsoft account",
        schema: toolSchema,
      }
    )
  }
}
