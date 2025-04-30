
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

const toolSchema = z.object({
  timeMin: z.string().datetime().describe('Start time in ISO 8601 format'),
  timeMax: z.string().datetime().describe('End time in ISO 8601 format'),
  timeZone: z.string().optional().nullable().default('US/Central').describe('Time zone to use for the calendar')
})

export class GoogleCalendarReadTool {
  private client: OAuth2Client

  constructor(client: OAuth2Client) {
    this.client = client
  }

  getTool() {
    return tool(
      async ({ timeMin, timeMax, timeZone = 'US/Central' }) => {
        try {
          const calendar = google.calendar({ version: 'v3', auth: this.client })
          const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            timeZone,
            singleEvents: true,
            orderBy: 'startTime'
          })

          return JSON.stringify({
            status: 'success',
            startDate: timeMin,
            endDate: timeMax,
            events: response.data.items
          })
        } catch (e: any) {
          return JSON.stringify({
            status: 'error',
            message: e.message
          })
        }
      },
      {
        name: 'GoogleCalendarReadTool',
        description: "Check a user's schedule between the given date times on their Google calendar",
        schema: toolSchema
      }
    )
  }
}
