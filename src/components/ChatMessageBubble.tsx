import type { Message } from 'ai'
import { MemoizedMarkdown } from './MemoizedMarkdown'
import { Button } from './ui/button'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import type { SupportedService } from '@/lib/services'

interface ChatMessageBubbleProps {
  message: Message
  aiEmoji?: string
  isLoading?: boolean
}

export function ChatMessageBubble({ message, aiEmoji, isLoading, onServiceConnect }: ChatMessageBubbleProps) {
  const [serviceToAuth, setServiceToAuth] = useState<SupportedService | null>(null)

  return (
      <div className={`rounded-[24px] max-w-fit mb-8 flex flex-col ${
        message.role === 'user' 
          ? 'bg-secondary text-secondary-foreground px-4 py-2 ml-auto' 
          : 'mr-auto'
      }`}>
        {message.role !== 'user' && (
          <div className="mr-4 border bg-secondary -mt-2 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
            {aiEmoji}
          </div>
        )}
        <div className="chat-message-bubble whitespace-pre-wrap flex flex-col prose dark:prose-invert max-w-none">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <LoaderCircle className="animate-spin" />
              <span>Thinking...</span>
            </div>
          ) : (
            <MemoizedMarkdown>{message.content}</MemoizedMarkdown>
          )}
        </div>
      </div>
  )
}
