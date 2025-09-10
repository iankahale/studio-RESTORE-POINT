# ShipTrackr: Logistics and Auction Management System

ShipTrackr is a comprehensive web application designed to manage logistics, shipment tracking, and auctions for unclaimed goods. It provides a robust admin dashboard for internal management and clean, client-facing interfaces for shipment tracking and auction bidding.

## Core Features

- **Admin Authentication**: Secure login for administrators.
- **Advanced Admin Dashboard**: A central hub for managing all aspects of the application, including shipment tracking, auction listings, packing list forms, and user management.
- **Shipment Management**: Admins can add, view, and update shipment details. The system supports tracking via a primary `BBL-` number, as well as secondary Consignment or Shakers numbers.
- **AI-Powered Delay Reasons**: An integrated AI tool assists admins by generating professional, customer-facing explanations for shipment delays or exceptions, ensuring clear and consistent communication.
- **Client Tracking Portal**: A simple, mobile-responsive page where clients can enter a tracking number to get real-time updates on their shipment's status and history.
- **Auction System**: A complete system for auctioning unclaimed goods. Admins can list items with images and descriptions, and clients can register and place bids. Bidding is restricted to users in Zimbabwe.
- **Dynamic Form Creator**: Admins can create custom packing list forms, associate them with a Consignment/Shakers number, and share a link with clients to submit their item details.
- **Admin Chat**: A real-time chat for internal communication between administrators, with support for smart tags that link directly to shipments, auctions, or admin pages.

---

## Getting Started: Connecting to Firebase

To connect this application to your Firebase project, you need to provide your service account credentials.

1.  **Open the `.env` file** in the file explorer.
2.  **Generate your credentials in Firebase:**
    *   Go to your Firebase project settings.
    *   Navigate to the **Service accounts** tab.
    *   Click the **Generate new private key** button. This will download a JSON file.
3.  **Copy and paste the values** from the downloaded JSON file into the corresponding fields in the `.env` file.
    *   *Important*: For the `FIREBASE_PRIVATE_KEY` value, you must ensure the newline characters (`\n`) are correctly formatted.

The application will automatically use these credentials to connect to Firebase services like Firestore.

---

## Admin Portal Guide

The admin portal is the control center for your application. The default super-admin credentials are:


### 1. Dashboard & Insights
The main dashboard provides a high-level overview of your operations with key performance indicators (KPIs) and charts for:
- Total shipments, in-transit counts, and recent deliveries.
- Pending admin approval requests.
- Shipment volume over the last 3 months.
- Distribution of shipment statuses.
- Auction performance, including total listed value vs. value with active bids.

### 2. Tracking
- **View All Shipments**: See a list of all shipments, sortable and searchable by Consignment or Shakers number.
- **Add New Shipment**: Manually add a new shipment record. A unique `BBL-XXXXXX` tracking ID will be generated.
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
- `#BBL-123456`: Links to the public tracking page for that shipment.
- `#auc-1`: Links to the public auction page.
- `#tracking`, `#settings`, etc.: Links to the corresponding admin pages.

### 6. Settings
- **Manage Admins**: The super admin (`iankahale@gmail.com`) can invite new admins, approve pending requests, and manage permissions.
- **Update Company Logo**: The super admin can upload a company logo that will be displayed across the application.

---

## Client-Facing Features

### 1. Shipment Tracking (Home Page)
- Clients can visit the main URL of the app to access the tracking form.
- They can enter their `BBL-` ID, Consignment Number, or Shakers Number to view a detailed history and the current status of their shipment.

### 2. Auction Page (`/auction`)
- Clients can view all items currently available for auction.
- To bid, they must first create an account by providing their name, email, address, and a valid Zimbabwean phone number (+263).
- Once registered, they can place bids on any available item. Bids are final.

### 3. Packing List Submission (`/form/view/[id]`)
- When an admin sends a client a link to a packing list form, the client can fill out the required fields and submit it.
- Upon submission, a new shipment is automatically created in the system, and the client's submitted data is recorded for admin viewing.
