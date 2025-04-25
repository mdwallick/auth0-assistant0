import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { Client } from '@microsoft/microsoft-graph-client'
import { getMicrosoftAccessToken } from './auth'

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
    body: {
        contentType: string
        content: string
    }
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

            const emails = res.value.map((email: Email) => {
                if (folder === 'sentItems') {
                    return {
                        subject: email.subject,
                        receivedDateTime: email.receivedDateTime,
                        snippet: email.bodyPreview,
                        body: email.body.content,
                        type: 'sent',
                        recipients: email.toRecipients?.map(r => r.emailAddress.address) || [],
                        ccRecipients: email.ccRecipients?.map(r => r.emailAddress.address) || []
                    };
                } else {
                    return {
                        subject: email.subject,
                        receivedDateTime: email.receivedDateTime,
                        snippet: email.bodyPreview,
                        body: email.body.content,
                        type: 'received',
                        from: email.from?.emailAddress?.address,
                        sender: email.sender?.emailAddress?.address
                    };
                }
            });
            return JSON.stringify(emails)
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