
"use client";

import { useState, useMemo, useRef, useTransition, useEffect } from 'react';
import type { AuctionItem, AuctionItemStatus, AuctionItemCategory } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, PlusCircle, Search, Edit, Trash2, CheckCircle, Upload, Wand2, Loader2, FileQuestion, Send, X } from 'lucide-react';
import { AddAuctionItemDialog } from './add-auction-item-dialog';
import { EditAuctionItemDialog } from './edit-auction-item-dialog';
import Image from 'next/image';
import { addAuctionItem, finalizeAuctionItem, deleteAuctionItems, addAuctionItemsBatch, publishAuctionItems } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { analyzeAuctionCsv, AuctionCsvAnalysisOutput } from '@/ai/flows/analyze-auction-csv-flow';
import { Alert, AlertDescription as AlertDesc } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';

export function AuctionDashboard({ initialItems }: { initialItems: AuctionItem[] }) {
  const [items, setItems] = useState<AuctionItem[]>(initialItems);
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AuctionItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AuctionCsvAnalysisOutput | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
    ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, search]);

  const handleDownloadTemplate = () => {
    const headers = ["name", "description", "category", "price", "quantity"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "auction_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadListings = () => {
    const headers = ["ID", "Name", "Description", "Category", "Status", "Quantity", "Starting Price (USD)", "Final Bid (USD)", "Highest Bidder", "Bidder Email", "Bidder Phone"];
    const rows = filteredItems.map(item => {
        const row = [
            item.id,
            `"${item.name.replace(/"/g, '""')}"`,
            `"${item.description.replace(/"/g, '""')}"`,
            item.category,
            item.status,
            item.quantity,
            item.price,
            item.currentBid || '',
            item.highestBidder?.name || '',
            item.highestBidder?.email || '',
            item.highestBidder?.phone || '',
        ];
        return row.join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "auction_listings.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const onItemAdded = (newItem: AuctionItem) => {
    setItems(prev => [newItem, ...prev]);
  };

  const onItemUpdated = (updatedItem: AuctionItem) => {
     setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };
  
  const handleFinalize = (item: AuctionItem) => {
    startTransition(async () => {
        try {
            const finalizedItem = await finalizeAuctionItem(item.id);
            if (finalizedItem) {
                onItemUpdated(finalizedItem);
                toast({
                    title: "Sale Finalized!",
                    description: `A (simulated) payment notification has been sent to ${finalizedItem.highestBidder?.name}.`
                });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Finalization Failed", description: error.message });
        }
    });
  }

  const handleDelete = (itemIds: string[]) => {
    startTransition(async () => {
      try {
        await deleteAuctionItems(itemIds);
        setItems(prev => prev.filter(item => !itemIds.includes(item.id)));
        setSelectedRows([]);
        toast({
          title: `Deleted ${itemIds.length} item(s)`,
          description: `The selected items have been permanently deleted.`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete the items. Please try again.",
        });
      }
    });
  };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsAiAnalyzing(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            try {
                const result = await analyzeAuctionCsv({ csvData: content });
                setAiAnalysisResult(result);
            } catch (error) {
                toast({ variant: "destructive", title: "AI Analysis Failed", description: "Could not analyze the CSV file. Please check the format." });
            } finally {
                setIsAiAnalyzing(false);
            }
        };
        reader.readAsText(file);
        // Reset file input
        if(event.target) event.target.value = '';
    };

    const handleConfirmImport = () => {
        if (!aiAnalysisResult) return;

        startTransition(async () => {
            try {
                const newItemsPayload = aiAnalysisResult.cleanedData.map(row => ({
                    ...row,
                    category: row.category as AuctionItemCategory,
                    imageUrls: [`https://picsum.photos/seed/${row.name}/400/400`], // Placeholder image
                    status: 'Draft' as AuctionItemStatus,
                }));

                const newItems = await addAuctionItemsBatch(newItemsPayload);

                if (newItems.length > 0) {
                    setItems(prev => [...newItems, ...prev]);
                }

                toast({
                    title: "Import Complete",
                    description: `Successfully added ${newItems.length} items as drafts. Please add images before publishing.`,
                });
                setAiAnalysisResult(null);

            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Import Failed",
                    description: "There was an error importing the items. Please try again.",
                });
            }
        });
    };
    
    const getStatusBadgeVariant = (status: AuctionItemStatus) => {
        switch (status) {
            case 'Sold':
                return 'destructive';
            case 'BidOn':
                return 'default';
            case 'Draft':
                return 'outline';
            case 'Listed':
            default:
                return 'secondary';
        }
    }

    const handleSelectRow = (id: string) => {
        setSelectedRows(prev => 
        prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
        setSelectedRows(filteredItems.map(s => s.id));
        } else {
        setSelectedRows([]);
        }
    };
    
    const handleBulkPublish = () => {
        const draftIdsToPublish = selectedRows.filter(id => {
            const item = items.find(i => i.id === id);
            return item && item.status === 'Draft';
        });

        if (draftIdsToPublish.length === 0) {
            toast({
                title: "No Drafts to Publish",
                description: "Only items with a 'Draft' status can be published."
            });
            return;
        }

        startTransition(async () => {
            try {
                await publishAuctionItems(draftIdsToPublish);
                setItems(prev => prev.map(item => 
                    draftIdsToPublish.includes(item.id) ? { ...item, status: 'Listed' } : item
                ));
                setSelectedRows([]);
                toast({
                    title: "Items Published!",
                    description: `${draftIdsToPublish.length} item(s) are now live.`
                });
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: "Error",
                    description: "Failed to publish the selected items."
                });
            }
        });
    }

    const hasDraftsSelected = useMemo(() => {
        return selectedRows.some(id => {
            const item = items.find(i => i.id === id);
            return item && item.status === 'Draft';
        });
    }, [selectedRows, items]);


  return (
    <div className="bg-card p-4 sm:p-6 rounded-lg shadow-sm space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Auction Listings</h2>
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download />
                <span className="hidden sm:inline">CSV Template</span>
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isAiAnalyzing}>
                {isAiAnalyzing ? <Loader2 className="animate-spin" /> : <Upload />}
                 <span className="hidden sm:inline">Upload CSV</span>
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".csv"
            />
            <Button variant="outline" onClick={handleDownloadListings}>
                <Download />
                 <span className="hidden sm:inline">Download All</span>
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
                <PlusCircle />
                 <span className="hidden sm:inline">Add Item</span>
            </Button>
        </div>
      </div>

      <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
      </div>

       {selectedRows.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
            <p className="text-sm font-medium">{selectedRows.length} item(s) selected.</p>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkPublish} disabled={!hasDraftsSelected || isPending}>
                    <Send />
                    Publish
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 />
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {selectedRows.length} item(s) from the database.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(selectedRows)}>
                            {isPending ? "Deleting..." : "Yes, delete"}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
        )}

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"><Checkbox onCheckedChange={handleSelectAll} checked={selectedRows.length > 0 && selectedRows.length === filteredItems.length && filteredItems.length > 0} /></TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Highest Bidder</TableHead>
              <TableHead>Current Bid</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <TableRow key={item.id} className={cn(item.status === 'Sold' && 'bg-secondary/50')} data-state={selectedRows.includes(item.id) && "selected"}>
                  <TableCell><Checkbox onCheckedChange={() => handleSelectRow(item.id)} checked={selectedRows.includes(item.id)} /></TableCell>
                  <TableCell>
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                        <Image src={item.imageUrls[0]} alt={item.name} width={64} height={64} className="rounded-md object-cover w-16 h-16" />
                    ): (
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                   <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    {item.highestBidder ? (
                        <div>
                            <p className="font-medium">{item.highestBidder.name}</p>
                            <p className="text-xs text-muted-foreground">{item.highestBidder.email}</p>
                            <p className="text-xs text-muted-foreground">{item.highestBidder.phone}</p>
                        </div>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">${(item.currentBid || item.price).toFixed(2)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {item.status === 'BidOn' && (
                        <Button size="sm" onClick={() => handleFinalize(item)} disabled={isPending}>
                            <CheckCircle />
                            <span className="hidden sm:inline">Finalize</span>
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)} disabled={item.status === 'Sold'}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the item "{item.name}".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete([item.id])} disabled={isPending}>
                                    {isPending ? "Deleting..." : "Yes, delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24">
                  No auction items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AddAuctionItemDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} onItemAdded={onItemAdded} />
      {editingItem && (
        <EditAuctionItemDialog 
            open={!!editingItem} 
            onOpenChange={(open) => !open && setEditingItem(null)} 
            onItemUpdated={onItemUpdated}
            item={editingItem}
        />
      )}
      {aiAnalysisResult && (
        <Dialog open={!!aiAnalysisResult} onOpenChange={(open) => !open && setAiAnalysisResult(null)}>
            <DialogContent className="max-w-4xl grid-rows-[auto_1fr_auto] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Wand2 /> AI Analysis Complete</DialogTitle>
                    <DialogDescription>{aiAnalysisResult.summary}</DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 py-4 overflow-y-auto">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">AI Suggestions</h4>
                        {aiAnalysisResult.suggestions.length > 0 ? (
                            <Alert variant="default">
                                <FileQuestion className="h-4 w-4" />
                                <AlertDesc>
                                    <ul className="list-disc pl-4 space-y-1">
                                        {aiAnalysisResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </AlertDesc>
                            </Alert>
                        ) : (
                            <Alert variant="default">
                               <CheckCircle className="h-4 w-4" />
                               <AlertDesc>The AI found no issues. Everything looks good!</AlertDesc>
                            </Alert>
                        )}
                    </div>
                     <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Data to be Imported ({aiAnalysisResult.cleanedData.length} items)</h4>
                         <ScrollArea className="h-72 border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Qty</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {aiAnalysisResult.cleanedData.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell>{row.category}</TableCell>
                                            <TableCell>${row.price.toFixed(2)}</TableCell>
                                            <TableCell>{row.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setAiAnalysisResult(null)}>Cancel</Button>
                    <Button onClick={handleConfirmImport} disabled={isPending}>
                        {isPending ? 'Importing...' : `Confirm and Import ${aiAnalysisResult.cleanedData.length} Items`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
