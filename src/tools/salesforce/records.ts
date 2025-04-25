import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { getSalesforceClient } from './auth'

const querySchema = z.object({
  query: z.string().describe('The SOQL query to execute'),
})

export const SalesforceQueryTool = tool(
  async ({ query }) => {
    try {
      const conn = await getSalesforceClient()
      const result = await conn.query(query)
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
  },
)

const createSchema = z.object({
  objectType: z.string().describe('The Salesforce object type (e.g., Account, Contact)'),
  data: z.record(z.any()).describe('The record data to create'),
})

export const SalesforceCreateTool = tool(
  async ({ objectType, data }) => {
    try {
      const conn = await getSalesforceClient()
      const result = await conn.sobject(objectType).create(data)
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
  },
)
