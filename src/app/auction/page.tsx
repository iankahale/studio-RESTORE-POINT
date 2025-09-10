
import { getAuctionItems } from "@/lib/data";
import Link from "next/link";
import { AuctionClientPage } from "@/components/auction-client-page";
import { Info } from "lucide-react";

export const revalidate = 30; // Revalidate every 30 seconds

export default async function AuctionPage() {
  const items = await getAuctionItems();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      <header className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mt-4">Unclaimed Goods Auction</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Find great deals on unclaimed freight items. New listings added weekly.
        </p>
      </header>
      <main className="max-w-7xl mx-auto">
        <AuctionClientPage initialItems={items} />
      </main>
      <footer className="max-w-4xl mx-auto mt-12 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
            <Info className="h-4 w-4" />
            <h3 className="font-semibold">Terms & Conditions</h3>
        </div>
        <p className="px-4">All items are sold as-is, where-is. All bids are final and considered a binding contract. Payment for won items is due within 48 hours of auction close. Failure to pay will result in forfeiture of the item and a ban from future auctions. Beyond Borders Logistics is not responsible for any damage that occurs after the item has been sold.</p>
      </footer>
    </div>
  );
}
