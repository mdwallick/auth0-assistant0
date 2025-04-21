import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { Client } from '@microsoft/microsoft-graph-client'
import { getMicrosoftAccessToken } from '@/lib/auth0'

type Email = {
    subject: string
    from?: {
        emailAddress: {
            name: string
            address: string
        }
    }
    receivedDateTime: string
    bodyPreview: string
}

const toolSchema = z.object({
    query: z.string().optional().nullable().describe('Search query for the email subject or body'),
    top: z.number().default(5).describe('Number of emails to return (default is 5)'),
})

export const MicrosoftMailTool = tool(
    async ({ query, top }) => {
        try {
            const token = await getMicrosoftAccessToken()

            console.log('access token', token)

            const client = Client.init({
                authProvider: (done) => done(null, token),
            })

            const req = client.api('/me/messages').top(top).orderby('receivedDateTime DESC')

            if (query) {
                req.query({ $search: `"${query}"` })
            }

            const res = await req.get()

            return JSON.stringify(res.value.map((email: Email) => ({
                subject: email.subject,
                from: email.from?.emailAddress?.address,
                receivedDateTime: email.receivedDateTime,
                snippet: email.bodyPreview,
            })))
        } catch (e: any) {
            console.error('Calendar tool error:', e)
            return { status: 'error', message: e.message }
        }
    },
    {
        name: 'MicrosoftMailTool',
        description: "Get the most recent emails from the user's Outlook inbox",
        schema: toolSchema,
    },
)
