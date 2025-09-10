
import { getAdmins, getShipments, getAuctionItems } from "@/lib/data";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default async function AdminDashboardPage() {
  const shipments = await getShipments();
  const admins = await getAdmins();
  const auctionItems = await getAuctionItems();

  return <AnalyticsDashboard shipments={shipments} admins={admins} auctionItems={auctionItems} />;
}
