import { NextRequest, NextResponse } from 'next/server';
import { type Message, LangChainAdapter } from 'ai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage } from '@langchain/core/messages';
// import { Calculator } from '@langchain/community/tools/calculator';
// import { SerpAPI } from '@langchain/community/tools/serpapi';
import { LangChainTracer } from "langchain/callbacks";
import { serviceRegistry } from '@/lib/service-registry'

// import Google tools
import { GmailSearch } from '@langchain/community/tools/gmail';
import { GmailCreateDraft } from '@langchain/community/tools/gmail';
import { GoogleCalendarCreateTool, GoogleCalendarViewTool } from '@langchain/community/tools/google_calendar';

// import Microsoft tools
import {
    MicrosoftMailReadTool,
    MicrosoftMailWriteTool,
    MicrosoftCalendarReadTool,
    MicrosoftCalendarWriteTool,
    MicrosoftFilesReadTool,
    MicrosoftFilesWriteTool,
    MicrosoftFilesListTool,
} from '@/tools/microsoft';

// import Salesforce tools
import { 
    SalesforceQueryTool, 
    SalesforceCreateTool, 
    SalesforceSearchTool 
} from '@/tools/salesforce'

import { convertVercelMessageToLangChainMessage } from '@/utils/message-converters';
import { logToolCallsInDevelopment } from '@/utils/stream-logging';

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

Render the email body as a markdown block. Do not wrap it in code blocks.
`;

import { ServiceStatusTool } from '@/tools/system/service-status'

const getAvailableTools = () => {
    const tools = [ServiceStatusTool]
    
    if (serviceRegistry.isServiceActive('microsoft')) {
        tools.push(
            MicrosoftCalendarReadTool,
            MicrosoftCalendarWriteTool,
            MicrosoftFilesListTool,
            MicrosoftFilesReadTool,
            MicrosoftFilesWriteTool,
            MicrosoftMailReadTool,
            MicrosoftMailWriteTool
        )
    }

    if (serviceRegistry.isServiceActive('salesforce')) {
        tools.push(
            SalesforceQueryTool,
            SalesforceCreateTool,
            SalesforceSearchTool
        )
    }

    if (serviceRegistry.isServiceActive('google')) {
        tools.push(
            GmailSearch,
            GmailCreateDraft,
            GoogleCalendarCreateTool,
            GoogleCalendarViewTool,
        )
    }
    
    return tools
}

const tools = getAvailableTools()

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const messages = (body.messages ?? [])
            .filter((message: Message) => message.role === 'user' || message.role === 'assistant')
            .map(convertVercelMessageToLangChainMessage);

        let tracer;
        if (process.env.LANGSMITH_TRACING === 'true') {
            tracer = new LangChainTracer({
                projectName: process.env.LANGSMITH_PROJECT || "default",
            });
        }

        const llm = new ChatOpenAI({
            modelName: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
            temperature: 0,
        }).bind({
            tools: tools,
        }).withConfig({
            tags: ["chat-api"],
            callbacks: tracer ? [tracer] : undefined
        });

        const agent = createReactAgent({
            llm,
            tools,
            messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
        });

        const eventStream = agent.streamEvents({ messages }, { version: 'v2' });
        const transformedStream = logToolCallsInDevelopment(eventStream);
        return LangChainAdapter.toDataStreamResponse(transformedStream);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
    }
}