import { Message } from 'ai'
import { AIMessage, BaseMessage, ChatMessage, HumanMessage } from '@langchain/core/messages'

export const convertVercelMessageToLangChainMessage = (message: Message) => {
  // Handle case where content is an array of message parts (like { type: 'text', text: 'hi' })
  let content = ''

  if (Array.isArray(message.content)) {
    // Extract all text parts
    content = message.content
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
  } else {
    content = message.content as string
  }

  if (message.role === 'user') {
    return new HumanMessage(content)
  } else if (message.role === 'assistant') {
    return new AIMessage(content)
  } else {
    return new ChatMessage(content, message.role)
  }
}

export const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  const content = [{ type: 'text', text: message.content }] // ✅ CORRECT format

  switch (message.getType()) {
    case 'human':
      return { role: 'user', content }
    case 'ai':
      return {
        role: 'assistant',
        content,
        tool_calls: (message as AIMessage).tool_calls,
      }
    case 'tool':
      return { role: 'tool', content }
    case 'system':
      return { role: 'system', content }
    default:
      return { role: message.getType(), content }
  }
}
