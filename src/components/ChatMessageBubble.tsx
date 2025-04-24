import type { Message } from 'ai';
import { MemoizedMarkdown } from './MemoizedMarkdown';
import { Button } from './ui/button';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { ServiceAuthDialog } from './ServiceAuthDialog';
import { cn } from '@/utils/cn';

interface ChatMessageBubbleProps {
  message: Message;
  aiEmoji?: string;
  isLoading?: boolean;
}

export function ChatMessageBubble({ message, aiEmoji, isLoading }: ChatMessageBubbleProps) {
  

  const handleAuthClick = async (service: 'microsoft' | 'salesforce' | 'google') => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Set up message listener
    const messageHandler = async (event: MessageEvent) => {
      if (event.data.type === 'AUTH_COMPLETE') {
        window.removeEventListener('message', messageHandler);
        
        // Check if service is now active
        const response = await fetch('/api/services/status');
        const data = await response.json();
        
        if (data.activeServices.includes(event.data.service)) {
          toast.success(`Successfully connected to ${event.data.service}`);
          
          // Get updated service statuses
          const statusResponse = await fetch('/api/services/status');
          const statusData = await statusResponse.json();
          
          const serviceStatusList = ['microsoft', 'salesforce', 'google']
            .map(s => `- ${s.charAt(0).toUpperCase() + s.slice(1)}: ${statusData.activeServices.includes(s) ? '✅ Connected' : '❌ Not connected'}`)
            .join('\n');

          // Create success message
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [{
                role: 'assistant',
                content: `Great! ${event.data.service.charAt(0).toUpperCase() + event.data.service.slice(1)} has been successfully connected.\n\nCurrent service status:\n${serviceStatusList}\n\nHow can I help you?`
              }]
            })
          });
        }
      } else if (event.data.type === 'AUTH_ERROR') {
        window.removeEventListener('message', messageHandler);
        toast.error(`Failed to connect: ${event.data.error}`);
      }
    };

    window.addEventListener('message', messageHandler);

    const popup = window.open(
      `/api/auth/${service}`,
      'Auth0 Login',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (!popup) {
      toast.error('Please enable popups for this site');
      return;
    }

    toast.info('Waiting for authentication...');

    // Poll for popup closure
    const pollTimer = window.setInterval(async () => {
      if (popup.closed) {
        window.clearInterval(pollTimer);
        
        // Wait a moment for service registration to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if service is now active
        const response = await fetch('/api/services/status');
        const data = await response.json();
        
        if (data.activeServices.includes(service)) {
          toast.success(`Successfully connected to ${service}`);
          // Create a new AI message indicating success
          // Get service statuses
          const statusResponse = await fetch('/api/services/status');
          const statusData = await statusResponse.json();
          
          const serviceStatusList = ['microsoft', 'salesforce', 'google']
            .map(s => `- ${s.charAt(0).toUpperCase() + s.slice(1)}: ${statusData.activeServices.includes(s) ? '✅ Connected' : '❌ Not connected'}`)
            .join('\n');

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [{
                role: 'assistant',
                content: `Great! ${service.charAt(0).toUpperCase() + service.slice(1)} has been successfully connected.\n\nCurrent service status:\n${serviceStatusList}\n\nHow can I help you?`
              }]
            })
          });
        } else {
          toast.error(`Failed to connect to ${service}. Please try again.`);
        }
        window.location.reload(); // Refresh to update auth state
      }
    }, 200);
  };

  // Check if message contains service connection request
  const checkForServiceRequest = (content: string) => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('microsoft') && (
      lowerContent.includes('connect') || 
      lowerContent.includes('authenticate') || 
      lowerContent.includes('login') ||
      lowerContent.includes('sign in')
    )) {
      return 'microsoft';
    } else if (lowerContent.includes('salesforce') && (
      lowerContent.includes('connect') || 
      lowerContent.includes('authenticate') ||
      lowerContent.includes('login') ||
      lowerContent.includes('sign in')
    )) {
      return 'salesforce';
    } else if (lowerContent.includes('google') && (
      lowerContent.includes('connect') || 
      lowerContent.includes('authenticate') ||
      lowerContent.includes('login') ||
      lowerContent.includes('sign in')
    )) {
      return 'google';
    }
    return null;
  };

  const service = message.role === 'assistant' ? checkForServiceRequest(message.content) : null;

  return (
    <>
      <div
        className={cn(
          `rounded-[24px] max-w-[80%] mb-8 flex flex-col`,
          message.role === 'user' ? 'bg-secondary text-secondary-foreground px-4 py-2' : null,
          message.role === 'user' ? 'ml-auto' : 'mr-auto',
        )}
      >
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
            <MemoizedMarkdown 
              components={{
                button: ({node, ...props}) => {
                  const service = props.className?.includes('microsoft') 
                    ? 'microsoft' 
                    : props.className?.includes('salesforce')
                    ? 'salesforce'
                    : props.className?.includes('google')
                    ? 'google'
                    : null;

                  if (service) {
                    return (
                      <Button
                        variant="outline"
                        onClick={() => handleServiceAuth(service)}
                        className="mt-2"
                      >
                        Connect {service}
                      </Button>
                    );
                  }
                  return <Button {...props} />;
                }
              }}
            >
              {message.content}
            </MemoizedMarkdown>
          )}
        </div>
        {service && (
          <div className="mt-2">
            <Button onClick={() => handleAuthClick(service)} variant="outline">
              Connect to {service.charAt(0).toUpperCase() + service.slice(1)}
            </Button>
          </div>
        )}
      </div>
      
    </>
  );
}