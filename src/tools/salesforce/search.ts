
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { Connection } from 'jsforce'

const searchSchema = z.object({
  searchTerm: z.string().describe('The search term to look for'),
  scope: z.array(z.string()).optional().describe('Optional array of object types to search within'),
})

export class SalesforceSearchTool {
  private client: Connection

  constructor(client: Connection) {
    this.client = client
  }

  getTool() {
    return tool(
      async ({ searchTerm, scope }) => {
        try {
          const result = await this.client.search(
            `FIND {${searchTerm}}${scope ? ` IN ALL FIELDS RETURNING ${scope.join(',')}` : ''}`
          )
          return JSON.stringify({
            status: 'success',
            searchRecords: result.searchRecords,
          })
        } catch (e: any) {
          return JSON.stringify({
            status: 'error',
            message: e.message,
          })
        }
      },
      {
        name: 'SalesforceSearchTool',
        description: 'Search across Salesforce records using SOSL',
        schema: searchSchema,
      }
    )
  }
}
