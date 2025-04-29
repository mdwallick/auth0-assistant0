
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { google } from 'googleapis'
import { getGoogleAccessToken } from './auth'

const toolSchema = z.object({
  summary: z.string().describe('Title of the event'),
  description: z.string().optional().nullable().describe('Description of the event'),
  start: z.string().datetime().describe('Start time in ISO 8601 format'),
  end: z.string().datetime().describe('End time in ISO 8601 format'),
  attendees: z.array(z.string()).optional().nullable().describe('List of attendee email addresses')
})

export const GoogleCalendarWriteTool = tool(
  async ({ summary, description, start, end, attendees }) => {
    try {
      const token = await getGoogleAccessToken()
      const calendar = google.calendar({ version: 'v3', auth: { credentials: { access_token: token } } })

      const event = {
        summary,
        description,
        start: { dateTime: start },
        end: { dateTime: end },
        attendees: attendees?.map(email => ({ email }))
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      })

      return JSON.stringify({
        status: 'success',
        message: 'Event created successfully',
        eventId: response.data.id
      })
    } catch (e: any) {
      console.error('Google Calendar write tool error:', e)
      return JSON.stringify({ status: 'error', message: e.message })
    }
  },
  {
    name: 'GoogleCalendarWriteTool',
    description: "Create an event in user's Google Calendar",
    schema: toolSchema
  }
)
