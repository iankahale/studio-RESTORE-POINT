import { getAuctionItems } from "@/lib/data";
import { AuctionDashboard } from "@/components/auction-dashboard";

export default async function AuctionListingPage() {
  const items = await getAuctionItems();

  return <AuctionDashboard initialItems={items} />;
}
