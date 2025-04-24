import type { Message } from 'ai';
import { MemoizedMarkdown } from './MemoizedMarkdown';
import { Button } from './ui/button';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { ServiceAuthDialog } from './ServiceAuthDialog';

interface ChatMessageBubbleProps {
  message: Message;
  aiEmoji?: string;
  isLoading?: boolean;
}

export function ChatMessageBubble({ message, aiEmoji, isLoading }: ChatMessageBubbleProps) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<'microsoft' | 'salesforce' | 'google' | null>(null);

  const handleServiceAuth = (service: 'microsoft' | 'salesforce' | 'google') => {
    setSelectedService(service);
    setAuthDialogOpen(true);
  };

  return (
    <div
      className={cn(
        `rounded-[24px] max-w-[80%] mb-8 flex`,
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
      <ServiceAuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} service={selectedService} />
    </div>
  );
}