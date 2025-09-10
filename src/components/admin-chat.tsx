
"use client";

import { useState, useTransition, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { AdminUser, ChatMessage } from '@/lib/types';
import { addChatMessage, deleteChatMessage, updateChatMessage, clearChatHistory } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { ScrollArea } from './ui/scroll-area';
import { Send, Edit, Trash2, Check, X, Eraser, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

type ChatFormValues = z.infer<typeof chatSchema>;

const EDIT_DELETE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

function ChatMessageContent({ message }: { message: ChatMessage }) {
    if (message.messageHtml) {
        return <p className="text-sm" dangerouslySetInnerHTML={{ __html: message.messageHtml }} />;
    }
    return <p className="text-sm">{message.message}</p>;
}

export function AdminChat({ initialMessages, admins, currentUser }: { initialMessages: ChatMessage[], admins: AdminUser[], currentUser: AdminUser }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [isPending, startTransition] = useTransition();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const activeAdmins = admins.filter(a => a.role === 'Admin');

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
    defaultValues: { message: '' },
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
    scrollToBottom();
  }, [messages, editingMessageId]);

  const onSubmit = (data: ChatFormValues) => {
    startTransition(async () => {
      try {
        const newMessage = await addChatMessage(data.message, currentUser.email);
        setMessages(prev => [...prev, newMessage]);
        form.reset();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to send message.',
        });
      }
    });
  };

  const handleEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingText(message.message);
  }
  
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  }

  const handleSaveEdit = () => {
    if (!editingMessageId || !editingText) return;

    startTransition(async () => {
      try {
        const updatedMessage = await updateChatMessage(editingMessageId, editingText);
        if (updatedMessage) {
            setMessages(prev => prev.map(m => m.id === editingMessageId ? updatedMessage : m));
        }
        handleCancelEdit();
        toast({ title: 'Success', description: 'Message updated.' });
      } catch (error) {
         toast({ variant: 'destructive', title: 'Error', description: 'Failed to update message.' });
      }
    });
  };

  const handleDelete = (messageId: string) => {
    startTransition(async () => {
      try {
        await deleteChatMessage(messageId);
        setMessages(prev => prev.filter(m => m.id !== messageId));
        toast({ title: 'Success', description: 'Message deleted.' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete message.' });
      }
    });
  };

  const handleClearChat = () => {
    startTransition(async () => {
        try {
            await clearChatHistory();
            setMessages([]);
            toast({ title: "Chat Cleared", description: "The entire message history has been deleted."})
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to clear chat history.' });
        }
    });
  };


  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-6 h-[calc(100vh-12rem)]">
        <Card>
            <CardHeader>
                <CardTitle>Active Admins</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {activeAdmins.map(admin => (
                        <li key={admin.id} className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={admin.avatarUrl} alt={admin.name} />
                                <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{admin.name}</p>
                                <p className="text-xs text-muted-foreground">{admin.email}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle>Admin Chat</CardTitle>
                <CardDescription>Real-time private chat for administrators. Use tags to link to app sections: #BBL-XXXXXX, #auc-XX, #tracking, #settings, etc.</CardDescription>
            </div>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={messages.length === 0}>
                        <Eraser className="mr-2 h-4 w-4" />
                        Clear Chat
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete all messages in this chat? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearChat} disabled={isPending}>
                            Yes, Clear Chat
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="space-y-6 pr-4">
              {messages.length > 0 ? messages.map(msg => {
                const isOwnMessage = msg.adminId === currentUser.id;
                const messageTimestamp = new Date(msg.timestamp).getTime();
                const now = new Date().getTime();
                const canModify = now - messageTimestamp < EDIT_DELETE_LIMIT_MS;
                const showActions = isOwnMessage && canModify && editingMessageId !== msg.id;

                return (
                    <div
                    key={msg.id}
                    className={cn(
                        'flex items-start gap-3 group',
                        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                    )}
                    >
                    <Avatar>
                        <AvatarImage src={msg.avatarUrl} alt={msg.adminName} />
                        <AvatarFallback>{msg.adminName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={cn(
                        "rounded-lg px-4 py-2 max-w-sm relative",
                        isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    )}>
                        <p className="text-sm font-semibold mb-1">{msg.adminName}</p>
                        {editingMessageId === msg.id ? (
                            <div className='space-y-2'>
                            <Input 
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="bg-background text-foreground"
                            />
                            <div className="flex items-center justify-end gap-2">
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit} disabled={isPending}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                            </div>
                            </div>
                        ) : (
                            <>
                                <ChatMessageContent message={msg} />
                                <p className={cn(
                                    "text-xs mt-1",
                                    isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                )}>
                                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                </p>
                            </>
                        )}
                    </div>
                    {showActions && (
                            <div className="flex items-center self-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(msg)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to permanently delete this message? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(msg.id)} disabled={isPending}>
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                    </div>
                )}) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mb-4" />
                        <p className="text-lg font-medium">Chat is Empty</p>
                        <p className="text-sm">Be the first to send a message!</p>
                    </div>
                )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="pt-4 border-t">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-center gap-2">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} placeholder="Type a message..." autoComplete="off" />
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
        </CardFooter>
      </Card>
    </div>
  );
}
