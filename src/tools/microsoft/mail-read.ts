
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
    sender: {
        emailAddress: {
            name: string
            address: string
        }
    }
    toRecipients?: Array<{
        emailAddress: {
            name: string
            address: string
        }
    }>
    ccRecipients?: Array<{
        emailAddress: {
            name: string
            address: string
        }
    }>
}

const toolSchema = z.object({
    query: z.string().optional().nullable().describe('Search query for the email subject or body'),
    top: z.number().optional().nullable().default(5).describe('Number of emails to return (default is 5)'),
    folder: z.enum(['inbox', 'sentItems']).optional().nullable().default('inbox').describe('Folder to search in: inbox for received emails, sentItems for sent emails'),
})

export const MicrosoftMailReadTool = tool(
    async ({ query, top: rawTop = 5, folder = 'inbox' }) => {
        const top = typeof rawTop === 'number' ? rawTop : 5;
        try {
            const token = await getMicrosoftAccessToken()
            const client = Client.init({
                authProvider: (done) => done(null, token),
            })

            // Use different endpoint based on folder
            const endpoint = folder === 'sentItems' 
                ? '/me/mailFolders/SentItems/messages'
                : '/me/mailFolders/Inbox/messages'

            const req = client.api(endpoint).top(top).orderby('receivedDateTime DESC')

            if (query) {
                req.query({ $search: `"${query}"` })
            }

            const res = await req.get()

            return JSON.stringify(res.value.map((email: Email) => {
                const emailData = {
                    subject: email.subject,
                    receivedDateTime: email.receivedDateTime,
                    snippet: email.bodyPreview,
                    type: folder === 'sentItems' ? 'sent' : 'received'
                };

                if (folder === 'sentItems') {
                    // For sent items, show recipient(s)
                    return {
                        ...emailData,
                        to: email.toRecipients?.map(r => r.emailAddress.address),
                        cc: email.ccRecipients?.map(r => r.emailAddress.address)
                    };
                } else {
                    // For inbox items, show sender
                    return {
                        ...emailData,
                        from: email.from?.emailAddress?.address,
                        sender: email.sender?.emailAddress?.address
                    };
                }
            })))
        } catch (e: any) {
            console.error('Mail read tool error:', e)
            return { status: 'error', message: e.message }
        }
    },
    {
        name: 'MicrosoftMailReadTool',
        description: "Get emails from the user's Outlook inbox or sent items folder",
        schema: toolSchema,
    },
)
