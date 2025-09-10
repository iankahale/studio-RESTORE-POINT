
"use client";

import { useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, Trash2, Send, Link as LinkIcon, Download, GripVertical, X, Eye } from 'lucide-react';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { AutoSizingTextarea } from './ui/autosize-textarea';
import { useToast } from '@/hooks/use-toast';
import { createPackingListForm } from '@/lib/data';
import Link from 'next/link';
import type { PackingListForm } from '@/lib/types';
import { PublicPackingListForm } from './public-packing-list-form';
import { ScrollArea } from './ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';


const fieldOptionSchema = z.object({
  value: z.string().min(1, "Option value is required."),
});

const formFieldSchema = z.object({
  type: z.enum(['text', 'textarea', 'checkbox', 'dropdown', 'email', 'tel', 'name', 'surname']),
  label: z.string().min(1, "Field label is required."),
  required: z.boolean().optional(),
  options: z.array(fieldOptionSchema).optional(),
});

const packingListSchema = z.object({
  title: z.string().min(1, 'Form title is required.'),
  description: z.string().optional(),
  trackingNumberType: z.enum(['consignment', 'shakers'], { required_error: 'You must select a number type.' }),
  trackingNumber: z.string().min(1, 'The Consignment or Shakers number is required.'),
  fields: z.array(formFieldSchema).min(1, "You must add at least one field."),
});

export type PackingListFormValues = z.infer<typeof packingListSchema>;

