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
import { SalesforceQueryTool, SalesforceCreateTool, SalesforceSearchTool } from '@/tools/salesforce'

const AGENT_SYSTEM_TEMPLATE = `
You are a personal assistant named Assistant0. You are a helpful assistant that can answer questions and help with tasks. 
You have access to a set of tools, use the tools as needed to answer the user's question.

Before using any service-specific tools (Microsoft, Salesforce, Google), check if the service is active using the ServiceStatusTool.
If a requested service is not active, inform the user they need to authenticate with that service first.

Current time information:
- Current date and time: ${new Date().toLocaleString('en-US', { timeZone: 'US/Central' })} US/Central
- Current ISO timestamp: ${new Date().toISOString()}

IMPORTANT: When using tools that create or modify data (like calendar events, files, or emails):
1. Call the tool exactly once
2. Wait for the response
3. Do not retry on failure
4. Report the result to the user

Use Microsoft calendar tools to check or create events in the user's Microsoft calendar.
Use Microsoft file tools to examine files in the user's OneDrive.
Use Google calendar tools to check or create events in the user's Google calendar.
Use Google mail tools to read or send emails in the user's Google mailbox.
Use Salesforce tools to query or create records in Salesforce.

Render the email body as a markdown block. Do not wrap it in code blocks.
`

const getAvailableTools = async (intent?: string) => {
  const tools: ToolInterface[] = [ServiceStatusTool]
  const activeServices = await getConnectedServices()
  
  // Get Microsoft token if needed
  let microsoftToken: string | undefined
  if (activeServices.includes('microsoft')) {
    microsoftToken = await getAccessToken('windowslive')
  }
  
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
    selectedTools.push(SalesforceQueryTool, SalesforceCreateTool, SalesforceSearchTool)
  }

  if (activeServices.includes('google')) {
    const googleTools = {
      mail: [GoogleMailReadTool, GoogleMailWriteTool],
      calendar: [GoogleCalendarReadTool, GoogleCalendarWriteTool],
      files: [GoogleDriveListTool, GoogleDriveReadTool, GoogleDriveWriteTool]
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

    //Infer intent from user message -  This is a placeholder and needs a more robust implementation
    const intent = body.messages[body.messages.length -1].content.toLowerCase().includes('onedrive') ? 'files' : undefined;
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
    })

    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' })
    const transformedStream = logToolCallsInDevelopment(eventStream)
    return LangChainAdapter.toDataStreamResponse(transformedStream)
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}