
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { Client } from '@microsoft/microsoft-graph-client'
import { getMicrosoftAccessToken } from './auth'

const toolSchema = z.object({
    subject: z.string().describe("The title of the event"),
    startDateTime: z.string().datetime().describe("Start time in ISO 8601 format"),
    endDateTime: z.string().datetime().describe("End time in ISO 8601 format"),
    timeZone: z.string().optional().nullable().default('US/Central').describe("Time zone for the event"),
    location: z.string().optional().nullable().describe("Location of the event"),
    attendees: z.array(z.string()).optional().nullable().describe("Email addresses of attendees"),
    eventId: z.string().optional().nullable().describe("Event ID for updating existing events"),
})

export const MicrosoftCalendarWriteTool = tool(
    async ({ subject, startDateTime, endDateTime, timeZone = 'UTC', location, attendees = [], eventId }) => {
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
            attendees: attendees?.map((email) => ({
                emailAddress: { address: email },
                type: 'required',
            })) || [],
        }

        console.log(eventId ? 'Updating event:' : 'Creating event:', event)
        
        if (eventId) {
            await client.api(`/me/events/${eventId}`).patch(event)
            return JSON.stringify({
                status: 'success',
                message: `Event "${subject}" updated successfully`,
            })
        } else {
            await client.api('/me/events').post(event)
            return JSON.stringify({
                status: 'success',
                message: `Event "${subject}" created successfully from ${startDateTime} to ${endDateTime}`,
            })
        }
    },
    {
        name: 'MicrosoftCalendarWriteTool',
        description: "Create or update an event in the user's Microsoft calendar. Provide eventId to update an existing event.",
        schema: toolSchema,
    }
)
