'use server';

/**
 * @fileOverview This file defines a Genkit flow for an AI assistant named Batsirai.
 * Batsirai is an expert on the BBL Admins Portal application and answers user questions based on its documentation and available tools.
 *
 * - askBatsirai - A function that takes a user's question and returns a helpful answer.
 * - BatsiraiInput - The input type for the askBatsirai function.
 * - BatsiraiOutput - The return type for the askBatsirai function.
 */

import {ai} from '@/ai/genkit';
import { addAuctionItem, addShipment, approveAdmin, getAdmins, getAuctionItems, getShipmentById, getShipments, updateShipment } from '@/lib/data';
import { AuctionItem, auctionCategories, Shipment, AdminUser, ShipmentStatus } from '@/lib/types';
import {z} from 'genkit';
import { subMonths } from 'date-fns';
import {Firestore} from '@google-cloud/firestore';


// Load service account from environment variable
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

// Initialize Firestore
const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});


const appDocumentation = `
# BBL Admins Portal: Logistics and Auction Management System

BBL Admins Portal is a comprehensive web application designed to manage logistics, shipment tracking, and auctions for unclaimed goods. It provides a robust admin dashboard for internal management and clean, client-facing interfaces for shipment tracking and auction bidding.

## Core Features

- **Admin Authentication**: Secure login for administrators.
- **Advanced Admin Dashboard**: A central hub for managing all aspects of the application, including shipment tracking, auction listings, packing list forms, and user management.
- **Shipment Management**: Admins can add, view, and update shipment details. The system supports tracking via a primary \`BBL-\` number, as well as secondary Consignment or Shakers numbers.
- **AI-Powered Delay Reasons**: An integrated AI tool assists admins by generating professional, customer-facing explanations for shipment delays or exceptions, ensuring clear and consistent communication.
- **Client Tracking Portal**: A simple, mobile-responsive page where clients can enter a tracking number to get real-time updates on their shipment's status and history.
- **Auction System**: A complete system for auctioning unclaimed goods. Admins can list items with images and descriptions, and clients can register and place bids. Bidding is restricted to users in Zimbabwe.
- **Dynamic Form Creator**: Admins can create custom packing list forms, associate them with a Consignment/Shakers number, and share a link with clients to submit their item details.
- **Admin Chat**: A real-time chat for internal communication between administrators, with support for smart tags that link directly to shipments, auctions, or admin pages.

---

## Admin Portal Guide

The admin portal is the control center for your application.

### 1. Dashboard & Insights
The main dashboard provides a high-level overview of your operations with key performance indicators (KPIs) and charts for:
- Total shipments, in-transit counts, and recent deliveries.
- Pending admin approval requests.
- Shipment volume over the last 3 months.
- Distribution of shipment statuses.
- Auction performance, including total listed value vs. value with active bids.

### 2. Tracking
- **View All Shipments**: See a list of all shipments, sortable and searchable by Consignment or Shakers number.
- **Add New Shipment**: Manually add a new shipment record. A unique \`BBL-XXXXXX\` tracking ID will be generated.
- **Update Shipments**: Edit shipment details, update its status, and add remarks.
- **Use AI for Delays**: When a shipment is marked as "Delayed" or "Exception," use the "Suggest Remark with AI" button to generate a professional note for the client.

### 3. Packing List
This section has two tabs:
- **Form Creator**: Build custom forms for clients to submit their packing lists. You must associate each form with a Consignment or Shakers number.
- **Submissions**: View all client submissions for each form you've created.

### 4. Auction Listing
- **Manage Items**: View all listed, bid-on, and sold auction items.
- **Add New Item**: Create a new auction listing with images, a description, and a starting price.
- **Finalize Sale**: When an item has bids, you can see the highest bidder's details (name, email, phone, address). Click "Finalize Sale" to mark the item as "Sold" and simulate sending a payment notification.

### 5. Chat
A private, real-time chat for administrators. Use smart tags to quickly reference parts of the app:
- \`#BBL-123456\`: Links to the public tracking page for that shipment.
- \`#auc-1\`: Links to the public auction page.
- \`#tracking\`, \`#settings\`, etc.: Links to the corresponding admin pages.

### 6. Settings
- **Manage Admins**: The super admin can invite new admins, approve pending requests, and manage permissions.
- **Update Company Logo**: The super admin can upload a company logo that will be displayed across the application.
`;

