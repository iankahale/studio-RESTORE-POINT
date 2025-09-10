
'use server';

/**
 * @fileOverview Defines a Genkit flow for analyzing and cleaning a CSV file of auction items.
 *
 * - analyzeAuctionCsv - Analyzes a CSV string, provides feedback, and returns cleaned data.
 * - AuctionCsvAnalysisInput - The input type for the flow.
 * - AuctionCsvAnalysisOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { AuctionCsvAnalysisInputSchema, AuctionCsvAnalysisOutputSchema, auctionCategories } from '@/lib/types';
import type { AuctionCsvAnalysisInput, AuctionCsvAnalysisOutput } from '@/lib/types';


export async function analyzeAuctionCsv(input: AuctionCsvAnalysisInput): Promise<AuctionCsvAnalysisOutput> {
    return analyzeAuctionCsvFlow(input);
}


const prompt = ai.definePrompt({
    name: 'analyzeAuctionCsvPrompt',
    input: { schema: AuctionCsvAnalysisInputSchema },
    output: { schema: AuctionCsvAnalysisOutputSchema },
    prompt: `You are an expert e-commerce data analyst specializing in auction listings. Your task is to analyze the provided CSV data, clean it up, and offer suggestions for improvement.

CRITICAL INSTRUCTIONS:
1.  **Parse the CSV**: The input is a raw CSV string with a header. The expected headers are "name", "description", "category", "price", "quantity".
2.  **Validate Each Row**:
    *   'name' and 'description' must not be empty.
    *   'price' must be a positive number.
    *   'quantity' must be a positive integer. Default to 1 if it's missing or invalid.
    *   'category' MUST be one of the following exact values: ${auctionCategories.join(', ')}. If a category is close but not an exact match (e.g., "Clothes" vs "Clothing"), correct it to the valid form. If it's completely invalid (e.g., "Furniture"), discard the row.
3.  **Analyze and Suggest**:
    *   Review the 'name' and 'description' fields. If they are too short, generic, or unclear, add a suggestion to make them more descriptive.
    *   Review the 'price'. If it seems unusually low or high for the item description, add a suggestion to double-check the pricing.
    *   Do not make up suggestions if the data is good. If everything looks fine, the 'suggestions' array should be empty.
4.  **Format Output**:
    *   **summary**: Provide a single, brief summary sentence of your findings. For example: "I've analyzed the CSV data, corrected categories, and identified areas for improvement in descriptions and pricing." or "The CSV data looks good! It's ready for import."
    *   **suggestions**: Create a list of bullet points explaining your recommendations for improvement.
    *   **cleanedData**: Return an array of JSON objects for ONLY the valid and corrected rows. Discard any rows that cannot be fixed (e.g., missing name, invalid price, completely wrong category).

Example CSV Input:
{{{csvData}}}
`,
});

const analyzeAuctionCsvFlow = ai.defineFlow(
    {
        name: 'analyzeAuctionCsvFlow',
        inputSchema: AuctionCsvAnalysisInputSchema,
        outputSchema: AuctionCsvAnalysisOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
