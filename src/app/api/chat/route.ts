import { NextRequest, NextResponse } from 'next/server';
import { type Message, LangChainAdapter } from 'ai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage } from '@langchain/core/messages';
import { Calculator } from '@langchain/community/tools/calculator';
import { SerpAPI } from '@langchain/community/tools/serpapi';
import { LangChainTracer } from "langchain/callbacks";

import {
    MicrosoftMailReadTool,
    MicrosoftMailWriteTool,
    MicrosoftCalendarReadTool,
    MicrosoftCalendarWriteTool,
    MicrosoftFilesReadTool,
    MicrosoftFilesWriteTool,
    MicrosoftFilesListTool,
} from '@/tools/microsoft';

import { convertVercelMessageToLangChainMessage } from '@/utils/message-converters';
import { logToolCallsInDevelopment } from '@/utils/stream-logging';

const AGENT_SYSTEM_TEMPLATE = `
You are a personal assistant named Assistant0. You are a helpful assistant that can answer questions and help with tasks. 
You have access to a set of tools, use the tools as needed to answer the user's question.

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

const tools = [
    new Calculator(),
    new SerpAPI(),
    MicrosoftCalendarReadTool,
    MicrosoftCalendarWriteTool,
    MicrosoftFilesListTool,
    MicrosoftFilesReadTool,
    MicrosoftFilesWriteTool,
    MicrosoftMailReadTool,
    MicrosoftMailWriteTool,
];

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const messages = (body.messages ?? [])
            .filter((message: Message) => message.role === 'user' || message.role === 'assistant')
            .map(convertVercelMessageToLangChainMessage);

        const tracer = new LangChainTracer({
            projectName: process.env.LANGSMITH_PROJECT
        });

        const llm = new ChatOpenAI({
            modelName: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
            temperature: 0,
        }).bind({
            functions: tools.map(tool => tool.schema),
        }).withConfig({
            tags: ["chat-api"],
            callbacks: [tracer]
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