

"use client";

import { useState, useTransition, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Check, Upload, KeyRound, X, UserCog, Link as LinkIcon } from 'lucide-react';
import { AdminUser, Permission } from '@/lib/types';
import { addAdmin, approveAdmin, removeAdmin, updateAdminPermissions, updateAdminProfile } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Image from "next/image";
import { ToastAction } from './ui/toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';


const addAdminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type AddAdminFormValues = z.infer<typeof addAdminSchema>;

const allPermissions: {id: Permission, label: string}[] = [
    { id: 'dashboard', label: 'View Dashboard' },
    { id: 'tracking', label: 'Manage Tracking' },
    { id: 'packing-list', label: 'Manage Packing Lists' },
    { id: 'auction-listing', label: 'Manage Auction Listings' },
    { id: 'chat', label: 'Access Admin Chat' },
    { id: 'settings', label: 'Manage Settings (Super Admin Only)' },
];

const superAdmins = ['bblgroup@protonmail.com'];

function PermissionsDialog({ admin, onPermissionsChange, isMainAdmin, open, onOpenChange }: { admin: AdminUser; onPermissionsChange: (id: string, permissions: Permission[]) => void; isMainAdmin: boolean; open: boolean; onOpenChange: (open: boolean) => void; }) {
    const [isPending, startTransition] = useTransition();

    const form = useForm({
        defaultValues: {
            permissions: admin.permissions || []
        }
    });

    useEffect(() => {
        form.reset({ permissions: admin.permissions || [] });
    }, [admin, form]);

    const onSubmit = (data: {permissions: Permission[]}) => {
        startTransition(async () => {
            onPermissionsChange(admin.id, data.permissions);
            onOpenChange(false);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Permissions for {admin.name}</DialogTitle>
                    <DialogDescription>Select the features this administrator can access.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            {allPermissions.map((permission) => (
                                <FormField
                                    key={permission.id}
                                    control={form.control}
                                    name="permissions"
                                    render={({ field }) => {
                                        const isDisabled = permission.id === 'settings';
                                        return (
                                            <FormItem className={`flex flex-row items-center space-x-3 space-y-0 p-3 rounded-md border ${isDisabled ? 'bg-muted/50 cursor-not-allowed' : ''}`}>
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(permission.id)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...field.value, permission.id])
                                                                : field.onChange(field.value?.filter((value) => value !== permission.id));
                                                        }}
                                                        disabled={isDisabled}
                                                    />
                                                </FormControl>
                                                <FormLabel className={`font-normal ${isDisabled ? 'text-muted-foreground' : ''}`}>
                                                    {permission.label}
                                                </FormLabel>
                                            </FormItem>
                                        );
                                    }}
                                />
                            ))}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Permissions"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function AdminSettings({ initialAdmins, currentUser }: { initialAdmins: AdminUser[], currentUser: AdminUser }) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSavingLogo, startLogoTransition] = useTransition();
  const deletionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [editingPermissionsAdmin, setEditingPermissionsAdmin] = useState<AdminUser | null>(null);


  const isMainAdmin = currentUser?.email ? superAdmins.includes(currentUser.email) : false;

  useEffect(() => {
    // This code runs only on the client, preventing server-side errors.
    const storedLogo = localStorage.getItem('companyLogo');
    if (storedLogo) {
      setLogoPreview(storedLogo);
    }

    // Cleanup timeout on component unmount
    return () => {
      if (deletionTimeoutRef.current) {
        clearTimeout(deletionTimeoutRef.current);
      }
    };
  }, []);
  
  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        toast({ variant: 'destructive', title: "Invalid File", description: "Please select a valid image file." });
    }
  };

  const handleLogoSave = () => {
      startLogoTransition(() => {
          if (logoPreview) {
              localStorage.setItem('companyLogo', logoPreview);
              toast({ title: "Success", description: "Logo updated successfully. It may take a moment to appear everywhere." });
              window.dispatchEvent(new Event('storage')); // Notify other components of the change
          } else {
            toast({ variant: 'destructive', title: "No Logo", description: "Please select a logo to upload." });
          }
      });
  };
  
  const form = useForm<AddAdminFormValues>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const onSubmit = (data: AddAdminFormValues) => {
     startTransition(async () => {
      try {
        const newAdmin = await addAdmin(data);
        setAdmins(prev => {
            const existing = prev.find(a => a.id === newAdmin.id);
            if (existing) {
                return prev.map(a => a.id === newAdmin.id ? newAdmin : a);
            }
            return [...prev, newAdmin];
        });
        toast({ title: "Invitation Sent!", description: `An invitation for ${newAdmin.name} has been generated. The link is valid for 2 minutes.` });
        form.reset();
      } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to add admin." });
      }
    });
  };

  const handleApprove = (adminToApprove: AdminUser) => {
    startTransition(async () => {
      try {
        const updatedAdmin = await approveAdmin(adminToApprove.id);
        if (updatedAdmin) {
          setAdmins(prev => prev.map(a => a.id === adminToApprove.id ? updatedAdmin : a));
          toast({ title: "Success", description: `${adminToApprove.name}'s request approved. You can now set their permissions.` });
          setEditingPermissionsAdmin(updatedAdmin);
        } else {
            throw new Error("Failed to approve admin on the server.");
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message || "Failed to approve request." });
      }
    });
  }
  
  const startDeletionProcess = (adminToDelete: AdminUser) => {
    if (deletionTimeoutRef.current) {
        clearTimeout(deletionTimeoutRef.current);
    }
    
    // Optimistic UI update
    setAdmins(prev => prev.filter(a => a.id !== adminToDelete.id));

    toast({
        title: 'Admin Removed',
        description: `Admin "${adminToDelete.name}" has been removed.`,
        action: (
            <ToastAction altText="Undo" onClick={() => handleUndo(adminToDelete)}>
                Undo
            </ToastAction>
        ),
    });

    deletionTimeoutRef.current = setTimeout(() => {
        performActualDeletion(adminToDelete.id);
        deletionTimeoutRef.current = null;
    }, 5000);
  };
  
  const handleUndo = (adminToRestore: AdminUser) => {
    if (deletionTimeoutRef.current) {
        clearTimeout(deletionTimeoutRef.current);
        deletionTimeoutRef.current = null;
    }
    setAdmins(prev => [...prev, adminToRestore].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: 'Action Undone', description: `Admin "${adminToRestore.name}" has been restored.`});
  };

  const performActualDeletion = (id: string) => {
    startTransition(async () => {
        try {
            await removeAdmin(id);
        } catch (error) {
            toast({ variant: 'destructive', title: "Final Deletion Failed", description: "Could not remove admin from server." });
        }
    });
  };

  const handleDecline = (id: string) => {
    const admin = admins.find(a => a.id === id);
    if(admin) {
        startDeletionProcess(admin);
    }
  }

  const handleRemove = (id: string) => {
    const admin = admins.find(a => a.id === id);
    if(admin) {
        startDeletionProcess(admin);
    }
  };

  const handlePermissionsChange = (id: string, permissions: Permission[]) => {
      startTransition(async () => {
          try {
              const updatedAdmin = await updateAdminPermissions(id, permissions);
              if (updatedAdmin) {
                  setAdmins(prev => prev.map(a => a.id === id ? updatedAdmin : a));
                  toast({ title: "Success", description: "Permissions updated." });
              }
          } catch (error) {
              toast({ variant: 'destructive', title: "Error", description: "Failed to update permissions." });
          }
      });
  };

  const showInviteLink = (id: string) => {
    const link = `${window.location.origin}/set-password/${id}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link Copied!", description: "The invitation link has been copied to your clipboard." });
  };
  
  return (
    <div className="space-y-8">
        {isMainAdmin && (
             <Card>
                <CardHeader>
                    <CardTitle>Company Logo</CardTitle>
                    <CardDescription>Upload your company logo. This will be displayed across the application.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex-1 space-y-4">
                        <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoFileChange} />
                         <Button onClick={handleLogoSave} disabled={isSavingLogo || !logoPreview}>
                            <Upload />
                            {isSavingLogo ? "Saving..." : "Save Logo"}
                        </Button>
                    </div>
                    {logoPreview && (
                        <div className="p-4 border rounded-md bg-background">
                            <p className="text-sm font-medium mb-2 text-center">Logo Preview</p>
                            <Image src={logoPreview} alt="Logo preview" width={200} height={50} className="object-contain" />
                        </div>
                    )}
                </CardContent>
            </Card>
        )}

        {isMainAdmin && (
            <Card>
                <CardHeader>
                    <CardTitle>Invite New Administrator</CardTitle>
                    <CardDescription>Invite a new admin by sending them a secure link.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-end">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem className="flex-1"><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem className="flex-1"><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={isPending}>
                                <UserPlus />
                                {isPending ? "Sending..." : "Send Invite"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Current Administrators &amp; Requests</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {admins.length > 0 ? (
                        admins.map((admin) => (
                            <TableRow key={admin.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={admin.avatarUrl} alt={admin.name} />
                                    <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {admin.name}
                                {superAdmins.includes(admin.email) && <Badge variant="destructive">Super Admin</Badge>}
                            </TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>
                               <div className="flex items-center gap-2">
                                <Badge variant={admin.role === 'Admin' ? 'default' : 'secondary'}>
                                    {admin.role}
                                </Badge>
                                {!admin.password && admin.role === 'Pending' && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => showInviteLink(admin.id)}>
                                                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Password not set. Click to copy invite link.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                               </div>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                {admin.role === 'Pending' ? (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => handleApprove(admin)} disabled={isPending || !admin.password} title={!admin.password ? "User must set password first" : "Approve Request"}>
                                            <Check className="text-green-500" />
                                            <span className="hidden sm:inline ml-2">Approve</span>
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDecline(admin.id)} disabled={isPending} title="Decline Request">
                                            <X />
                                            <span className="hidden sm:inline ml-2">Decline</span>
                                        </Button>
                                    </>
                                ) : ( !superAdmins.includes(admin.email) &&
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => setEditingPermissionsAdmin(admin)} disabled={!isMainAdmin}>
                                            <UserCog />
                                            <span className="hidden sm:inline ml-2">Permissions</span>
                                        </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleRemove(admin.id)} disabled={isPending || !isMainAdmin} title="Remove User">
                                        <Trash2 />
                                        <span className="hidden sm:inline ml-2">Remove</span>
                                    </Button>
                                    </>
                                )}
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">
                            No administrators found.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        {editingPermissionsAdmin && (
            <PermissionsDialog 
                admin={editingPermissionsAdmin}
                onPermissionsChange={handlePermissionsChange}
                isMainAdmin={isMainAdmin}
                open={!!editingPermissionsAdmin}
                onOpenChange={(open) => !open && setEditingPermissionsAdmin(null)}
            />
        )}
    </div>
  );
}
