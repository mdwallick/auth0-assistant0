import type { Message } from 'ai'
import { MemoizedMarkdown } from './MemoizedMarkdown'
import { Button } from './ui/button'
import { LoaderCircle } from 'lucide-react'
import { ServiceAuthDialog } from './ServiceAuthDialog'
import { useState } from 'react'
import type { SupportedService } from '@/lib/services'

interface ChatMessageBubbleProps {
  message: Message
  aiEmoji?: string
  isLoading?: boolean
  onServiceConnect?: (service: SupportedService) => void
}

export function ChatMessageBubble({ message, aiEmoji, isLoading, onServiceConnect }: ChatMessageBubbleProps) {
  const [serviceToAuth, setServiceToAuth] = useState<SupportedService | null>(null)

  // Check if message contains service connection request
  const checkForServiceRequest = (content: string): SupportedService | null => {
    const lowerContent = content.toLowerCase()
    if (lowerContent.includes('microsoft') && 
      (lowerContent.includes('connect') || lowerContent.includes('authenticate') || 
       lowerContent.includes('login') || lowerContent.includes('sign in'))) {
      return 'microsoft'
    } else if (lowerContent.includes('salesforce') && 
      (lowerContent.includes('connect') || lowerContent.includes('authenticate') || 
       lowerContent.includes('login') || lowerContent.includes('sign in'))) {
      return 'salesforce'
    } else if (lowerContent.includes('google') && 
      (lowerContent.includes('connect') || lowerContent.includes('authenticate') || 
       lowerContent.includes('login') || lowerContent.includes('sign in'))) {
      return 'google'
    }
    return null
  }

  const service = message.role === 'assistant' ? checkForServiceRequest(message.content) : null

  return (
    <>
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
        {service && (
          <div className="mt-2">
            <Button onClick={() => setServiceToAuth(service)} variant="outline">
              Connect to {service.charAt(0).toUpperCase() + service.slice(1)}
            </Button>
          </div>
        )}
      </div>

      <ServiceAuthDialog
        service={serviceToAuth!}
        isOpen={!!serviceToAuth}
        onOpenChange={(open) => {
          if (!open) {
            setServiceToAuth(null)
          }
        }}
      />
    </>
  )
}