import Link from "next/link";
import { getShipmentById } from "@/lib/data";
import { UpdateShipmentForm } from "@/components/update-shipment-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UpdatePageProps = {
  params: {
    id: string;
  };
};

export default async function UpdatePage({ params }: UpdatePageProps) {
  const shipment = await getShipmentById(params.id);

  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/admin/tracking">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tracking
        </Link>
      </Button>

      {shipment ? (
        <Card>
            <CardHeader>
                <CardTitle>Update Shipment #{shipment.id}</CardTitle>
                <CardDescription>Modify the shipment details and status below. Use the AI tool to help generate delay reasons.</CardDescription>
            </CardHeader>
            <CardContent>
                <UpdateShipmentForm shipment={shipment} />
            </CardContent>
        </Card>
      ) : (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Shipment Not Found</AlertTitle>
          <AlertDescription>
            The shipment with ID "{params.id}" could not be found.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