// DATA RETRIEVAL TOOLS
const getShipmentDataTool = ai.defineTool(
    {
      name: 'getShipmentData',
      description: 'Get data about shipments. Use this to answer questions about shipment counts, statuses, and delivery timelines.',
      inputSchema: z.object({
        calculation: z.enum([
            'total_shipments', 
            'in_transit_count', 
            'delivered_last_30_days', 
            'status_distribution'
        ]).describe('The calculation to perform.'),
      }),
      outputSchema: z.object({
        result: z.union([z.number(), z.record(z.string(), z.number()), z.string()]).describe('The result of the calculation.'),
      }),
    },
    async (input) => {
      const shipments = await getShipments();
      switch (input.calculation) {
        case 'total_shipments':
          return { result: shipments.length };
        case 'in_transit_count':
          return { result: shipments.filter(s => s.status === 'In Transit').length };
        case 'delivered_last_30_days':
          const oneMonthAgo = subMonths(new Date(), 1);
          return { result: shipments.filter(s => {
            if (s.status !== 'Delivered') return false;
            const deliveryDate = s.history.find(h => h.status === 'Delivered')?.date;
            if (!deliveryDate) return false;
            return new Date(deliveryDate) >= oneMonthAgo;
          }).length };
        case 'status_distribution':
            const distribution = shipments.reduce((acc, s) => {
                acc[s.status] = (acc[s.status] || 0) + 1;
                return acc;
            }, {} as Record<ShipmentStatus, number>);
            return { result: distribution };
        default:
          return { result: 'Unknown shipment calculation.' };
      }
    }
);

const getAdminDataTool = ai.defineTool(
    {
      name: 'getAdminData',
      description: 'Get data about administrators. Use this to answer questions about total admin counts and pending approvals.',
      inputSchema: z.object({
        calculation: z.enum(['total_admins', 'pending_approvals']).describe('The calculation to perform.'),
      }),
      outputSchema: z.object({
        result: z.number().describe('The result of the calculation.'),
      }),
    },
    async (input) => {
      const admins = await getAdmins();
      switch (input.calculation) {
        case 'total_admins':
          return { result: admins.length };
        case 'pending_approvals':
          return { result: admins.filter(a => a.role === 'Pending').length };
        default:
          return { result: 0 };
      }
    }
);

const getAuctionDataTool = ai.defineTool(
    {
      name: 'getAuctionData',
      description: 'Get data and perform calculations on the current auction items. Use this to answer questions about total values, item counts, or specific category data.',
      inputSchema: z.object({
        calculation: z.enum([
            'total_value_all', 
            'total_value_with_bids', 
            'item_count_total', 
            'item_count_by_category'
        ]).describe('The type of calculation to perform.'),
        category: z.enum(auctionCategories).optional().describe('The category to filter by for item_count_by_category calculation.'),
      }),
      outputSchema: z.object({
        result: z.union([z.number(), z.string()]).describe('The result of the calculation. Can be a number or a descriptive string.'),
      }),
    },
    async (input) => {
      const items = await getAuctionItems();
      switch (input.calculation) {
        case 'total_value_all':
          return { result: items.reduce((sum, item) => sum + item.price, 0) };
        case 'total_value_with_bids':
          return { result: items.reduce((sum, item) => sum + (item.currentBid || 0), 0) };
        case 'item_count_total':
          return { result: items.length };
        case 'item_count_by_category':
          if (!input.category) {
            return { result: 'A category must be provided to count items by category.' };
          }
          const count = items.filter(item => item.category === input.category).length;
          return { result: count };
        default:
            return { result: "I'm sorry, I can't perform that calculation."}
      }
    }
);

