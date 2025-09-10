
"use client";

import { useState, useTransition, useEffect, useMemo } from 'react';
import { AuctionItem, Bidder, auctionCategories, AuctionItemCategory } from "@/lib/types";
import { placeBidOnItem } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Gavel, CheckCircle, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export function AuctionClientPage({ initialItems }: { initialItems: AuctionItem[] }) {
    const [items, setItems] = useState<AuctionItem[]>(initialItems);
    const [selectedCategory, setSelectedCategory] = useState<AuctionItemCategory | 'All'>('All');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);
    const [bidderInfo, setBidderInfo] = useState<Bidder | null>(null);
    const [bidAmount, setBidAmount] = useState(0);

    useEffect(() => {
        const savedBidder = localStorage.getItem('bidderInfo');
        if (savedBidder) {
            setBidderInfo(JSON.parse(savedBidder));
        }
    }, []);

    const filteredItems = useMemo(() => {
        const liveItems = items.filter(item => item.status !== 'Draft');
        if (selectedCategory === 'All') return liveItems;
        return liveItems.filter(item => item.category === selectedCategory);
    }, [items, selectedCategory]);

    const openBidDialog = (item: AuctionItem) => {
        const nextBid = (item.currentBid || item.price) * 1.1;
        setBidAmount(Math.ceil(nextBid));
        setSelectedItem(item);
    };

    const handlePlaceBid = () => {
        if (!selectedItem || !bidderInfo) return;
        
        const currentPrice = selectedItem.currentBid || selectedItem.price;
        if (bidAmount <= currentPrice) {
            toast({
                variant: 'destructive',
                title: 'Invalid Bid',
                description: `Your bid must be higher than the current price of $${currentPrice.toFixed(2)}.`
            });
            return;
        }

        startTransition(async () => {
            try {
                const updatedItem = await placeBidOnItem(selectedItem.id, bidAmount, bidderInfo);
                
                if (updatedItem) {
                    setItems(prevItems => prevItems.map(item => item.id === selectedItem.id ? updatedItem : item));
                    toast({
                        title: "Bid Placed!",
                        description: `You have successfully placed a bid on ${updatedItem.name}.`
                    });
                    setSelectedItem(null);
                }
            } catch (error: any) {
                 toast({
                    variant: 'destructive',
                    title: "Error",
                    description: error.message || "There was a problem placing your bid."
                });
            }
        });
    }
    
    const handleBidderInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const address = formData.get('address') as string;
        
        if (!phone.startsWith('+263')) {
            toast({
                variant: 'destructive',
                title: 'Bidding Restricted',
                description: 'Sorry, this auction is only open to bidders within Zimbabwe (+263).'
            });
            return;
        }

        if (name && email && phone && address) {
            const newBidderInfo = { name, email, phone, address };
            setBidderInfo(newBidderInfo);
            localStorage.setItem('bidderInfo', JSON.stringify(newBidderInfo));
        }
    };

    const handlePayNow = (item: AuctionItem) => {
        toast({
            title: "Redirecting to Payment...",
            description: `You are being redirected to a secure payment page for item: ${item.name}.`,
        });
        // In a real application, you would redirect to a payment provider like Stripe or PayPal.
        // window.location.href = `https://your-payment-provider.com/checkout?itemId=${item.id}`;
    };

    return (
        <>
            <div className="mb-8 flex flex-wrap justify-center gap-2">
                <Button 
                    variant={selectedCategory === 'All' ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory('All')}
                >
                    All Items
                </Button>
                {auctionCategories.map(category => (
                    <Button 
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </Button>
                ))}
            </div>

            {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {filteredItems.map((item) => (
                    <Card key={item.id} className={cn("overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col", item.status === 'Sold' && 'opacity-60 bg-secondary')}>
                        <Carousel className="w-full">
                            <CarouselContent>
                                {item.imageUrls.map((url, index) => (
                                    <CarouselItem key={index}>
                                        <div className="relative w-full aspect-square">
                                            <Image
                                                src={url}
                                                alt={`${item.name} - view ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                data-ai-hint="product image"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                             {item.imageUrls.length > 1 && (
                                <>
                                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                                </>
                             )}
                            <Badge className={cn("absolute top-2 right-2 z-10", item.status === 'BidOn' ? 'bg-orange-500' : item.status === 'Sold' ? 'bg-red-600 text-white' : 'bg-green-500')}>
                                {item.status}
                            </Badge>
                        </Carousel>
                        <CardHeader>
                        <CardTitle className="text-xl">{item.name}</CardTitle>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>{item.category}</span>
                            <span className="font-medium">Qty: {item.quantity}</span>
                        </div>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col">
                            <CardDescription className="flex-grow">{item.description}</CardDescription>
                            <div className="mt-4">
                                <div className="mb-2">
                                    <p className="text-sm text-muted-foreground">
                                        {item.status === 'BidOn' || item.status === 'Sold' ? 'Current Bid' : 'Starting Price'}
                                    </p>
                                    <p className="text-2xl font-bold text-primary">
                                        ${(item.currentBid || item.price).toFixed(2)}
                                    </p>
                                </div>
                                {item.status === 'Sold' ? (
                                    <Button className="w-full mt-2" variant="secondary" onClick={() => handlePayNow(item)}>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Pay Now
                                    </Button>
                                ) : (
                                    <Button 
                                        className="w-full mt-2" 
                                        onClick={() => openBidDialog(item)}
                                        disabled={isPending}
                                    >
                                        <Gavel className="mr-2 h-4 w-4" /> Place Bid
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold text-foreground">No Items in this Category</h2>
                    <p className="mt-2 text-muted-foreground">Please select another category or check back later.</p>
                </div>
            )}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent>
                    <DialogHeader>
                         <DialogTitle>Place a Bid on {selectedItem?.name}</DialogTitle>
                         <DialogDescription>
                            {bidderInfo ? `You are bidding as ${bidderInfo.name}. All bids are final.` : 'Create an account to place a bid. Your details will be saved for future bids.'}
                        </DialogDescription>
                    </DialogHeader>
                    {bidderInfo ? (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="bid-amount">Your Bid (USD)</Label>
                                <Input 
                                    id="bid-amount" 
                                    type="number" 
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(parseFloat(e.target.value))}
                                    min={(selectedItem?.currentBid || selectedItem?.price || 0) + 1}
                                    step="1"
                                />
                                <p className="text-xs text-muted-foreground">Minimum next bid is ${((selectedItem?.currentBid || selectedItem?.price || 0) * 1.1).toFixed(2)}</p>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setSelectedItem(null)}>Cancel</Button>
                                <Button onClick={handlePlaceBid} disabled={isPending}>
                                    {isPending ? 'Placing Bid...' : 'Confirm Bid'}
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <form onSubmit={handleBidderInfoSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" name="name" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" name="phone" type="tel" required placeholder="+263 XXX XXXXXX" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Physical Address</Label>
                                <Textarea id="address" name="address" required />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setSelectedItem(null)}>Cancel</Button>
                                <Button type="submit">Save and Continue to Bid</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
