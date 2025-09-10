
import { getPackingListFormById } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { PublicPackingListForm } from "@/components/public-packing-list-form";

type FormViewPageProps = {
  params: {
    id: string;
  };
};

export default async function FormViewPage({ params }: FormViewPageProps) {
  const form = await getPackingListFormById(params.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex justify-center">
            <h1 className="text-2xl font-bold text-center text-foreground">Beyond Borders Logistics</h1>
        </div>
        
        {form ? (
          <PublicPackingListForm form={form} />
        ) : (
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Form Not Found</AlertTitle>
            <AlertDescription>
              We could not find the form you were looking for. Please check the link and try again.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