// ACTION-ORIENTED TOOLS

const createShipmentTool = ai.defineTool(
    {
        name: 'createShipment',
        description: 'Creates a new shipment record. A unique BBL-XXXXXX tracking ID will be generated automatically.',
        inputSchema: z.object({
            clientName: z.string().optional(),
            clientEmail: z.string().email().optional(),
            consignmentNumber: z.string().optional(),
            shakersNumber: z.string().optional(),
            description: z.string().describe("A description of the shipment's contents."),
            origin: z.enum(['Dubai', 'China']),
            destination: z.enum(['Zimbabwe', 'Zambia']),
            shippingCompany: z.string().default('Beyond Borders Logistics'),
            estimatedDeliveryDate: z.string().describe("The estimated delivery date in YYYY-MM-DD format."),
        }),
        outputSchema: z.object({
            result: z.string().describe("A confirmation message, including the new tracking ID. For example: 'Successfully created new shipment with tracking ID BBL-123456.'"),
        }),
    },
    async (input) => {
        const newShipment = await addShipment({ ...input, status: 'Pending' });
        return { result: `Successfully created new shipment with tracking ID ${newShipment.id}.` };
    }
);

const updateShipmentStatusTool = ai.defineTool(
    {
        name: 'updateShipmentStatus',
        description: 'Updates the status of an existing shipment.',
        inputSchema: z.object({
            shipmentId: z.string().describe('The BBL-XXXXXX tracking ID of the shipment to update.'),
            status: z.enum(['Pending', 'In Transit', 'Delivered', 'Delayed', 'Exception']),
            location: z.string().describe('The current location of the shipment.'),
            remarks: z.string().optional().describe('Any additional remarks about the status update.'),
        }),
        outputSchema: z.object({
            result: z.string().describe("A confirmation message, like 'Shipment BBL-123456 has been updated to In Transit.'"),
        }),
    },
    async (input) => {
        const shipment = await getShipmentById(input.shipmentId);
        if (!shipment) {
            return { result: `Shipment with ID ${input.shipmentId} not found.` };
        }
        
        await updateShipment(input.shipmentId, {
            description: shipment.description,
            destination: shipment.destination,
            estimatedDeliveryDate: shipment.estimatedDeliveryDate,
            status: input.status,
            location: input.location,
            remarks: input.remarks,
        });

        return { result: `Shipment ${input.shipmentId} has been updated to ${input.status}.` };
    }
);

const createAuctionItemTool = ai.defineTool(
    {
        name: 'createAuctionItem',
        description: 'Creates a new auction item with a "Draft" status. A placeholder image will be used.',
        inputSchema: z.object({
            name: z.string().describe('The name of the item.'),
            description: z.string().describe('A brief description of the item.'),
            category: z.enum(auctionCategories),
            price: z.number().describe('The starting price of the item in USD.'),
        }),
        outputSchema: z.object({
            result: z.string().describe("A confirmation message, such as 'Successfully created a new draft listing for Vintage Leather Jacket.'"),
        }),
    },
    async (input) => {
        await addAuctionItem({
            ...input,
            status: 'Draft',
            imageUrls: [`https://picsum.photos/seed/${input.name}/400/400`],
        });
        return { result: `Successfully created a new draft listing for "${input.name}". Please edit it in the Auction Listing page to add real images.` };
    }
);

const approveAdminRequestTool = ai.defineTool(
    {
        name: 'approveAdminRequest',
        description: "Approves a pending administrator request, granting them access to the dashboard. You must provide the user's email address.",
        inputSchema: z.object({
            email: z.string().email().describe('The email address of the user whose request should be approved.'),
        }),
        outputSchema: z.object({
            result: z.string().describe("A confirmation message, like 'The request for new.admin@example.com has been approved.'"),
        }),
    },
    async (input) => {
        const admins = await getAdmins();
        const pendingAdmin = admins.find(a => a.email === input.email && a.role === 'Pending');

        if (!pendingAdmin) {
            return { result: `No pending admin request found for ${input.email}.` };
        }
        if (!pendingAdmin.password) {
            return { result: `Cannot approve ${input.email} because they have not set their password yet.` };
        }

        await approveAdmin(pendingAdmin.id);
        return { result: `The request for ${input.email} has been approved.` };
    }
);


