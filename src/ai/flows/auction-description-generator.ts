'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating auction item descriptions.
 *
 * - generateAuctionDescription - A function that takes an item name and keywords and returns a compelling description.
 * - AuctionDescriptionInput - The input type for the generateAuctionDescription function.
 * - AuctionDescriptionOutput - The return type for the generateAuctionDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AuctionDescriptionInputSchema = z.object({
  itemName: z.string().describe('The name of the auction item.'),
  keywords: z.string().optional().describe('Optional keywords to refine the description (e.g., vintage, excellent condition).'),
});
export type AuctionDescriptionInput = z.infer<typeof AuctionDescriptionInputSchema>;

const AuctionDescriptionOutputSchema = z.object({
  description: z.string().describe('A compelling, customer-facing description for the auction item.'),
});
export type AuctionDescriptionOutput = z.infer<typeof AuctionDescriptionOutputSchema>;

export async function generateAuctionDescription(input: AuctionDescriptionInput): Promise<AuctionDescriptionOutput> {
  return auctionDescriptionGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'auctionDescriptionPrompt',
  input: {schema: AuctionDescriptionInputSchema},
  output: {schema: AuctionDescriptionOutputSchema},
  prompt: `You are an expert auctioneer and copywriter. Your task is to write a compelling, concise, and appealing description for an auction item based on its name and optional keywords.

The description should be attractive to potential bidders, highlighting the item's potential value and appeal. Keep it to 2-3 sentences.

Item Information:
- Item Name: {{{itemName}}}
- Keywords: "{{{keywords}}}"

Based on the information above, generate a suitable "Description" for the auction listing. For example, if the item name is "Antique Wooden Chair" and keywords are "vintage, handcrafted", a good description would be: "Up for auction is a beautifully handcrafted antique wooden chair. This vintage piece boasts intricate detailing and solid construction, making it a perfect statement item for any collector or home decorator. Don't miss your chance to own a piece of history!"`,
});

const auctionDescriptionGeneratorFlow = ai.defineFlow(
  {
    name: 'auctionDescriptionGeneratorFlow',
    inputSchema: AuctionDescriptionInputSchema,
    outputSchema: AuctionDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
