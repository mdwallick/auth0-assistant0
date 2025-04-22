import { NextRequest, NextResponse } from 'next/server';
import { type Message, LangChainAdapter } from 'ai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage } from '@langchain/core/messages';
import { Calculator } from '@langchain/community/tools/calculator';
import { SerpAPI } from '@langchain/community/tools/serpapi';
import { LangSmithTracer } from "@langchain/core/tracers/langsmith";

// import { GmailSearch } from '@langchain/community/tools/gmail';
// import { GmailCreateDraft } from '@langchain/community/tools/gmail';
// import { GoogleCalendarCreateTool, GoogleCalendarViewTool } from '@langchain/community/tools/google_calendar';
// import { getGoogleAccessToken } from '@/lib/auth0';

// import microsoft tools
import {
    MicrosoftMailReadTool,
    MicrosoftMailWriteTool,
    MicrosoftCalendarReadTool,
    MicrosoftCalendarWriteTool,
    MicrosoftFilesReadTool,
    MicrosoftFilesListTool,
    MicrosoftFilesWriteTool,
} from '@/tools/microsoft';

import { convertVercelMessageToLangChainMessage } from '@/utils/message-converters';
import { logToolCallsInDevelopment } from '@/utils/stream-logging';

//const AGENT_SYSTEM_TEMPLATE = `You are a personal assistant named Assistant0. You are a helpful assistant that can answer questions and help with tasks. You have access to a set of tools, use the tools as needed to answer the user's question. Render the email body as a markdown block, do not wrap it in code blocks.`;
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

/**
 * This handler initializes and calls an tool calling ReAct agent.
 * See the docs for more information:
 *
 * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        /**
         * We represent intermediate steps as system messages for display purposes,
         * but don't want them in the chat history.
         */
        const messages = (body.messages ?? [])
            .filter((message: Message) => message.role === 'user' || message.role === 'assistant')
            .map(convertVercelMessageToLangChainMessage);

        const tracer = new LangSmithTracer({
            projectName: process.env.LANGSMITH_PROJECT
        });

        const llm = new ChatOpenAI({
            model: process.env.OPENAI_MODEL,
            temperature: 0,
        }).withConfig({
            tags: ["chat-api"],
            callbacks: [tracer]
        });

        // Get the access token via Auth0
        // const accessToken = await getGoogleAccessToken();

        // Provide the access token to the Gmail tools
        // const gmailParams = {
        //     credentials: { accessToken },
        // };

        // const googleCalendarParams = {
        //     credentials: { accessToken, calendarId: 'primary' },
        //     model: llm,
        // };

        const tools = [
            new Calculator(),
            // Requires process.env.SERPAPI_API_KEY to be set: https://serpapi.com/
            new SerpAPI(),
            // new GmailSearch(gmailParams),
            // new GmailCreateDraft(gmailParams),
            // new GoogleCalendarCreateTool(googleCalendarParams),
            // new GoogleCalendarViewTool(googleCalendarParams),
            MicrosoftCalendarReadTool,
            MicrosoftCalendarWriteTool,
            MicrosoftFilesListTool,
            MicrosoftFilesReadTool,
            MicrosoftFilesWriteTool,
            MicrosoftMailReadTool,
            MicrosoftMailWriteTool,
        ];

        //console.log('Final messages:', JSON.stringify(messages, null, 2));

        /**
         * Use a prebuilt LangGraph agent.
         */
        const agent = createReactAgent({
            llm,
            tools,
            /**
             * Modify the stock prompt in the prebuilt agent. See docs
             * for how to customize your agent:
             *
             * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
             */
            messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
        });

        /**
         * Stream back all generated tokens and steps from their runs.
         *
         * See: https://langchain-ai.github.io/langgraphjs/how-tos/stream-tokens/
         */
        const eventStream = agent.streamEvents({ messages }, { version: 'v2' });

        // Log tool calling data. Only in development mode
        const transformedStream = logToolCallsInDevelopment(eventStream);
        // Adapt the LangChain stream to Vercel AI SDK Stream
        return LangChainAdapter.toDataStreamResponse(transformedStream);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
    }
}