const BatsiraiInputSchema = z.object({
  question: z.string().describe('The user\'s question about the application.'),
});
export type BatsiraiInput = z.infer<typeof BatsiraiInputSchema>;

const BatsiraiOutputSchema = z.object({
  answer: z.string().describe('The AI\'s helpful answer.'),
});
export type BatsiraiOutput = z.infer<typeof BatsiraiOutputSchema>;

export async function askBatsirai(input: BatsiraiInput): Promise<BatsiraiOutput> {
  return batsiraiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'batsiraiPrompt',
  input: {schema: BatsiraiInputSchema},
  output: {schema: BatsiraiOutputSchema},
  tools: [
    // Action Tools
    createShipmentTool, 
    updateShipmentStatusTool, 
    createAuctionItemTool,
    approveAdminRequestTool,
    // Data Retrieval Tools
    getAuctionDataTool, 
    getShipmentDataTool, 
    getAdminDataTool,
  ],
  prompt: `You are Batsirai, a friendly, intelligent, and world-class AI assistant for the "BBL Admins Portal" application. Your primary purpose is to help administrators understand and use the app's features by answering questions and executing commands. You are an expert at understanding natural language, even when it contains typos or is phrased conversationally.

You have access to two things:
1.  The official documentation for the application.
2.  A set of tools to get real-time data from the database and to perform actions (like creating or updating data).

CRITICAL INSTRUCTIONS:
1.  **NEVER MENTION YOUR TOOLS OR THE WORD "TOOL"**: You must communicate naturally. Do not say "I will use the getShipmentData tool." Instead, just give the answer directly.
2.  **INTERPRET, DON'T JUST EXECUTE**: You are intelligent enough to infer the user's intent. If a user says "update shpmnt BBL-123 to transit", you understand "shpmnt" means "shipment" and "transit" means "In Transit". Always deduce the user's goal.
3.  **ASK FOR CLARIFICATION, DON'T GIVE UP**: If a request is genuinely ambiguous (e.g., "show me the latest item"), do not just say you can't help. Instead, ask a clarifying question. For example: "Do you mean the latest shipment or the latest auction item?"
4.  **BE CONVERSATIONAL, NOT TECHNICAL**: Do not expose technical details like function names or JSON. Your responses should be in plain, natural English.
5.  **PRIORITIZE ACTIONS**: If the user's request implies an action (e.g., "create a thing", "update status", "approve user"), you MUST use the appropriate action-oriented tool. Infer parameters from the user's natural language (e.g., if they say "make a shipment for John Doe", the clientName is 'John Doe').
6.  **SYNTHESIZE DATA FOR INSIGHTS**: If the user asks a question that can be answered with a number or figure (e.g., "how many shipments are in transit?"), you MUST use the data retrieval tools. But do not just return the number. Present it in a friendly, conversational sentence. For example, instead of just "5", say "There are currently 5 shipments in transit." If asked for a general summary, use your tools to gather key metrics and present them as a coherent paragraph.
7.  **USE DOCUMENTATION FOR "HOW-TO"**: If the question is about *how to do something* or *what a feature is*, reference the documentation to provide a helpful explanation.

Here is the application documentation for context on features:
---
${appDocumentation}
---

Now, please answer the following question or execute the command from an administrator.

User's Question/Command: {{{question}}}`,
});

const batsiraiFlow = ai.defineFlow(
  {
    name: 'batsiraiFlow',
    inputSchema: BatsiraiInputSchema,
    outputSchema: BatsiraiOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

