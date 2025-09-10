
"use client";

import type { Shipment, ShipmentHistoryItem, ShipmentStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Truck, PackageCheck, Clock, AlertTriangle, Package, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ScrollArea } from "./ui/scroll-area";
import { useState, useEffect } from "react";

const statusIcons: Record<ShipmentStatus, React.ReactNode> = {
  "Pending": <Package className="h-5 w-5" />,
  "In Transit": <Truck className="h-5 w-5" />,
  "Delivered": <PackageCheck className="h-5 w-5 text-green-500" />,
  "Delayed": <Clock className="h-5 w-5 text-orange-500" />,
  "Exception": <AlertTriangle className="h-5 w-5 text-red-500" />,
};

const statusColors: Record<ShipmentStatus, string> = {
  "Pending": "bg-gray-500",
  "In Transit": "bg-blue-500",
  "Delivered": "bg-green-500",
  "Delayed": "bg-orange-500",
  "Exception": "bg-red-500",
};

export function TrackingResult({ shipment }: { shipment: Shipment }) {
    const [formattedHistory, setFormattedHistory] = useState<ShipmentHistoryItem[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        setFormattedHistory(shipment.history.map(item => ({
            ...item,
            date: formatHistoryDate(item.date)
        })));
    }, [shipment.history]);


    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "PPP"); // e.g., Jun 18, 2024
        } catch (error) {
            return dateString; // Fallback for invalid dates
        }
    }
     const formatHistoryDate = (dateString: string) => {
        try {
            // Assumes ISO string like '2024-08-05T10:30:00Z' or '2024-08-05'
            return format(new Date(dateString), "PPpp"); // e.g., Jun 18, 2024, 4:30 PM
        } catch (error) {
            return dateString;
        }
    }

  return (
    <Card className="w-full shadow-lg flex flex-col max-h-[85vh]">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <CardTitle className="text-2xl md:text-3xl font-bold">Tracking #{shipment.id}</CardTitle>
                <CardDescription>
                Tracked via {shipment.shippingCompany}
                </CardDescription>
            </div>
          <Badge variant={shipment.status === 'Delivered' ? 'default' : 'secondary'} className={cn("text-lg", shipment.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800')}>
            {statusIcons[shipment.status]}
            <span className="ml-2">{shipment.status}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-sm">
            <div className="space-y-1">
                <p className="text-muted-foreground">Origin</p>
                <p className="font-medium">{shipment.origin}</p>
            </div>
            <div className="space-y-1">
                <p className="text-muted-foreground">Destination</p>
                <p className="font-medium">{shipment.destination}</p>
            </div>
            <div className="space-y-1">
                <p className="text-muted-foreground">Estimated Delivery</p>
                <p className="font-medium flex items-center"><Calendar className="mr-2 h-4 w-4 text-muted-foreground" />{formatDate(shipment.estimatedDeliveryDate)}</p>
            </div>
        </div>
        <Separator className="my-6" />
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-xl font-semibold mb-4">Shipment History</h3>
          <ScrollArea className="flex-1 pr-4">
            <div className="relative pl-6">
                <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border"></div>
                {isClient ? formattedHistory.map((item, index) => (
                <div key={index} className="mb-8 relative flex items-start">
                    <div className={cn("absolute left-[-1.3rem] top-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-card border-2", statusColors[item.status])}>
                    <div className="text-white">{statusIcons[item.status]}</div>
                    </div>
                    <div className="ml-4 flex-1">
                        <p className="font-semibold">{item.status}</p>
                        <p className="text-sm text-muted-foreground">{item.date} at {item.location}</p>
                        {item.remarks && <p className="text-sm mt-1">{item.remarks}</p>}
                    </div>
                </div>
                )) : shipment.history.map((_, index) => (
                    <div key={index} className="mb-8 relative flex items-start">
                         <div className={cn("absolute left-[-1.3rem] top-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-card border-2")}>
                         </div>
                         <div className="ml-4 flex-1 space-y-2">
                             <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                             <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                         </div>
                     </div>
                ))
                }
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
