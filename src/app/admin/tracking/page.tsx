
import { getShipments } from "@/lib/data";
import { AdminDashboard } from "@/components/admin-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientTracking } from "@/components/client-tracking";
import { QrCodeTrigger } from "@/components/qr-code-trigger";

export default async function TrackingDashboardPage() {
  const shipments = await getShipments();

  return (
    <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Shipment Tracking</CardTitle>
                    <CardDescription>Here's an overview of your shipments. You can add new ones, update existing ones, and export data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <QrCodeTrigger />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Test a Tracking Number</CardTitle>
                    <CardDescription>Enter a tracking number, name, or email to see the client-facing view.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ClientTracking />
                </CardContent>
            </Card>
        </div>
        <AdminDashboard initialShipments={shipments} />
    </div>
  );
}
