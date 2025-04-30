import { NextRequest, NextResponse } from 'next/server'
import { ToolInterface } from '@langchain/core/tools'
import { type Message, LangChainAdapter } from 'ai'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'
import { SystemMessage } from '@langchain/core/messages'
import { LangChainTracer } from 'langchain/callbacks'
import { convertVercelMessageToLangChainMessage } from '@/utils/message-converters'
import { logToolCallsInDevelopment } from '@/utils/stream-logging'
import { getAccessToken, getConnectedServices } from '@/lib/auth0'

// import general tools
import ServiceStatusTool from '@/tools/system/service-status'

// import Google tools
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import {
  GoogleMailReadTool,
  GoogleMailWriteTool,
  GoogleCalendarReadTool,
  GoogleCalendarWriteTool,
  GoogleDriveListTool,
  GoogleDriveReadTool,
  GoogleDriveWriteTool
} from '@/tools/google'

// import Microsoft tools
import {
  MicrosoftMailReadTool,
  MicrosoftMailWriteTool,
  MicrosoftCalendarReadTool,
  MicrosoftCalendarWriteTool,
  MicrosoftFilesReadTool,
  MicrosoftFilesWriteTool,
  MicrosoftFilesListTool,
} from '@/tools/microsoft'

// import Salesforce tools
import jsforce from 'jsforce'
import { SalesforceQueryTool, SalesforceCreateTool, SalesforceSearchTool } from '@/tools/salesforce'

const AGENT_SYSTEM_TEMPLATE = `
You are a personal assistant named Assistant0. You are a helpful assistant that can answer questions and help with tasks. 
You have access to a set of tools, use the tools as needed to answer the user's question.

TOOL SELECTION RULES:
1. Always check service status first using ServiceStatusTool before using any service-specific tools
2. Only use tools that are directly relevant to the user's request
3. Do not use calendar tools unless explicitly asked about calendar/schedule/meetings
4. Do not mix tools from different services unless specifically requested

SERVICE-SPECIFIC INSTRUCTIONS:
- Salesforce: Use for CRM queries, opportunities, accounts, contacts
  - SalesforceQueryTool: For SOQL queries
  - SalesforceCreateTool: For creating new records
  - SalesforceSearchTool: For text search across objects

- Microsoft:
  - OneDrive (files): Use for document/file operations
  - Calendar: Use only for meeting/schedule related tasks
  - Email: Use for Outlook email operations

- Google:
  - Drive: Use for Google document/file operations
  - Calendar: Use only for meeting/schedule related tasks
  - Gmail: Use for email operations

Current time information:
- Current date and time: ${new Date().toLocaleString('en-US', { timeZone: 'US/Central' })} US/Central
- Current ISO timestamp: ${new Date().toISOString()}

IMPORTANT: For data modification operations:
1. Call the tool exactly once
2. Wait for the response
3. Do not retry on failure
4. Report the result to the user

Render email bodies as markdown blocks without code block wrapping.
`

function inferIntent(message: string): string | undefined {
  message = message.toLowerCase()
  
  // Service-specific keywords
  if (message.includes('salesforce') || 
      message.includes('opportunity') || 
      message.includes('account') || 
      message.includes('contact')) {
    return 'salesforce'
  }
  
  // File operations
  if (message.includes('onedrive') || 
      message.includes('file') || 
      message.includes('document') ||
      message.includes('folder')) {
    return 'files'
  }
  
  // Calendar operations
  if (message.includes('calendar') || 
      message.includes('schedule') || 
      message.includes('meeting') ||
      message.includes('appointment')) {
    return 'calendar'
  }
  
  // Email operations
  if (message.includes('email') || 
      message.includes('mail') || 
      message.includes('gmail') ||
      message.includes('outlook')) {
    return 'mail'
  }
  
  return undefined
}

