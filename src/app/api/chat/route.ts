import { NextRequest, NextResponse } from 'next/server'
//import { ToolInterface } from '@langchain/core/tools'
import { type Message, LangChainAdapter } from 'ai'
//import { createReactAgent } from '@langchain/langgraph/prebuilt'
//import { ChatOpenAI } from '@langchain/openai'
import { SystemMessage } from '@langchain/core/messages'
import { LangChainTracer } from 'langchain/callbacks'
import { convertVercelMessageToLangChainMessage } from '@/utils/message-converters'
import { logToolCallsInDevelopment } from '@/utils/stream-logging'
//import { getAccessToken, getConnectedServices } from '@/lib/auth0'
import { agent } from '@/lib/agent'

// import { 
//   getAccessToken,
//   withGoogleConnection,
//   withMicrosoftConnection,
//   withSalesforceConnection
// } from '@/lib/auth0-ai'

// import general tools
// import ServiceStatusTool from '@/tools/system/service-status'

// import Google tools
// import { google } from 'googleapis'
// import { OAuth2Client } from 'google-auth-library'
// import {
//   GoogleMailReadTool,
//   GoogleMailWriteTool,
//   GoogleCalendarReadTool,
//   GoogleCalendarWriteTool,
//   GoogleDriveListTool,
//   GoogleDriveReadTool,
//   GoogleDriveWriteTool
// } from '@/tools/google'

// import Microsoft tools
// import {
//   MicrosoftMailReadTool,
//   MicrosoftMailWriteTool,
//   MicrosoftCalendarReadTool,
//   MicrosoftCalendarWriteTool,
//   MicrosoftFilesReadTool,
//   MicrosoftFilesWriteTool,
//   MicrosoftFilesListTool,
// } from '@/tools/microsoft'

// import Salesforce tools
// import jsforce from 'jsforce'
// import { SalesforceQueryTool, SalesforceCreateTool, SalesforceSearchTool } from '@/tools/salesforce'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages = (body.messages ?? [])
      .filter((message: Message) => message.role === 'user' || message.role === 'assistant')
      .map(convertVercelMessageToLangChainMessage)

    // let tracer
    // if (process.env.LANGSMITH_TRACING === 'true') {
    //   tracer = new LangChainTracer({
    //     projectName: process.env.LANGSMITH_PROJECT || 'default',
    //   })
    // }

    // Refresh session to get latest connected services
    // await fetch(`${process.env.APP_BASE_URL || ''}/api/auth/update-session`, {
    //   method: 'POST',
    //   headers: {
    //     cookie: req.headers.get('cookie') || '',
    //   },
    // })

    // const lastMessage = body.messages[body.messages.length - 1].content
    // const intent = inferIntent(lastMessage)
    // const tools = await getAvailableTools(intent)

    
  //   const llm = new ChatOpenAI({
  //     modelName: process.env.OPENAI_MODEL || 'gpt-4o',
  //     temperature: 0,
  //   })
  //     .bind({
  //       tools: tools,
  //     })
  //     .withConfig({
  //       tags: ['chat-api'],
  //       callbacks: tracer ? [tracer] : undefined,
  //     })

  //   const agent = createReactAgent({
  //     llm,
  //     tools,
  //     messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
  //   })

    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' })
    const transformedStream = logToolCallsInDevelopment(eventStream)
    return LangChainAdapter.toDataStreamResponse(transformedStream)
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
  }
}