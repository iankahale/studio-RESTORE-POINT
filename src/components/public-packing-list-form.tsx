
"use client";

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { PackingListForm } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addPackingListSubmission } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';

function createValidationSchema(formFields: PackingListForm['fields']) {
  const submitterSchema = z.object({
    name: z.string().min(1, 'Your full name is required.'),
    email: z.string().email('A valid email address is required.'),
  });

  const fieldsSchemaObject = formFields.reduce((acc, field) => {
    let fieldSchema: z.ZodTypeAny;
  
    switch (field.type) {
      case 'checkbox':
        if (field.required) {
          if (field.options && field.options.length > 1) {
            fieldSchema = z.array(z.string()).refine(value => value.length > 0, 'Please select at least one option.');
          } else {
            fieldSchema = z.boolean().refine(value => value === true, 'This field must be checked.');
          }
        } else {
            if (field.options && field.options.length > 1) {
                fieldSchema = z.array(z.string()).optional();
            } else {
                fieldSchema = z.boolean().optional();
            }
        }
        break;
      case 'dropdown':
         fieldSchema = z.string();
         if (field.required) {
            fieldSchema = fieldSchema.min(1, 'Please select an option.');
         } else {
            fieldSchema = fieldSchema.optional();
         }
         break;
      case 'email':
         fieldSchema = z.string().email('Please enter a valid email address.');
         if (!field.required) {
            fieldSchema = fieldSchema.optional().or(z.literal(''));
         }
         break;
      default: // text, textarea, tel, name, surname
        fieldSchema = z.string();
        if (field.required) {
          fieldSchema = fieldSchema.min(1, 'This field is required.');
        } else {
          fieldSchema = fieldSchema.optional();
        }
        break;
    }
    
    acc[field.label] = fieldSchema;
    return acc;
  }, {} as Record<string, z.ZodTypeAny>);

  const fieldsSchema = z.object(fieldsSchemaObject);
  
  return z.object({
      submitter: submitterSchema,
      fields: fieldsSchema,
  });
}


export function PublicPackingListForm({ form: formData }: { form: PackingListForm }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const validationSchema = createValidationSchema(formData.fields);
  type FormValues = z.infer<typeof validationSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
        submitter: { name: '', email: '' },
        fields: formData.fields.reduce((acc, field) => {
            acc[field.label] = field.type === 'checkbox' ? (field.options && field.options.length > 1 ? [] : false) : '';
            return acc;
        }, {} as any)
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await addPackingListSubmission(formData.id, {
          submitter: data.submitter,
          data: data.fields,
        });
        toast({
          title: 'Submission Successful!',
          description: "Thank you! Redirecting you now...",
        });
        // Redirect to the specified URL immediately after success
        window.location.href = 'https://www.bblogisticsgroup.com';
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'There was a problem submitting your form. Please try again.',
        });
      }
    });
  };

  return (
    <Card className="w-full shadow-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-2xl">{formData.title}</CardTitle>
            {formData.description && <CardDescription>{formData.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4 p-4 rounded-md border bg-secondary/30">
                <h3 className="font-semibold text-lg">Your Information</h3>
                 <FormField
                    control={form.control}
                    name="submitter.name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="submitter.email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl><Input type="email" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <Separator />

            <div className="space-y-6">
                {formData.fields.map((formField, index) => {
                    const fieldName = `fields.${formField.label}` as const;
                    return (
                        <div key={index}>
                             <FormField
                                control={form.control}
                                name={fieldName}
                                render={({ field }) => {
                                    switch (formField.type) {
                                        case 'textarea':
                                            return (
                                                <FormItem>
                                                    <FormLabel>{formField.label}{formField.required && ' *'}</FormLabel>
                                                    <FormControl><Textarea {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        case 'dropdown':
                                            return (
                                                <FormItem>
                                                    <FormLabel>{formField.label}{formField.required && ' *'}</FormLabel>
                                                     <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                          {formField.options?.map((opt, i) => (
                                                            <SelectItem key={i} value={opt.value}>{opt.value}</SelectItem>
                                                          ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        case 'checkbox':
                                            if (formField.options && formField.options.length > 1) {
                                                // Multiple checkboxes
                                                return (
                                                    <FormItem>
                                                        <FormLabel>{formField.label}{formField.required && ' *'}</FormLabel>
                                                        {formField.options.map((option, i) => (
                                                            <FormField
                                                                key={i}
                                                                control={form.control}
                                                                name={fieldName}
                                                                render={({ field }) => (
                                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={(field.value as string[])?.includes(option.value)}
                                                                                onCheckedChange={(checked) => {
                                                                                    const currentValue = field.value as string[] || [];
                                                                                    return checked
                                                                                        ? field.onChange([...currentValue, option.value])
                                                                                        : field.onChange(currentValue.filter((v) => v !== option.value));
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal">{option.value}</FormLabel>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        ))}
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }
                                            // Single checkbox
                                            return (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                    <FormControl><Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} /></FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>{formField.label}{formField.required && ' *'}</FormLabel>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        case 'email':
                                        case 'tel':
                                        case 'name':
                                        case 'surname':
                                        case 'text':
                                        default:
                                            return (
                                                <FormItem>
                                                    <FormLabel>{formField.label}{formField.required && ' *'}</FormLabel>
                                                    <FormControl><Input type={formField.type === 'name' || formField.type === 'surname' ? 'text' : formField.type} {...field as any} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                    }
                                }}
                            />
                        </div>
                    );
                })}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Packing List
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
