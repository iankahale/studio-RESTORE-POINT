
"use client";

import { useTransition, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addAuctionItem } from '@/lib/data';
import { AuctionItem, auctionCategories, AuctionItemCategory } from '@/lib/types';
import { Textarea } from './ui/textarea';
import Image from 'next/image';
import { Upload, X, Wand2, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { generateAuctionDescription, AuctionDescriptionInput } from '@/ai/flows/auction-description-generator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

const auctionItemSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    keywords: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    category: z.enum(auctionCategories, { required_error: 'Please select a category.' }),
    price: z.preprocess(
      (val) => parseFloat(String(val)),
      z.number().positive('Price must be a positive number')
    ),
    quantity: z.preprocess(
      (val) => parseInt(String(val), 10),
      z.number().int().positive('Quantity must be a positive number')
    ),
    imageUrls: z.array(z.string().url()).min(1, 'At least one image is required'),
});

type AddAuctionItemFormValues = z.infer<typeof auctionItemSchema>;

interface AddAuctionItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onItemAdded: (item: AuctionItem) => void;
}

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function AddAuctionItemDialog({ open, onOpenChange, onItemAdded }: AddAuctionItemDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [isAiLoading, setAiLoading] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const form = useForm<AddAuctionItemFormValues>({
        resolver: zodResolver(auctionItemSchema),
        defaultValues: {
            name: '',
            keywords: '',
            description: '',
            price: 0,
            quantity: 1,
            imageUrls: [],
        },
    });
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null);
        const files = Array.from(event.target.files || []);
        if (files.length > 0) {
            setIsUploading(true);
            const currentUrls = form.getValues('imageUrls') || [];
            
            const newUrls: string[] = [];
            let errorFound = false;

            for (const file of files) {
                if (file.size > MAX_FILE_SIZE) {
                    setUploadError(`"${file.name}" is larger than 3MB. Please upload a smaller image.`);
                    errorFound = true;
                    continue;
                }
                try {
                    const dataUri = await fileToDataUri(file);
                    newUrls.push(dataUri);
                } catch (error) {
                    setUploadError(`Could not process "${file.name}". Please try another file.`);
                    errorFound = true;
                }
            }

            if (newUrls.length > 0) {
                form.setValue('imageUrls', [...currentUrls, ...newUrls], { shouldValidate: true });
            }
            setIsUploading(false);
             if (errorFound) {
                toast({
                    variant: "destructive",
                    title: "Image Upload Error",
                    description: uploadError || "Some images could not be uploaded.",
                });
            }
        }
    };
    
    const removePreview = (index: number) => {
        const updatedUrls = [...form.getValues('imageUrls')];
        updatedUrls.splice(index, 1);
        form.setValue('imageUrls', updatedUrls, { shouldValidate: true });
    };

    const handleGenerateDescription = async () => {
        setAiLoading(true);
        const itemName = form.getValues('name');
        if (!itemName) {
            toast({
                variant: 'destructive',
                title: 'Item Name Required',
                description: 'Please enter an item name before generating a description.'
            });
            setAiLoading(false);
            return;
        }

        const aiInput: AuctionDescriptionInput = {
            itemName: itemName,
            keywords: form.getValues('keywords'),
        };

        try {
            const result = await generateAuctionDescription(aiInput);
            form.setValue('description', result.description, { shouldValidate: true });
            toast({
                title: "AI Suggestion Added",
                description: "The AI-generated description has been added.",
            });
        } catch (error) {
            toast({ variant: 'destructive', title: "AI Error", description: "Could not generate a description." });
        } finally {
            setAiLoading(false);
        }
    };

    const onSubmit = (data: AddAuctionItemFormValues) => {
        startTransition(async () => {
            try {
                const newItem = await addAuctionItem({
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    quantity: data.quantity,
                    imageUrls: data.imageUrls,
                    category: data.category,
                });
                toast({ title: "Success", description: "New auction item has been added." });
                onItemAdded(newItem);
                onOpenChange(false);
                form.reset();
            } catch (error) {
                toast({ variant: 'destructive', title: "Error", description: "Failed to add auction item." });
            }
        });
    };
    
    const previews = form.watch('imageUrls');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            form.reset();
            setUploadError(null);
        }
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-2xl grid-rows-[auto_1fr_auto] max-h-[90svh]">
        <DialogHeader>
          <DialogTitle>Add New Auction Item</DialogTitle>
          <DialogDescription>Fill in the details for the new auction item below. You can upload multiple images.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="pr-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="imageUrls" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Product Images (upload one or more, max 3MB each)</FormLabel>
                                <FormControl>
                                    <div>
                                        <Input id="file-upload" type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} className="hidden" ref={fileInputRef} disabled={isUploading}/>
                                        <label htmlFor="file-upload" className={`flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary focus:outline-none'}`}>
                                            <span className="flex items-center space-x-2">
                                                <Upload className="h-6 w-6 text-muted-foreground" />
                                                <span className="font-medium text-muted-foreground">
                                                    {isUploading ? 'Processing images...' : 'Click to upload files or drag and drop'}
                                                </span>
                                            </span>
                                        </label>
                                    </div>
                                </FormControl>
                                <FormMessage />
                                {uploadError && (
                                    <Alert variant="destructive" className="mt-2">
                                        <AlertDescription>{uploadError}</AlertDescription>
                                    </Alert>
                                )}
                            </FormItem>
                        )} />

                        {previews && previews.length > 0 && (
                            <div className="md:col-span-2 flex flex-wrap gap-4">
                                {previews.map((src, index) => (
                                    <div key={index} className="relative">
                                        <Image src={src} alt={`Preview ${index + 1}`} width={100} height={100} className="rounded-md object-cover h-24 w-24" />
                                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removePreview(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} placeholder="e.g., Antique Wooden Chair" /></FormControl><FormMessage /></FormItem>
                    )} />

                     <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {auctionCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                    )} />


                    <FormField control={form.control} name="keywords" render={({ field }) => (
                        <FormItem><FormLabel>Keywords (Optional)</FormLabel><FormControl><Input {...field} placeholder="e.g., vintage, handcrafted, excellent condition" /></FormControl><FormMessage /></FormItem>
                    )} />
                    
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <div className="flex justify-between items-center">
                                <FormLabel>Description</FormLabel>
                                <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isAiLoading}>
                                    {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                    Suggest with AI
                                </Button>
                            </div>
                            <FormControl><Textarea {...field} rows={4} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem><FormLabel>Starting Price (USD)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="quantity" render={({ field }) => (
                            <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <DialogFooter className="mt-4 sticky bottom-0 bg-background z-10 py-4 -mx-6 px-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isPending || isUploading}>{isPending ? "Adding..." : "Add Item"}</Button>
                    </DialogFooter>
                </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
