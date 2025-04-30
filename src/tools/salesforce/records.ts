
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { Connection } from 'jsforce'

const querySchema = z.object({
  query: z.string().describe('The SOQL query to execute'),
})

export class SalesforceQueryTool {
  private client: Connection

  constructor(client: Connection) {
    this.client = client
  }

  getTool() {
    return tool(
      async ({ query }) => {
        try {
          const result = await this.client.query(query)
          return JSON.stringify({
            status: 'success',
            totalSize: result.totalSize,
            records: result.records,
          })
        } catch (e: any) {
          return JSON.stringify({
            status: 'error',
            message: e.message,
          })
        }
      },
      {
        name: 'SalesforceQueryTool',
        description: 'Query Salesforce records using SOQL',
        schema: querySchema,
      }
    )
  }
}

const createSchema = z.object({
  objectType: z.string().describe('The Salesforce object type (e.g., Account, Contact)'),
  data: z.record(z.any()).describe('The record data to create'),
})

export class SalesforceCreateTool {
  private client: Connection

  constructor(client: Connection) {
    this.client = client
  }

  getTool() {
    return tool(
      async ({ objectType, data }) => {
        try {
          const result = await this.client.sobject(objectType).create(data)
          return JSON.stringify({
            status: 'success',
            id: result.id,
            success: result.success,
          })
        } catch (e: any) {
          return JSON.stringify({
            status: 'error',
            message: e.message,
          })
        }
      },
      {
        name: 'SalesforceCreateTool',
        description: 'Create a new record in Salesforce',
        schema: createSchema,
      }
    )
  }
}
