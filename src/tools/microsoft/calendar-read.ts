
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { Client } from '@microsoft/microsoft-graph-client'

const toolSchema = z.object({
  timeMin: z.string().datetime().describe('Start time in ISO 8601 format'),
  timeMax: z.string().datetime().describe('End time in ISO 8601 format'),
  timeZone: z.string().optional().nullable().default('US/Central').describe('Time zone to use for the calendar'),
})

export class MicrosoftCalendarReadTool {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  getTool() {
    return tool(
      async ({ timeMin, timeMax, timeZone = 'US/Central' }) => {
        const client = Client.init({
          authProvider: (done) => {
            done(null, this.accessToken)
          },
        })

        const response = await client
          .api('/me/calendarview')
          .header('Prefer', `outlook.timezone="${timeZone || 'UTC'}"`)
          .query({
            startDateTime: timeMin,
            endDateTime: timeMax,
            orderby: 'start/dateTime',
          })
          .get()

        return JSON.stringify({
          status: 'success',
          startDate: timeMin,
          endDate: timeMax,
          events: response.value,
        })
      },
      {
        name: 'MicrosoftCalendarReadTool',
        description: "Check a user's schedule between the given date times on their Microsoft calendar",
        schema: toolSchema,
      }
    )
  }
}
