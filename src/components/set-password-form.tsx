
"use client";

import { useState, useTransition } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { setAdminPassword } from '@/lib/data';
import { KeyRound } from 'lucide-react';
import Link from 'next/link';

const setPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

export function SetPasswordForm({ adminId }: { adminId: string; }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isSubmitted, setSubmitted] = useState(false);

  const form = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    },
  });

  const onSubmit = (data: SetPasswordFormValues) => {
    startTransition(async () => {
      try {
        await setAdminPassword(adminId, data.password);
        toast({
            title: "Password Set Successfully",
            description: "Your password has been saved. An admin must now approve your account.",
        });
        setSubmitted(true);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "There was an error setting your password.",
        });
      }
    });
  };

  if (isSubmitted) {
    return (
        <div className="text-center text-card-foreground p-4 bg-secondary rounded-md">
            <h3 className="font-semibold">Thank You!</h3>
            <p className="text-sm text-muted-foreground mb-4">Your request has been submitted. An administrator will review your account for final approval. You can now close this page or proceed to the login page.</p>
            <Button asChild>
                <Link href="/admin">Go to Login</Link>
            </Button>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Saving...' : <> <KeyRound className="mr-2 h-4 w-4" /> Set Password </>}
        </Button>
      </form>
    </Form>
  );
}
