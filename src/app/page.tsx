
import { ClientTracking } from "@/components/client-tracking";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 bg-gray-50 dark:bg-transparent">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
           <h1 className="text-2xl font-bold text-center text-foreground">Beyond Borders Logistics</h1>
        </div>
        <ClientTracking />
      </div>
    </main>
  );
}
