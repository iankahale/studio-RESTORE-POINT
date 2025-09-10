
"use client";

import { useTransition } from 'react';
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
import { addShipment } from '@/lib/data';
import { Shipment, ShipmentStatus } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

const shipmentSchema = z.object({
    clientName: z.string().optional(),
    clientEmail: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
    consignmentNumber: z.string().optional(),
    shakersNumber: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    origin: z.enum(['Dubai', 'China']),
    destination: z.enum(['Zimbabwe', 'Zambia']),
    shippingCompany: z.string().min(1, 'Shipping company is required'),
    estimatedDeliveryDate: z.string().min(1, 'ETA is required'),
    status: z.enum(['Pending', 'In Transit', 'Delivered', 'Delayed', 'Exception']),
  }).refine(data => data.consignmentNumber || data.shakersNumber, {
    message: "Either Consignment Number or Shakers Number can be provided as an alternative reference.",
    path: ["consignmentNumber"],
  });

type AddShipmentFormValues = z.infer<typeof shipmentSchema>;

interface AddShipmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onShipmentAdded: (shipment: Shipment) => void;
}

export function AddShipmentDialog({ open, onOpenChange, onShipmentAdded }: AddShipmentDialogProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<AddShipmentFormValues>({
        resolver: zodResolver(shipmentSchema),
        defaultValues: {
            clientName: '',
            clientEmail: '',
            consignmentNumber: '',
            shakersNumber: '',
            description: '',
            shippingCompany: '',
            estimatedDeliveryDate: '',
            status: 'Pending',
            origin: 'Dubai',
            destination: 'Zimbabwe',
        },
    });

    const onSubmit = (data: AddShipmentFormValues) => {
        startTransition(async () => {
            try {
                const newShipment = await addShipment(data);
                toast({ title: "Success", description: `New shipment added with tracking ID: ${newShipment.id}` });
                onShipmentAdded(newShipment);
                onOpenChange(false);
                form.reset();
            } catch (error) {
                toast({ variant: 'destructive', title: "Error", description: "Failed to add shipment." });
                console.error(error);
            }
        });
    };
    
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Shipment</DialogTitle>
          <DialogDescription>Fill in the details below. A unique tracking ID (BBL-XXXXXX) will be generated automatically.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="clientName" render={({ field }) => (
                  <FormItem><FormLabel>Client Name (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="clientEmail" render={({ field }) => (
                  <FormItem><FormLabel>Client Email (for notifications)</FormLabel><FormControl><Input type="email" placeholder="client@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="consignmentNumber" render={({ field }) => (
                    <FormItem><FormLabel>Consignment No. (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="shakersNumber" render={({ field }) => (
                    <FormItem><FormLabel>Shakers No. (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="origin" render={({ field }) => (
                    <FormItem><FormLabel>Origin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Dubai">Dubai</SelectItem>
                          <SelectItem value="China">China</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="shippingCompany" render={({ field }) => (
                <FormItem><FormLabel>Shipping Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="estimatedDeliveryDate" render={({ field }) => (
                <FormItem><FormLabel>Estimated Delivery Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            </div>
             <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                        {(['Pending', 'In Transit', 'Delivered', 'Delayed', 'Exception'] as ShipmentStatus[]).map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Adding..." : "Add Shipment"}</Button>
            </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
