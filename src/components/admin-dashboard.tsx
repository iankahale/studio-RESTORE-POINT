
"use client";

import { useState, useMemo, useTransition } from 'react';
import type { Shipment } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, PlusCircle, Search, Edit, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { AddShipmentDialog } from './add-shipment-dialog';
import { Checkbox } from './ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { deleteShipments } from '@/lib/data';

export function AdminDashboard({ initialShipments }: { initialShipments: Shipment[] }) {
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
  const [consignmentSearch, setConsignmentSearch] = useState('');
  const [shakersSearch, setShakersSearch] = useState('');
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();


  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      if (consignmentSearch) {
        return shipment.consignmentNumber?.toLowerCase().includes(consignmentSearch.toLowerCase());
      }
      if (shakersSearch) {
        return shipment.shakersNumber?.toLowerCase().includes(shakersSearch.toLowerCase());
      }
      return true;
    }).sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
  }, [shipments, consignmentSearch, shakersSearch]);

  const handleDownloadCSV = () => {
    const headers = ["ID", "Consignment No.", "Shakers No.", "Description", "Origin", "Destination", "Status", "ETA"];
    const rows = filteredShipments.map(s => [
      s.id,
      s.consignmentNumber || '',
      s.shakersNumber || '',
      s.description,
      s.origin,
      s.destination,
      s.status,
      s.estimatedDeliveryDate,
    ].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "shipments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const onShipmentAdded = (newShipment: Shipment) => {
    setShipments(prev => [newShipment, ...prev]);
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
      setSelectedRows(filteredShipments.map(s => s.id));
    } else {
      setSelectedRows([]);
    }
  };
  
  const handleDeleteSelected = () => {
    startTransition(async () => {
        try {
            await deleteShipments(selectedRows);
            setShipments(prev => prev.filter(s => !selectedRows.includes(s.id)));
            setSelectedRows([]);
            toast({
                title: "Success!",
                description: `${selectedRows.length} shipment(s) have been deleted.`
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Error",
                description: "Failed to delete shipments."
            });
        }
    });
  }

  return (
    <div className="bg-card p-4 sm:p-6 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">All Shipments</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleDownloadCSV}>
            <Download />
            <span className="hidden sm:inline">Download CSV</span>
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <PlusCircle />
            <span className="hidden sm:inline">Add Shipment</span>
          </Button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Consignment Number"
            value={consignmentSearch}
            onChange={(e) => {
                setConsignmentSearch(e.target.value);
                if (e.target.value) setShakersSearch('');
            }}
            className="pl-10"
          />
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Shakers Number"
            value={shakersSearch}
            onChange={(e) => {
                setShakersSearch(e.target.value);
                if(e.target.value) setConsignmentSearch('');
            }}
            className="pl-10"
          />
        </div>
      </div>

       {selectedRows.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
            <p className="text-sm font-medium">{selectedRows.length} shipment(s) selected.</p>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 />
                        Delete Selected
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete {selectedRows.length} shipment(s) from the database.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSelected}>
                        {isPending ? "Deleting..." : "Yes, delete"}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"><Checkbox onCheckedChange={handleSelectAll} checked={selectedRows.length > 0 && selectedRows.length === filteredShipments.length} /></TableHead>
              <TableHead>Tracking No.</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.length > 0 ? (
              filteredShipments.map((shipment) => (
                <TableRow key={shipment.id} data-state={selectedRows.includes(shipment.id) && "selected"}>
                  <TableCell><Checkbox onCheckedChange={() => handleSelectRow(shipment.id)} checked={selectedRows.includes(shipment.id)} /></TableCell>
                  <TableCell className="font-medium">{shipment.id}</TableCell>
                  <TableCell>{shipment.description}</TableCell>
                  <TableCell>{shipment.destination}</TableCell>
                  <TableCell><Badge variant="secondary">{shipment.status}</Badge></TableCell>
                  <TableCell>{new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/track/${shipment.id}`} target="_blank">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Client Portal</span>
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/update/${shipment.id}`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Update</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No shipments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AddShipmentDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} onShipmentAdded={onShipmentAdded} />
    </div>
  );
}
