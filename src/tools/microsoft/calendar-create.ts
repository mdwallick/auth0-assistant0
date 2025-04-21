import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { Client } from '@microsoft/microsoft-graph-client'
import { getMicrosoftAccessToken } from '@/lib/auth0'

const toolSchema = z.object({
    subject: z.string().describe("The title of the event"),
    startDateTime: z.string().datetime().describe("Start time in ISO 8601 format"),
    endDateTime: z.string().datetime().describe("End time in ISO 8601 format"),
    timeZone: z.string().optional().nullable().describe("Time zone for the event"),
    location: z.string().optional().nullable().describe("Location of the event"),
    attendees: z.array(z.string()).optional().describe("Email addresses of attendees"),
})

export const MicrosoftCalendarCreateTool = tool(
    async ({ subject, startDateTime, endDateTime, timeZone = 'UTC', location, attendees = [] }) => {
        const token = await getMicrosoftAccessToken()

        const client = Client.init({
            authProvider: (done) => done(null, token),
        })

        const event = {
            subject,
            start: {
                dateTime: startDateTime,
                timeZone,
            },
            end: {
                dateTime: endDateTime,
                timeZone,
            },
            location: location ? { displayName: location } : undefined,
            attendees: attendees.map((email) => ({
                emailAddress: { address: email },
                type: 'required',
            })),
        }

        await client.api('/me/events').post(event)

        return JSON.stringify({
            status: 'success',
            message: `Event "${subject}" created successfully from ${startDateTime} to ${endDateTime}`,
        })
    },
    {
        name: 'MicrosoftCalendarCreateTool',
        description: "Create a new event in the user's Microsoft calendar",
        schema: toolSchema,
    }
)
