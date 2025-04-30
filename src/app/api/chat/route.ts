import { NextRequest, NextResponse } from 'next/server'
import { ToolInterface } from '@langchain/core/tools'
import { type Message, LangChainAdapter } from 'ai'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'
import { SystemMessage } from '@langchain/core/messages'
import { LangChainTracer } from 'langchain/callbacks'
import { convertVercelMessageToLangChainMessage } from '@/utils/message-converters'
import { logToolCallsInDevelopment } from '@/utils/stream-logging'
import { getConnectedServices } from '@/lib/auth0'

// import general tools
import { ServiceStatusTool } from '@/tools/system/service-status'

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
import { getMicrosoftAccessToken } from '@/tools/microsoft/auth'

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

  // Only load specific tools based on intent or context
  if (activeServices.includes('microsoft')) {
    const microsoftTools = {
      files: [MicrosoftFilesListTool, MicrosoftFilesReadTool, MicrosoftFilesWriteTool],
      calendar: [MicrosoftCalendarReadTool, MicrosoftCalendarWriteTool],
      mail: [MicrosoftMailReadTool, MicrosoftMailWriteTool]
    }

    if (intent === 'files') {
      tools.push(...microsoftTools.files)
    } else if (intent === 'calendar') {
      tools.push(...microsoftTools.calendar)
    } else if (intent === 'mail') {
      tools.push(...microsoftTools.mail)
    } else {
      // If no specific intent, load all Microsoft tools
      tools.push(...[...microsoftTools.files, ...microsoftTools.calendar, ...microsoftTools.mail])
    }
  }

  if (activeServices.includes('salesforce') && intent === 'salesforce') {
    tools.push(SalesforceQueryTool, SalesforceCreateTool, SalesforceSearchTool)
  }

  if (activeServices.includes('google')) {

    const googleTools = {
      mail: [GoogleMailReadTool, GoogleMailWriteTool],
      calendar: [GoogleCalendarReadTool, GoogleCalendarWriteTool],
      files: [GoogleDriveListTool, GoogleDriveReadTool, GoogleDriveWriteTool]
    };

    if (intent === 'mail') {
      tools.push(...googleTools.mail)
    } else if (intent === 'calendar') {
      tools.push(...googleTools.calendar)
    } else if (intent === 'files') {
      tools.push(...googleTools.files)
    } else {
      tools.push(...Object.values(googleTools).flat())
    }
  }

  return tools
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
    
    // Get Microsoft token only if Microsoft services are enabled
    if (tools.some(tool => tool.name?.includes('Microsoft'))) {
      const accessToken = await getMicrosoftAccessToken()
      const calendarTool = new MicrosoftCalendarReadTool(accessToken).getTool()
      tools.push(calendarTool)
    }

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