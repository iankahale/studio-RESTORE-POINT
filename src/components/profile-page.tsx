
"use client";

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import type { AdminUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateMyProfile } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Upload, KeyRound, User } from 'lucide-react';
import { Separator } from './ui/separator';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  avatarUrl: z.string().optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: z.string().min(8, { message: "New password must be at least 8 characters long." }),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});


type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfilePage({ user }: { user: AdminUser }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
      resolver: zodResolver(passwordSchema),
      defaultValues: {
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
      }
  })

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setAvatarPreview(result);
            profileForm.setValue('avatarUrl', result);
        };
        reader.readAsDataURL(file);
    } else {
        toast({ variant: 'destructive', title: "Invalid File", description: "Please select a valid image file." });
    }
  };

  const onProfileSubmit = (data: ProfileFormValues) => {
    startTransition(async () => {
      try {
        await updateMyProfile(user.id, { name: data.name, avatarUrl: data.avatarUrl });
        toast({ title: "Success", description: "Your profile has been updated." });
        router.refresh();
      } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to update profile." });
      }
    });
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    startPasswordTransition(async () => {
        try {
            await updateMyProfile(user.id, { 
                password: data.newPassword,
                currentPassword: data.currentPassword,
             });
            toast({ title: "Success", description: "Your password has been changed." });
            passwordForm.reset();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to change password." });
            if (error.message.includes('Incorrect')) {
                passwordForm.setError('currentPassword', { type: 'manual', message: error.message });
            }
        }
    });
  };


  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Manage your personal information and account settings.</CardDescription>
            </CardHeader>
        </Card>
      
        <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="space-y-2 flex flex-col items-center">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={avatarPreview || user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <Button size="sm" variant="outline" asChild>
                                    <label htmlFor="avatar-upload" className="cursor-pointer">
                                        <Upload className="mr-2 h-3 w-3" />
                                        Change
                                    </label>
                                </Button>
                                <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                            </div>
                            <div className="w-full space-y-4">
                                <FormField
                                    control={profileForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <Input value={user.email} disabled />
                                </FormItem>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                         <Button type="submit" disabled={isPending}>
                            <User className="mr-2" />
                            {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
      
        <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Change Password</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl><Input type="password" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl><Input type="password" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl><Input type="password" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                     <CardFooter className="flex justify-end">
                         <Button type="submit" disabled={isPasswordPending}>
                             <KeyRound className="mr-2" />
                            {isPasswordPending ? "Changing..." : "Change Password"}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    </div>
  );
}

    