const getAvailableTools = async (intent?: string) => {
  const tools: ToolInterface[] = [ServiceStatusTool]
  const activeServices = await getConnectedServices()

  // Get Microsoft token if needed
  let microsoftToken: string | undefined
  if (activeServices.includes('microsoft')) {
    microsoftToken = await getAccessToken('windowslive')
  }

  const googleClient: OAuth2Client = new google.auth.OAuth2()
  if (activeServices.includes('google')) {
    const token = await getAccessToken('google-oauth2')
    googleClient.setCredentials({ access_token: token })
  }

  const salesforceClient = new jsforce.Connection({
    instanceUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
    accessToken: await getAccessToken('salesforce-dev'),
  })

  // Build tool list based on active services and intent
  const selectedTools = []

  if (microsoftToken) {
    const microsoftTools = {
      files: [
        new MicrosoftFilesListTool(microsoftToken).getTool(),
        new MicrosoftFilesReadTool(microsoftToken).getTool(),
        new MicrosoftFilesWriteTool(microsoftToken).getTool()
      ],
      calendar: [
        new MicrosoftCalendarReadTool(microsoftToken).getTool(),
        new MicrosoftCalendarWriteTool(microsoftToken).getTool()
      ],
      mail: [
        new MicrosoftMailReadTool(microsoftToken).getTool(),
        new MicrosoftMailWriteTool(microsoftToken).getTool()
      ]
    }

    if (intent === 'files') selectedTools.push(...microsoftTools.files)
    else if (intent === 'calendar') selectedTools.push(...microsoftTools.calendar)
    else if (intent === 'mail') selectedTools.push(...microsoftTools.mail)
    else selectedTools.push(...Object.values(microsoftTools).flat())
  }

  if (activeServices.includes('salesforce') && intent === 'salesforce') {
    selectedTools.push(
      new SalesforceQueryTool(salesforceClient).getTool(),
      new SalesforceCreateTool(salesforceClient).getTool(),
      new SalesforceSearchTool(salesforceClient).getTool()
    )
  }

  if (activeServices.includes('google')) {
    const googleTools = {
      mail: [
        new GoogleMailReadTool(googleClient).getTool(),
        new GoogleMailWriteTool(googleClient).getTool()
      ],
      calendar: [
        new GoogleCalendarReadTool(googleClient).getTool(),
        new GoogleCalendarWriteTool(googleClient).getTool()
      ],
      files: [
        new GoogleDriveListTool(googleClient).getTool(),
        new GoogleDriveReadTool(googleClient).getTool(),
        new GoogleDriveWriteTool(googleClient).getTool()
      ]
    }

    if (intent === 'mail') selectedTools.push(...googleTools.mail)
    else if (intent === 'calendar') selectedTools.push(...googleTools.calendar)
    else if (intent === 'files') selectedTools.push(...googleTools.files)
    else selectedTools.push(...Object.values(googleTools).flat())
  }

  return [...tools, ...selectedTools]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages = (body.messages ?? [])
      .filter((message: Message) => message.role === 'user' || message.role === 'assistant')
      .map(convertVercelMessageToLangChainMessage)

    let tracer
    if (process.env.LANGSMITH_TRACING === 'true') {
      tracer = new LangChainTracer({
        projectName: process.env.LANGSMITH_PROJECT || 'default',
      })
    }

    const lastMessage = body.messages[body.messages.length - 1].content
    const intent = inferIntent(lastMessage)
    const tools = await getAvailableTools(intent)

    const llm = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      temperature: 0,
    })
      .bind({
        tools: tools,
      })
      .withConfig({
        tags: ['chat-api'],
        callbacks: tracer ? [tracer] : undefined,
      })

    const agent = createReactAgent({
      llm,
      tools,
      messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
      config: {
        recursionLimit: 50
      }
    })

    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' })
    const transformedStream = logToolCallsInDevelopment(eventStream)
    return LangChainAdapter.toDataStreamResponse(transformedStream)
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}