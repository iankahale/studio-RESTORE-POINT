
import { getAdmins } from "@/lib/data";
import { AdminSettings } from "@/components/admin-settings";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import Loading from '@/app/loading';
import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

const superAdmins = ['bblgroup@protonmail.com'];

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    // Should be caught by the layout, but as a safeguard.
    redirect('/admin');
  }

  // Secure this page to only be accessible by super admins.
  if (!currentUser.email || !superAdmins.includes(currentUser.email)) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Admin Settings</CardTitle>
                    <CardDescription>Manage administrator accounts, company settings, and pending requests. Some actions are restricted to the super admin.</CardDescription>
                </CardHeader>
            </Card>
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                   You do not have permission to view this page. Please contact a super administrator if you believe this is an error.
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  const admins = await getAdmins();

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>Manage administrator accounts, company settings, and pending requests. Some actions are restricted to the super admin.</CardDescription>
            </CardHeader>
        </Card>
        <AdminSettings initialAdmins={admins} currentUser={currentUser} />
    </div>
  );
}

    