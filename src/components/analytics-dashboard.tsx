
"use client";

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Pie, PieChart, Cell, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AdminUser, Shipment, ShipmentStatus, AuctionItem } from '@/lib/types';
import { Truck, Package, Clock, UserCheck, PackageCheck, Gavel, DollarSign, FileText, Anchor, Plane } from 'lucide-react';
import { format, subMonths, subDays, startOfMonth } from 'date-fns';

const statusColors: Record<ShipmentStatus, string> = {
    "Pending": "#a855f7",     // Bright Purple
    "In Transit": "#0ea5e9",    // Bright Sky Blue
    "Delivered": "#22c55e",   // Neon Green
    "Delayed": "#f59e0b",     // Bright Amber
    "Exception": "#ef4444",   // Bright Red
};

export function AnalyticsDashboard({ shipments, admins, auctionItems }: { shipments: Shipment[], admins: AdminUser[], auctionItems: AuctionItem[] }) {
    
    const kpiData = useMemo(() => {
        const totalShipments = shipments.length;
        const inTransit = shipments.filter(s => s.status === 'In Transit').length;
        const pendingAdminApprovals = admins.filter(a => a.role === 'Pending').length;
        const oneMonthAgo = subDays(new Date(), 30);

        const deliveredLast30Days = shipments.filter(s => {
            if (s.status !== 'Delivered') return false;
            const deliveryDate = s.history.find(h => h.status === 'Delivered')?.date;
            if (!deliveryDate) return false;
            return new Date(deliveryDate) >= oneMonthAgo;
        }).length;

        const consignmentsLast30Days = shipments.filter(s => {
            if (!s.consignmentNumber) return false;
            const createdDate = s.history[s.history.length - 1].date; // Assumes last history item is creation
            return new Date(createdDate) >= oneMonthAgo;
        }).length;

        const shakersLast30Days = shipments.filter(s => {
            if (!s.shakersNumber) return false;
            const createdDate = s.history[s.history.length - 1].date; // Assumes last history item is creation
            return new Date(createdDate) >= oneMonthAgo;
        }).length;
        
        const totalAuctionItems = auctionItems.length;
        const totalAuctionValue = auctionItems.reduce((sum, item) => sum + item.price, 0);

        return { 
            totalShipments, 
            inTransit, 
            pendingAdminApprovals, 
            deliveredLast30Days, 
            totalAuctionItems, 
            totalAuctionValue,
            consignmentsLast30Days,
            shakersLast30Days
        };
    }, [shipments, admins, auctionItems]);

    const monthlyShipmentsData = useMemo(() => {
        const data: { [key: string]: { consignments: number; shakers: number } } = {};
        const threeMonthsAgo = startOfMonth(subMonths(new Date(), 2));

        // Initialize last 3 months
        for (let i = 0; i < 3; i++) {
            const month = format(subMonths(new Date(), i), 'MMM yyyy');
            data[month] = { consignments: 0, shakers: 0 };
        }

        shipments.forEach(s => {
            const shipmentDate = new Date(s.history[s.history.length-1].date);
            if (shipmentDate >= threeMonthsAgo) {
                const month = format(shipmentDate, 'MMM yyyy');
                if (data[month]) {
                    if (s.consignmentNumber) {
                        data[month].consignments++;
                    } else if (s.shakersNumber) {
                        data[month].shakers++;
                    }
                }
            }
        });
        
        return Object.entries(data).map(([name, values]) => ({ name, ...values })).reverse();
    }, [shipments]);

    const statusDistributionData = useMemo(() => {
        const data = shipments.reduce((acc, s) => {
            acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
        }, {} as Record<ShipmentStatus, number>);

        return Object.entries(data).map(([name, value]) => ({ name, value, fill: statusColors[name as ShipmentStatus] }));
    }, [shipments]);
    
    const auctionPerformanceData = useMemo(() => {
        const totalValue = auctionItems.reduce((sum, item) => sum + item.price, 0);
        const bidValue = auctionItems.reduce((sum, item) => {
            if (item.status === 'BidOn' || item.status === 'Sold') {
                return sum + (item.currentBid || item.price);
            }
            return sum;
        }, 0);

        return [
            { name: 'Total Listed Value', value: totalValue, fill: '#6b7280' }, // Muted Gray
            { name: 'Value with Bids', value: '#14b8a6' }, // Bright Teal
        ];
    }, [auctionItems]);


  return (
    <div className="space-y-8">
        {/* Top Level KPIs */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-balance">Total Shipments</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData.totalShipments}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-balance">In Transit</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData.inTransit}</div>
                    <p className="text-xs text-muted-foreground">Currently on the move</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-balance">Delivered</CardTitle>
                    <PackageCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData.deliveredLast30Days}</div>
                    <p className="text-xs text-muted-foreground">in the last 30 days</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-balance">Consignments</CardTitle>
                    <Plane className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData.consignmentsLast30Days}</div>
                    <p className="text-xs text-muted-foreground">in the last 30 days</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-balance">Shakers</CardTitle>
                    <Anchor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData.shakersLast30Days}</div>
                    <p className="text-xs text-muted-foreground">in the last 30 days</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-balance">Pending Approvals</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData.pendingAdminApprovals}</div>
                    <p className="text-xs text-muted-foreground">Admin access requests</p>
                </CardContent>
            </Card>
        </div>

        {/* Shipment Insights Group */}
        <Card>
             <CardHeader>
                <CardTitle>Shipment Insights</CardTitle>
                <CardDescription>An overview of shipment statuses and volumes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1 bg-secondary/30">
                    <CardHeader>
                        <CardTitle className="text-base font-medium">Shipment Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-[250px] w-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Pie data={statusDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {statusDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 bg-secondary/30">
                    <CardHeader>
                        <CardTitle className="text-base font-medium">Shipment Volume by Type</CardTitle>
                        <CardDescription className="text-xs">Consignment vs. Shakers shipments in the last 3 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-[250px] w-full">
                            <BarChart accessibilityLayer data={monthlyShipmentsData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                dataKey="name"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                                />
                                <YAxis />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Bar dataKey="consignments" stackId="a" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="shakers" stackId="a" fill="#d946ef" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>

        {/* Auction Insights Group */}
        <Card>
            <CardHeader>
                <CardTitle>Auction Insights</CardTitle>
                <CardDescription>Key metrics and performance for current auction listings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="grid gap-6 md:grid-cols-2 lg:col-span-1">
                        <Card className="bg-secondary/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Listed Items</CardTitle>
                                <Gavel className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kpiData.totalAuctionItems}</div>
                                <p className="text-xs text-muted-foreground">Currently for bidding</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-secondary/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Value (USD)</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${kpiData.totalAuctionValue.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">Combined starting price</p>
                            </CardContent>
                        </Card>
                    </div>
                    <Card className="lg:col-span-2 bg-secondary/30">
                        <CardHeader>
                            <CardTitle className="text-base font-medium">Auction Performance</CardTitle>
                            <CardDescription className="text-xs">Value of all listed items vs. items with active bids.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={{}} className="h-[150px] w-full">
                                <BarChart accessibilityLayer data={auctionPerformanceData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid horizontal={false} />
                                    <XAxis type="number" dataKey="value" tickFormatter={(value) => `$${value / 1000}k`} />
                                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={110} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="value" radius={5}>
                                        {auctionPerformanceData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

    
