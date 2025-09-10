
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QrCode } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>About BBL Admins Portal</CardTitle>
                    <CardDescription>Logistics and Auction Management System</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>BBL Admins Portal is a comprehensive web application designed to manage logistics, shipment tracking, and auctions for unclaimed goods. It provides a robust admin dashboard for internal management and clean, client-facing interfaces for shipment tracking and auction bidding.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Core Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><span className="font-semibold">Admin Authentication:</span> Secure login for administrators.</li>
                        <li><span className="font-semibold">Advanced Admin Dashboard:</span> A central hub for managing all aspects of the application, including shipment tracking, auction listings, packing list forms, and user management.</li>
                        <li><span className="font-semibold">Shipment Management:</span> Admins can add, view, and update shipment details. The system supports tracking via a primary `BBL-` number, as well as secondary Consignment or Shakers numbers.</li>
                        <li><span className="font-semibold">AI-Powered Tools:</span> Integrated AI assists admins by generating professional customer-facing explanations for shipment delays, analyzing uploaded CSV files for auction listings, and executing commands.</li>
                        <li><span className="font-semibold">Client Tracking Portal:</span> A simple, mobile-responsive page where clients can enter a tracking number to get real-time updates on their shipment's status and history.</li>
                        <li><span className="font-semibold">Auction System:</span> A complete system for auctioning unclaimed goods. Admins can list items with images and descriptions, and clients can register and place bids. Bidding is restricted to users in Zimbabwe.</li>
                        <li><span className="font-semibold">Dynamic Form Creator:</span> Admins can create custom packing list forms, associate them with a Consignment/Shakers number, and share a link with clients to submit their item details.</li>
                        <li><span className="font-semibold">Admin Chat:</span> A real-time chat for internal communication between administrators, with support for smart tags and AI commands.</li>
                    </ul>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <QrCode className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Using the QR Code System</CardTitle>
                            <CardDescription>A guide to faster, error-proof shipment updates.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>The QR code system is designed to make updating shipments fast and accurate, especially for team members who handle physical packages in warehouses or at customs.</p>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="font-semibold">Step 1: Generate and Print the QR Code</h4>
                        <p className="text-sm text-muted-foreground">The person who first creates the shipment record is responsible for printing the QR code. This is usually done at the origin location (e.g., your office in China).</p>
                        <ul className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                            <li>Go to the "Tracking" page and find the shipment you just created.</li>
                            <li>Click the "Edit" button to go to the "Update Shipment" page.</li>
                            <li>You will see a QR code generated specifically for that shipment.</li>
                            <li>Click the "Download" button to save the QR code as an image, then print it as a sticker or label.</li>
                            <li><strong>Securely attach this printed label to the physical package.</strong></li>
                        </ul>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold">Step 2: Scan to Update Status</h4>
                        <p className="text-sm text-muted-foreground">As the package moves from one point to another, your team members can instantly update its status without typing anything.</p>
                         <ul className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                           <li>On the "Tracking" page, tap the "Scan QR Code" button. This will open your device's camera.</li>
                           <li>Point the camera at the QR code on the package.</li>
                           <li>The app will instantly recognize the shipment and take you directly to its "Update Shipment" page.</li>
                           <li>Update the status (e.g., change from "In Transit" to "Delivered"), add any remarks, and save.</li>
                        </ul>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold">Example Scenario</h4>
                        <p className="text-sm text-muted-foreground">Imagine a shipment of electronics from China to Zimbabwe.</p>
                        <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                            <li>An admin in **China** creates the shipment record in the portal. They go to the update page, download the QR code for `BBL-543210`, print it, and stick it on the box.</li>
                            <li>When the box arrives at the airport in **Harare, Zimbabwe**, a local admin uses their phone to scan the QR code.</li>
                            <li>The app immediately opens the page for `BBL-543210`. The admin updates the status to "In Transit" and sets the location to "Harare Airport".</li>
                            <li>This process is repeated at every step, providing real-time, accurate tracking for the client.</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Admin Portal Guide</CardTitle>
                     <CardDescription>The admin portal is the control center for your application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Separator />
                    <div className="pt-4">
                        <h4 className="font-semibold text-lg mb-2">1. Dashboard & Insights</h4>
                        <p>The main dashboard provides a high-level overview of your operations with KPIs and charts for total shipments, in-transit counts, pending approvals, shipment volume by type, status distribution, and auction performance.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-lg mb-2">2. Tracking</h4>
                        <p>View, add, and update shipment records. Use the "Suggest Remark with AI" button for "Delayed" or "Exception" statuses to generate professional client-facing notes. Use the QR code scanner for quick updates.</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg mb-2">3. Packing List</h4>
                        <p>This section has two tabs: "Form Creator" to build custom packing list forms for clients, and "Submissions" to view all client-provided data in one place.</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg mb-2">4. Auction Listing</h4>
                        <p>Manage all auction items, add new listings individually or via CSV upload, and finalize sales to the highest bidder. Uploaded CSVs are analyzed by an AI to ensure data quality before being saved as drafts.</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg mb-2">5. Chat</h4>
                        <p>A private, real-time chat for admins. Use smart tags like `#BBL-123456`, `#auc-1`, or `#tracking` to link to parts of the app. Give commands to Batsirai, your AI assistant.</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg mb-2">6. Settings</h4>
                        <p>A super admin can manage other admin accounts, approve requests, and update the company logo.</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Client-Facing Features</CardTitle>
                    <CardDescription>This is what your customers will interact with.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <h4 className="font-semibold text-lg mb-2">1. Shipment Tracking (Home Page)</h4>
                        <p>Clients can visit the main URL of the app to access the tracking form. They can enter their `BBL-` ID, Consignment Number, or Shakers Number to view a detailed history and the current status of their shipment.</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg mb-2">2. Auction Page (`/auction`)</h4>
                        <p>Clients can view all items currently available for auction. To bid, they must first create an account by providing their name, email, address, and a valid Zimbabwean phone number (+263). Once registered, they can place bids on any available item.</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg mb-2">3. Packing List Submission (`/form/view/[id]`)</h4>
                        <p>When an admin sends a client a link to a packing list form, the client can fill out the required fields and submit it. Upon submission, a new shipment is automatically created in the system, and the client's submitted data is recorded for admin viewing.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

    