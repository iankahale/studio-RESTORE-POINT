
import { getShipmentById } from "@/lib/data";
import { TrackingResult } from "@/components/tracking-result";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type TrackingPageProps = {
  params: {
    id: string;
  };
};

export default async function TrackingPage({ params }: TrackingPageProps) {
  // Decode the ID from the URL to handle spaces and special characters in names/emails
  const decodedId = decodeURIComponent(params.id);
  const shipment = await getShipmentById(decodedId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-center">
           <h1 className="text-2xl font-bold text-center text-foreground">Beyond Borders Logistics</h1>
        </div>
        
        {shipment ? (
          <TrackingResult shipment={shipment} />
        ) : (
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>
              We could not find a shipment with the tracking number "{params.id}". Please check the number and try again.
            </AlertDescription>
            <div className="mt-4">
              <Button asChild variant="secondary">
                <Link href="/">Track Another Shipment</Link>
              </Button>
            </div>
          </Alert>
        )}
      </div>
    </div>
  );
}
