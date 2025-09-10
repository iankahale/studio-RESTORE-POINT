

import { z } from 'zod';

export type ShipmentStatus = 'Pending' | 'In Transit' | 'Delivered' | 'Delayed' | 'Exception';

export type ShipmentHistoryItem = {
  status: ShipmentStatus;
  date: string; // ISO Date String
  location: string;
  remarks?: string;
};

export type Shipment = {
  id: string; // This will be the main tracking number
  clientName?: string;
  clientEmail?: string;
  consignmentNumber?: string;
  shakersNumber?: string;
  origin: 'Dubai' | 'China';
  destination: 'Zimbabwe' | 'Zambia';
  estimatedDeliveryDate: string; // ISO Date String
  status: ShipmentStatus;
  history: ShipmentHistoryItem[];
  lastUpdate: string; // ISO Date String
  shippingCompany: string;
  description: string;
  // For searching
  consignmentNumberLower?: string;
  shakersNumberLower?: string;
  clientNameLower?: string;
};

export type ShipmentUpdatePayload = {
    destination: 'Zimbabwe' | 'Zambia';
    estimatedDeliveryDate: string;
    description: string;
    status: ShipmentStatus;
    location: string;
    remarks?: string;
}

export type Permission = 'dashboard' | 'tracking' | 'packing-list' | 'auction-listing' | 'chat' | 'settings';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Pending';
  password?: string; // Users will set their own password
  avatarUrl?: string;
  permissions: Permission[];
  invitationGeneratedAt?: string; // ISO Date String for invitation expiry
};

export type ProfileUpdatePayload = {
    name?: string;
    password?: string;
    currentPassword?: string;
    avatarUrl?: string;
}

// Types for Packing List Forms

export type FormFieldOption = {
    value: string;
}

export type FormField = {
    type: 'text' | 'textarea' | 'checkbox' | 'dropdown' | 'email' | 'tel' | 'name' | 'surname';
    label: string;
    required?: boolean;
    options?: FormFieldOption[];
}

export type SubmissionData = {
    [key: string]: string | boolean | string[];
}

export type PackingListSubmission = {
    id:string;
    formId: string;
    date: string; // ISO Date String
    submitter: {
        name: string;
        email: string;
    };
    data: SubmissionData;
}

export type PackingListForm = {
    id: string;
    title: string;
    description?: string;
    trackingNumber?: {
        type: 'consignment' | 'shakers';
        number: string;
    };
    fields: FormField[];
    submissions: PackingListSubmission[];
    createdAt: string; // ISO Date String
}

// Types for Auction Listings
export type AuctionItemStatus = 'Draft' | 'Listed' | 'BidOn' | 'Sold';
export type AuctionItemCategory = 'Jewellery' | 'Gadgets' | 'Machines' | 'Hardware' | 'Accessories' | 'Clothes' | 'Cosmetics' | 'Autospares';

export const auctionCategories: AuctionItemCategory[] = ['Jewellery', 'Gadgets', 'Machines', 'Hardware', 'Accessories', 'Clothes', 'Cosmetics', 'Autospares'];

export type Bidder = {
    name: string;
    email: string;
    phone: string;
    address: string;
}

export type Bid = {
    amount: number;
    bidder: Bidder;
    timestamp: string;
}

export type AuctionItem = {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrls: string[];
    category: AuctionItemCategory;
    status: AuctionItemStatus;
    quantity: number;
    currentBid?: number;
    highestBidder?: Bidder;
    bidHistory?: Bid[];
    createdAt: string; // ISO Date String
}

// Schema for AI CSV Analysis Flow
export const AuctionCsvAnalysisInputSchema = z.object({
  csvData: z.string().describe('The raw CSV data as a string, including a header row.'),
});
export type AuctionCsvAnalysisInput = z.infer<typeof AuctionCsvAnalysisInputSchema>;

const CsvRowSchema = z.object({
    name: z.string(),
    description: z.string(),
    category: z.string(),
    price: z.number(),
    quantity: z.number(),
});

export const AuctionCsvAnalysisOutputSchema = z.object({
    summary: z.string().describe("A brief, one-sentence summary of the analysis, like 'I\'ve reviewed the CSV and made some suggestions for improvement.' or 'The CSV looks great and is ready to import.'"),
    suggestions: z.array(z.string()).describe('A list of actionable suggestions to improve the listings. This should be empty if no issues are found.'),
    cleanedData: z.array(CsvRowSchema).describe('The cleaned and validated data, ready for import. Invalid rows should be excluded.'),
});
export type AuctionCsvAnalysisOutput = z.infer<typeof AuctionCsvAnalysisOutputSchema>;


// Types for Admin Chat
export type ChatMessage = {
    id: string;
    adminId: string;
    adminName: string;
    avatarUrl?: string;
    message: string;
    messageHtml?: string; // To store message with rendered links
    timestamp: string; // ISO Date String
}

    