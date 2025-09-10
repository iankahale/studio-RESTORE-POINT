
"use client";

import { useState, useRef, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Download, Trash2 } from "lucide-react";
import type { PackingListForm, PackingListSubmission } from "@/lib/types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription as DialogDesc,
    DialogFooter,
  } from '@/components/ui/dialog';
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
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { deletePackingListSubmissions } from "@/lib/data";
import { ToastAction } from "./ui/toast";

function downloadSubmissionsAsCSV(submissions: PackingListSubmission[], formTitle: string, headers: string[]) {
    const rows = submissions.map(sub => {
        const rowData = [sub.submitter.name, sub.submitter.email, sub.date];
        headers.slice(3).forEach(header => {
             rowData.push(sub.data[header] || '');
        });
        return rowData.map(value => {
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
        }).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [[...headers].join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${formTitle.replace(/ /g, '_')}_submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


export function SubmissionsViewer({
  initialForms,
}: {
  initialForms: PackingListForm[];
}) {
  const [forms, setForms] = useState(initialForms);
  const [selectedForm, setSelectedForm] = useState<PackingListForm | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<PackingListSubmission | null>(null);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [pendingDeletions, setPendingDeletions] = useState<PackingListSubmission[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const deletionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (form: PackingListForm, checked: boolean | string) => {
    if (checked) {
      setSelectedRows(form.submissions.map(s => s.id));
    } else {
      setSelectedRows([]);
    }
  };

  const startDeletionProcess = () => {
    if (!selectedForm) return;

    if (deletionTimeoutRef.current) {
      clearTimeout(deletionTimeoutRef.current);
    }
    
    const submissionsToDelete = selectedForm.submissions.filter(sub => selectedRows.includes(sub.id));
    setPendingDeletions(submissionsToDelete);

    // Update UI immediately
    const updatedForm = {
        ...selectedForm,
        submissions: selectedForm.submissions.filter(sub => !selectedRows.includes(sub.id))
    };
    setSelectedForm(updatedForm);
    setSelectedRows([]);


    toast({
        title: `${submissionsToDelete.length} submission(s) removed`,
        description: `The selected submissions have been removed.`,
        action: (
            <ToastAction altText="Undo" onClick={() => handleUndo(submissionsToDelete)}>
                Undo
            </ToastAction>
        ),
    });

    deletionTimeoutRef.current = setTimeout(() => {
        performActualDeletion(selectedForm.id, submissionsToDelete.map(s => s.id));
        deletionTimeoutRef.current = null;
        setPendingDeletions([]);
    }, 5000);
  };

  const handleUndo = (submissionsToRestore: PackingListSubmission[]) => {
     if (deletionTimeoutRef.current) {
        clearTimeout(deletionTimeoutRef.current);
        deletionTimeoutRef.current = null;
    }
    if (selectedForm) {
        const restoredSubmissions = [...selectedForm.submissions, ...submissionsToRestore]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setSelectedForm({ ...selectedForm, submissions: restoredSubmissions });
    }
    setPendingDeletions([]);
    toast({ title: 'Action Undone', description: `Submissions have been restored.`});
  };

  const performActualDeletion = (formId: string, submissionIds: string[]) => {
    startTransition(async () => {
        try {
            await deletePackingListSubmissions(formId, submissionIds);
            // Also update the main forms list in the background
            setForms(prev => prev.map(f => f.id === formId ? { ...f, submissions: f.submissions.filter(s => !submissionIds.includes(s.id)) } : f));
        } catch (error) {
            toast({ variant: 'destructive', title: "Final Deletion Failed", description: "Could not remove submissions from server." });
        }
    });
  };

  const handleDownloadSelected = () => {
    if (!selectedForm) return;
    const selectedSubmissions = selectedForm.submissions.filter(sub => selectedRows.includes(sub.id));
    if (selectedSubmissions.length > 0) {
        const headers = ['Submitter Name', 'Submitter Email', 'Submission Date', ...selectedForm.fields.map(f => f.label)];
        downloadSubmissionsAsCSV(selectedSubmissions, selectedForm.title, headers);
    }
  }

  const renderSubmissionsForForm = (form: PackingListForm) => (
    <div>
        <Button onClick={() => { setSelectedForm(null); setSelectedRows([]) }} variant="outline" className="mb-4">
            &larr; Back to All Forms
        </Button>
      <Card>
        <CardHeader>
          <CardTitle>Submissions for: {form.title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {form.submissions.length} submitted forms for tracking number: <Badge>{form.trackingNumber?.number || 'N/A'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {selectedRows.length > 0 && (
            <div className="flex items-center justify-between p-3 mb-4 bg-secondary rounded-md">
                <p className="text-sm font-medium">{selectedRows.length} submission(s) selected.</p>
                <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadSelected}>
                        <Download className="mr-2 h-4 w-4"/>
                        Download CSV
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Delete Selected
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete {selectedRows.length} submission(s).
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={startDeletionProcess} disabled={isPending}>
                                {isPending ? "Deleting..." : "Yes, delete"}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
          )}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox onCheckedChange={(checked) => handleSelectAll(form, checked)} checked={selectedRows.length > 0 && selectedRows.length === form.submissions.length && form.submissions.length > 0} />
                  </TableHead>
                  <TableHead>Submitter Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.submissions.length > 0 ? (
                    form.submissions.map((sub) => (
                    <TableRow key={sub.id} data-state={selectedRows.includes(sub.id) && "selected"}>
                        <TableCell><Checkbox onCheckedChange={() => handleSelectRow(sub.id)} checked={selectedRows.includes(sub.id)} /></TableCell>
                        <TableCell className="font-medium">
                        {sub.submitter.name}
                        </TableCell>
                        <TableCell>{sub.submitter.email}</TableCell>
                        <TableCell>{new Date(sub.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setViewingSubmission(sub)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Submission</span>
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No submissions for this form yet.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {viewingSubmission && (
        <Dialog open={!!viewingSubmission} onOpenChange={(open) => !open && setViewingSubmission(null)}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Submission Details</DialogTitle>
                    <DialogDesc>
                        From: {viewingSubmission.submitter.name} ({viewingSubmission.submitter.email}) on {new Date(viewingSubmission.date).toLocaleDateString()}
                    </DialogDesc>
                </DialogHeader>
                <Separator />
                <div className="py-4 space-y-4">
                    <h4 className="font-semibold">Packing List Contents</h4>
                     <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Field</TableHead>
                                    <TableHead>Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(viewingSubmission.data).map(([key, value]) => (
                                    <TableRow key={key}>
                                        <TableCell className="font-medium">{key}</TableCell>
                                        <TableCell>{String(value)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => downloadSubmissionsAsCSV([viewingSubmission], form.title, ['Submitter Name', 'Submitter Email', 'Submission Date', ...Object.keys(viewingSubmission.data)])}>
                        <Download className="mr-2 h-4 w-4" />
                        Download as CSV
                    </Button>
                    <Button onClick={() => setViewingSubmission(null)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );

  const renderFormList = () => (
    <Card>
      <CardHeader>
        <CardTitle>View Submissions</CardTitle>
        <CardDescription>
          Select a form to view its submitted packing lists.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form Title</TableHead>
                <TableHead>Tracking Number</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {form.title}
                  </TableCell>
                  <TableCell>
                    <Badge>{form.trackingNumber?.number || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{form.submissions.length}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedForm(form)}
                      disabled={form.submissions.length === 0}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Submissions
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return selectedForm
    ? renderSubmissionsForForm(selectedForm)
    : renderFormList();
}