export function PackingListCreator() {
  const [createdForm, setCreatedForm] = useState<PackingListForm | null>(null);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<PackingListFormValues>({
    resolver: zodResolver(packingListSchema),
    defaultValues: {
      title: 'New Client Packing List',
      description: 'Please fill out the details for your shipment items below.',
      trackingNumberType: 'consignment',
      trackingNumber: '',
      fields: [
        { type: 'text', label: 'Item Description', required: true }, 
        { type: 'text', label: 'Quantity', required: true }, 
        { type: 'text', label: 'Value (USD)', required: true }
      ],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'fields',
  });

  const onSubmit = (data: PackingListFormValues) => {
    startTransition(async () => {
        try {
            const newForm = await createPackingListForm({
                title: data.title,
                description: data.description,
                trackingNumber: {
                    type: data.trackingNumberType,
                    number: data.trackingNumber,
                },
                fields: data.fields
            });
            setCreatedForm(newForm);
            toast({ title: "Success!", description: "Your form has been created and is ready to preview and share." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to create form." });
        }
    });
  };

  const handleDownloadCSV = () => {
    const headers = form.getValues('fields').map(field => `"${field.label.replace(/"/g, '""')}"`).join(',');
    const csvContent = "data:text/csv;charset=utf-8," + headers;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${form.getValues('title').replace(/ /g, '_')}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const addFieldOption = (fieldIndex: number) => {
    const field = form.getValues(`fields.${fieldIndex}`);
    const newOptions = [...(field.options || []), { value: '' }];
    update(fieldIndex, { ...field, options: newOptions });
  };
  
  const removeFieldOption = (fieldIndex: number, optionIndex: number) => {
      const field = form.getValues(`fields.${fieldIndex}`);
      const newOptions = field.options?.filter((_, i) => i !== optionIndex);
      update(fieldIndex, { ...field, options: newOptions });
  };


  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
                <CardTitle>Create New Form</CardTitle>
                <CardDescription>
                    Build a new form from scratch. Add fields and set their types as needed.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Form Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Form Description</FormLabel><FormControl><AutoSizingTextarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <Separator />

                <div className="space-y-4 p-4 rounded-md border">
                    <h3 className="text-md font-medium">Associated Consignment or Shakers Number</h3>
                    <p className="text-sm text-muted-foreground">Specify the number (e.g., from a partner carrier) that will be associated with all shipments from this form.</p>
                     <FormField
                        control={form.control}
                        name="trackingNumberType"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Number Type</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                                >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="consignment" /></FormControl>
                                    <FormLabel className="font-normal">Consignment No.</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="shakers" /></FormControl>
                                    <FormLabel className="font-normal">Shakers No.</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField control={form.control} name="trackingNumber" render={({ field }) => (
                        <FormItem><FormLabel>Consignment or Shakers Number</FormLabel><FormControl><Input {...field} placeholder="Enter the number" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <Separator />

                <div>
                <h3 className="text-lg font-medium mb-4">Form Fields</h3>
                <div className="space-y-4">
                    {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col gap-4 p-4 border rounded-md bg-secondary/30 relative group">
                        <div className="flex items-start gap-4">
                            <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab flex-shrink-0" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                <FormField
                                control={form.control}
                                name={`fields.${index}.label`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Field Label</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter field label" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`fields.${index}.type`}
                                    render={({ field: controllerField }) => (
                                        <FormItem>
                                        <FormLabel>Field Type</FormLabel>
                                        <Select onValueChange={(value) => {
                                            controllerField.onChange(value);
                                            const currentField = form.getValues(`fields.${index}`);
                                            const newField = { ...currentField, type: value as any };
                                            if(value !== 'dropdown' && value !== 'checkbox') {
                                                delete newField.options;
                                            } else if (!newField.options) {
                                                newField.options = [{ value: '' }];
                                            }
                                            update(index, newField);
                                        }} defaultValue={field.type}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="name">Name</SelectItem>
                                                <SelectItem value="surname">Surname</SelectItem>
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="tel">Phone Number</SelectItem>
                                                <SelectItem value="textarea">Textarea</SelectItem>
                                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                                <SelectItem value="dropdown">Dropdown</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>
                             <Button type="button" variant="destructive" size="icon" className="mt-auto" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {(field.type === 'dropdown' || field.type === 'checkbox') && (
                            <div className="pl-6 pt-2 space-y-3">
                                <FormLabel className="text-sm">Options</FormLabel>
                                {field.options?.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`fields.${index}.options.${optionIndex}.value`}
                                            render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input {...field} placeholder={`Option ${optionIndex + 1}`} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground" onClick={() => removeFieldOption(index, optionIndex)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" size="sm" variant="ghost" onClick={() => addFieldOption(index)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                                </Button>
                            </div>
                        )}

                        <div className="pl-6 pt-2 text-muted-foreground">
                            <FormField
                                control={form.control}
                                name={`fields.${index}.required`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal">Required</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>

                    </div>
                    ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ type: 'text', label: '', required: false })} className="mt-4">
                    <PlusCircle />
                    Add Field
                </Button>
                </div>
                
                <FormField
                control={form.control}
                name="fields"
                render={({ fieldState }) => (
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                )}
                />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                <Button type="button" variant="outline" onClick={handleDownloadCSV}>
                    <Download />
                    CSV Template
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Generating...' : <><Send /> Generate Form</>}
                </Button>
            </CardFooter>
            </form>
        </Form>
        </Card>

        <div>
            {createdForm && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Form Ready</CardTitle>
                            <CardDescription>Your new form has been generated. You can now preview it or share the link with your clients.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-4 rounded-md border border-input p-4">
                                <h4 className="font-semibold">Shareable Form Link</h4>
                                <p className="text-sm text-muted-foreground">Share this link with your clients.</p>
                                <div className="flex items-center gap-2">
                                    <Input readOnly value={`${window.location.origin}/form/view/${createdForm.id}`} />
                                    <Button type="button" size="icon" variant="ghost" onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/form/view/${createdForm.id}`);
                                        toast({ title: 'Link Copied!' });
                                    }} title="Copy link">
                                        <LinkIcon className="h-4 w-4" />
                                    </Button>
                                    <Button asChild variant="secondary" size="icon" title="Open Form in New Tab">
                                        <Link href={`/form/view/${createdForm.id}`} target="_blank">
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                              </div>
                        </CardContent>
                        <CardFooter>
                             <Dialog open={isPreviewOpen} onOpenChange={setPreviewOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <Eye /> Preview Form
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>Form Preview</DialogTitle>
                                    </DialogHeader>
                                    <div className="max-h-[70vh] overflow-y-auto p-1">
                                        <div className="bg-gray-50 dark:bg-transparent py-8 px-4 sm:px-6 lg:px-8 rounded-md">
                                             <PublicPackingListForm form={createdForm} />
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    </div>
  );
}
