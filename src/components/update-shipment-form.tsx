
"use client";

import { useState, useTransition, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

import type { Shipment, ShipmentStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateDelayReason, DelayReasonInput } from '@/ai/flows/delay-reason-generator';
import { Wand2, Loader2, Download } from 'lucide-react';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { updateShipment } from '@/lib/data';
import Image from 'next/image';

const updateShipmentSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  destination: z.enum(['Zimbabwe', 'Zambia']),
  estimatedDeliveryDate: z.string().min(1, 'ETA is required'),
  status: z.enum(['Pending', 'In Transit', 'Delivered', 'Delayed', 'Exception']),
  location: z.string().min(1, "Location for the status update is required."),
  remarks: z.string().optional(),
});

type UpdateShipmentFormValues = z.infer<typeof updateShipmentSchema>;

export function UpdateShipmentForm({ shipment }: { shipment: Shipment }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAiLoading, setAiLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL(shipment.id, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.9,
        margin: 1,
    })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate QR code', err);
      });
  }, [shipment.id]);


  const form = useForm<UpdateShipmentFormValues>({
    resolver: zodResolver(updateShipmentSchema),
    defaultValues: {
      description: shipment.description,
      destination: shipment.destination,
      estimatedDeliveryDate: shipment.estimatedDeliveryDate,
      status: shipment.status,
      location: shipment.history[0]?.location || '',
      remarks: '',
    },
  });

  const currentStatus = useWatch({ control: form.control, name: 'status' });
  const showAiButton = currentStatus === 'Delayed' || currentStatus === 'Exception';
  
  const handleGenerateReason = async () => {
    setAiLoading(true);
    const formValues = form.getValues();
    const aiInput: DelayReasonInput = {
      shipmentId: shipment.id,
      currentStatus: formValues.status,
      origin: shipment.origin,
      destination: shipment.destination,
      currentLocation: formValues.location,
      shippingCompany: shipment.shippingCompany,
      exceptionDescription: formValues.remarks || 'No internal notes provided.',
    };

    try {
      const result = await generateDelayReason(aiInput);
      form.setValue('remarks', result.delayReason);
      toast({
        title: "AI Suggestion Added",
        description: "The AI-generated remark has been added to the form.",
      })
    } catch (error) {
      console.error('AI Error:', error);
      toast({ variant: 'destructive', title: "AI Error", description: "Could not generate a reason." });
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = (data: UpdateShipmentFormValues) => {
    startTransition(async () => {
      try {
        await updateShipment(shipment.id, { 
            ...data
         });
        toast({ title: "Success", description: "Shipment updated successfully." });
        router.push('/admin/tracking');
        router.refresh();
      } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "Failed to update shipment." });
      }
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-[2fr_1fr] gap-8">
            <div className='space-y-6'>
                <div className="grid md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="destination" render={({ field }) => (
                        <FormItem><FormLabel>Destination</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                                <SelectItem value="Zambia">Zambia</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="estimatedDeliveryDate" render={({ field }) => (
                        <FormItem><FormLabel>Estimated Delivery Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            </div>

             {qrCodeUrl && (
                <div className="space-y-2">
                    <FormLabel>Shipment QR Code</FormLabel>
                    <div className="p-4 border rounded-md bg-white flex flex-col items-center justify-center gap-4">
                        <Image src={qrCodeUrl} alt={`QR Code for ${shipment.id}`} width={150} height={150} />
                         <Button type="button" asChild variant="outline" size="sm">
                            <a href={qrCodeUrl} download={`${shipment.id}-qrcode.png`}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </a>
                        </Button>
                    </div>
                </div>
            )}
        </div>
        
        <Separator />

        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle>Update Status</CardTitle>
                <CardDescription>
                    Provide the new status and location for the shipment. If the status is "Delayed" or "Exception", you can use the AI tool to generate a professional remark.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>New Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>{(['Pending', 'In Transit', 'Delivered', 'Delayed', 'Exception'] as ShipmentStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({ field }) => (
                        <FormItem><FormLabel>Current Location</FormLabel><FormControl><Input placeholder="e.g., JFK Airport, USA" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                
                <div className="space-y-2">
                    <FormField control={form.control} name="remarks" render={({ field }) => (
                        <FormItem><FormLabel>Remarks / Internal Notes</FormLabel>
                        <FormControl><Textarea placeholder="Add a note about the new status. If using AI, this can be used as an internal note for the AI to expand upon." className="min-h-[100px]" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    {showAiButton && (
                    <div className="flex justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={handleGenerateReason} disabled={isAiLoading}>
                            {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            Suggest Remark with AI
                        </Button>
                    </div>
                    )}
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/tracking')}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Updating..." : "Update Shipment"}</Button>
        </div>
      </form>
    </Form>
  );
}
