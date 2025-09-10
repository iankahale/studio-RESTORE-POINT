
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating possible reasons for shipment delays or exceptions.
 *
 * - generateDelayReason - A function that takes shipment information as input and returns a possible reason for the delay.
 * - DelayReasonInput - The input type for the generateDelayReason function.
 * - DelayReasonOutput - The return type for the generateDelayReason function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DelayReasonInputSchema = z.object({
  shipmentId: z.string().describe('The unique identifier for the shipment.'),
  currentStatus: z.string().describe('The current status of the shipment (e.g., Delayed, Exception).'),
  origin: z.string().describe('The origin location of the shipment.'),
  destination: z.string().describe('The destination location of the shipment.'),
  currentLocation: z.string().describe('The last known location of the shipment.'),
  shippingCompany: z.string().describe('The company responsible for shipping.'),
  exceptionDescription: z
    .string()
    .optional()
    .describe('A brief, internal description of any exception or issue with the shipment.'),
});
export type DelayReasonInput = z.infer<typeof DelayReasonInputSchema>;

const DelayReasonOutputSchema = z.object({
  delayReason: z.string().describe('A possible reason for the shipment delay, suitable for customer communication.'),
});
export type DelayReasonOutput = z.infer<typeof DelayReasonOutputSchema>;

export async function generateDelayReason(input: DelayReasonInput): Promise<DelayReasonOutput> {
  return delayReasonGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'delayReasonPrompt',
  input: {schema: DelayReasonInputSchema},
  output: {schema: DelayReasonOutputSchema},
  prompt: `You are an expert logistics coordinator for a company called "Beyond Borders Logistics". Your task is to write a concise, professional, and customer-facing reason for a shipment delay or exception based on the provided data.

The tone should be reassuring and professional, even if the internal notes are blunt. Do not invent information you don't have. Use the current location to provide context.

Shipment Information:
- Shipment ID: {{{shipmentId}}}
- Current Status: {{{currentStatus}}}
- Origin: {{{origin}}}
- Destination: {{{destination}}}
- Last Known Location: {{{currentLocation}}}
- Shipping Partner: {{{shippingCompany}}}
- Internal Notes: "{{{exceptionDescription}}}"

Based on the information above, generate a brief, customer-friendly "Remark" that explains the delay. For example, if the internal note is "bad weather", a good remark would be "Shipment is currently experiencing a minor delay due to adverse weather conditions in the region. We are monitoring the situation closely."`,
});

const delayReasonGeneratorFlow = ai.defineFlow(
  {
    name: 'delayReasonGeneratorFlow',
    inputSchema: DelayReasonInputSchema,
    outputSchema: DelayReasonOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
