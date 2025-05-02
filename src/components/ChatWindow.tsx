'use client'

import { type Message } from 'ai'
import { useChat } from '@ai-sdk/react'
import { useState, useEffect } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { toast } from 'sonner'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'
import { ArrowDown, ArrowUpIcon, LoaderCircle } from 'lucide-react'

import { FederatedConnectionInterruptHandler } from '@/components/auth0-ai/FederatedConnections/FederatedConnectionInterruptHandler'
import type { Interrupt } from '@langchain/langgraph-sdk'

import { ChatMessageBubble } from '@/components/ChatMessageBubble'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

function ChatMessages(props: {
  messages: Message[]
  emptyStateComponent: ReactNode
  aiEmoji?: string
  className?: string
  isStreaming?: boolean
}) {
  return (
    <div className="flex flex-col max-w-[1200px] mx-auto pb-12 w-full">
      <div className="w-full">
        <div className="overflow-y-auto">
          {props.messages.map((m, i) => {
            return (
              <ChatMessageBubble
                key={m.id}
                message={m}
                aiEmoji={props.aiEmoji}
                isLoading={
                  m.role === 'assistant' && props.messages.indexOf(m) === props.messages.length - 1 && props.isStreaming
                }
                onServiceConnect={props.onServiceConnect}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  if (isAtBottom) return null
  return (
    <Button variant="outline" className={props.className} onClick={() => scrollToBottom()}>
      <ArrowDown className="w-4 h-4" />
      <span>Scroll to bottom</span>
    </Button>
  )
}

function ChatInput(props: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  loading?: boolean
  placeholder?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation()
        e.preventDefault()
        props.onSubmit(e)
      }}
      className={cn('flex w-full flex-col', props.className)}
    >
      <div className="border border-input bg-background rounded-lg flex flex-col gap-2 max-w-[768px] w-full mx-auto">
        <input
          value={props.value}
          placeholder={props.placeholder}
          onChange={props.onChange}
          className="border-none outline-none bg-transparent p-4"
        />

        <div className="flex justify-between ml-4 mr-2 mb-2">
          <div className="flex gap-3">{props.children}</div>

          <Button
            className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
            type="submit"
            disabled={props.loading}
          >
            {props.loading ? <LoaderCircle className="animate-spin" /> : <ArrowUpIcon size={14} />}
          </Button>
        </div>
      </div>
    </form>
  )
}

function StickyToBottomContent(props: {
  content: ReactNode
  footer?: ReactNode
  className?: string
  contentClassName?: string
}) {
  const context = useStickToBottomContext()

  // scrollRef will also switch between overflow: unset to overflow: auto
  return (
    <div
      ref={context.scrollRef}
      style={{ width: '100%', height: '100%' }}
      className={cn('grid grid-rows-[1fr,auto]', props.className)}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  )
}

export function ChatWindow(props: {
  endpoint: string
  emptyStateComponent: ReactNode
  placeholder?: string
  emoji?: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const chat = useChat({
    api: props.endpoint,
    fetch: (input, init = {}) => {
      const controller = new AbortController()
      setAbortController(controller)

      init.signal = controller.signal
      return fetch(input, init)
    },
    initialMessages: messages,
    onFinish(response) {
      console.log('Final response: ', response?.content)
      localStorage.setItem('chatHistory', JSON.stringify(chat.messages))
    },
    onResponse(response) {
      console.log('Response received. Status:', response.status)
    },
    onError: (e) => {
      console.error('Error: ', e)
      toast.error(`Error while processing your request`, { description: e.message })
    },
  })

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chat.messages))
  }, [chat.messages])

  function isChatLoading(): boolean {
    return chat.isLoading
  }

  const interrupt: Interrupt = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
  }
  
  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isChatLoading()) return
    chat.handleSubmit(e)
  }

  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={
          isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoaderCircle className="animate-spin" />
            </div>
          ) : chat.messages.length === 0 ? (
            <div>{props.emptyStateComponent}</div>
          ) : (
            <>
              <ChatMessages
                aiEmoji={props.emoji}
                messages={chat.messages}
                emptyStateComponent={props.emptyStateComponent}
                isStreaming={isChatLoading()}
              />
              <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
                <FederatedConnectionInterruptHandler interrupt={interrupt} onFinish={() => chat.handleSubmit()} />
              </div>
            </>
          )
        }
        footer={
          <div className="sticky bottom-8 px-2">
            <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4" />
            <ChatInput
              value={chat.input}
              onChange={chat.handleInputChange}
              onSubmit={sendMessage}
              loading={isChatLoading()}
              placeholder={props.placeholder ?? 'What can I help you with?'}
            ></ChatInput>
          </div>
        }
      ></StickyToBottomContent>
    </StickToBottom>
  )
}