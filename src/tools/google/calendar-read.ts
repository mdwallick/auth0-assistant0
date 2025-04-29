
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { google } from 'googleapis'
import { getGoogleClient } from './auth'

const toolSchema = z.object({
  timeMin: z.string().datetime().describe('Start time in ISO 8601 format'),
  timeMax: z.string().datetime().describe('End time in ISO 8601 format'),
  maxResults: z.number().optional().nullable().default(10).describe('Maximum number of events to return')
})

export const GoogleCalendarReadTool = tool(
  async ({ timeMin, timeMax, maxResults = 10 }) => {
    try {
      const auth = await getGoogleClient()
      const calendar = google.calendar({ version: 'v3', auth })

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      })

      return JSON.stringify({
        status: 'success',
        events: response.data.items
      })
    } catch (e: any) {
      console.error('Google Calendar read tool error:', e)
      return JSON.stringify({ status: 'error', message: e.message })
    }
  },
  {
    name: 'GoogleCalendarReadTool',
    description: "Read events from user's Google Calendar",
    schema: toolSchema
  }
)
