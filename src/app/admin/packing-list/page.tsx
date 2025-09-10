
import { getPackingListForms } from "@/lib/data";
import { PackingListCreator } from "@/components/packing-list-creator";
import { SubmissionsViewer } from "@/components/submissions-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function PackingListPage() {
  const forms = await getPackingListForms();

  return (
    <div className="mt-6">
      <Tabs defaultValue="creator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="creator">Form Creator</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="creator">
          <PackingListCreator />
        </TabsContent>
        <TabsContent value="submissions">
          <SubmissionsViewer initialForms={forms} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
