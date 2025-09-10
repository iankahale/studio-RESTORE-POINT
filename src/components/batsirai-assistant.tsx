
"use client";

import { useState, useTransition, useRef, useEffect, KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { askBatsirai } from '@/ai/flows/batsirai-assistant-flow';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { AutoSizingTextarea } from './ui/autosize-textarea';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const chatSchema = z.object({
  prompt: z.string().min(1, 'Message cannot be empty.'),
});

type ChatFormValues = z.infer<typeof chatSchema>;

function parseSimpleMarkdown(text: string): string {
    // Convert **bold** to <strong>bold</strong>
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert * list items to • list items
    html = html.replace(/^\s*\*\s/gm, '• ');
    // Convert newlines to <br />
    html = html.replace(/\n/g, '<br />');
    return html;
}

export function BatsiraiAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
    defaultValues: { prompt: '' },
  });

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  };

  useEffect(() => {
    if(open && messages.length === 0){
        setMessages([
            { role: 'assistant', content: "Hello! I'm Batsirai, your personal assistant for the BBL Admins Portal. How can I help you?" }
        ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = (data: ChatFormValues) => {
    const userMessage: Message = { role: 'user', content: data.prompt };
    setMessages(prev => [...prev, userMessage]);
    form.reset();

    startTransition(async () => {
      try {
        const response = await askBatsirai({ question: data.prompt });
        
        if (response.answer) {
             const assistantMessage: Message = { role: 'assistant', content: response.answer };
             setMessages(prev => [...prev, assistantMessage]);
             router.refresh();
        } else {
            throw new Error("No answer received");
        }

      } catch (error) {
        const assistantMessage: Message = { role: 'assistant', content: "Sorry, I am having trouble connecting right now. Please try again later." };
        setMessages(prev => [...prev, assistantMessage]);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Batsirai is currently unavailable. Please try again later.',
        });
      }
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        form.handleSubmit(onSubmit)();
    }
  };


  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-[#3F51B5] text-white hover:bg-[#3F51B5]/90"
          >
            <Bot className="h-7 w-7" />
            <span className="sr-only">Ask Batsirai</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl grid-rows-[auto_1fr_auto] max-h-[90svh] p-0">
          <DialogHeader className="p-6">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Bot /> Ask Batsirai
            </DialogTitle>
            <DialogDescription>
              Your AI assistant for the BBL Admins Portal. You can ask questions or give commands. Use Shift+Enter for a new line.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] px-6" ref={scrollAreaRef}>
            <div className="space-y-6 pr-4">
              {messages.map((msg, index) => {
                 return (
                    <div
                      key={index}
                      className={cn(
                        'flex items-start gap-3',
                        msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      <Avatar>
                        <AvatarImage src={msg.role === 'assistant' ? '/bot-avatar.png' : '/user-avatar.png'} />
                        <AvatarFallback>{msg.role === 'assistant' ? 'B' : 'U'}</AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'rounded-lg px-4 py-3 max-w-lg shadow-sm',
                          msg.role === 'assistant' ? 'bg-secondary' : 'bg-primary text-primary-foreground'
                        )}
                      >
                       <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(msg.content) }} />
                      </div>
                    </div>
                 );
              })}
               {isPending && (
                  <div className="flex items-start gap-3 flex-row">
                      <Avatar>
                          <AvatarImage src="/bot-avatar.png" />
                          <AvatarFallback>B</AvatarFallback>
                      </Avatar>
                       <div className="rounded-lg px-4 py-3 max-w-lg shadow-sm bg-secondary flex items-center">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                  </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 border-t">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-start gap-2">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <AutoSizingTextarea 
                            {...field} 
                            placeholder="Ask about the app or give a command..." 
                            autoComplete="off" 
                            disabled={isPending} 
                            onKeyDown={handleKeyDown}
                            className="max-h-36"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="icon" disabled={isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
