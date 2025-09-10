

import { getAdminById } from "@/lib/data";
import { SetPasswordForm } from "@/components/set-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";


type SetPasswordPageProps = {
  params: {
    id: string;
  };
};

// 2 minutes in milliseconds
const INVITATION_EXPIRY_MS = 2 * 60 * 1000;

export default async function SetPasswordPage({ params }: SetPasswordPageProps) {
  const admin = await getAdminById(params.id);

  let content: React.ReactNode;
  
  if (!admin) {
    content = (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Invalid Link</AlertTitle>
            <AlertDescription>
                This password setup link is invalid or has expired. Please contact an administrator for a new link.
            </AlertDescription>
        </Alert>
    );
  } else if (admin.password) {
      content = (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account Already Set Up</AlertTitle>
            <AlertDescription>
                This account has already been set up. If you forgot your password, please contact a super admin.
            </AlertDescription>
            <div className="mt-4">
                <Button asChild>
                    <Link href="/admin">Go to Login</Link>
                </Button>
            </div>
        </Alert>
      )
  } else if (!admin.invitationGeneratedAt || (new Date().getTime() - new Date(admin.invitationGeneratedAt).getTime() > INVITATION_EXPIRY_MS)) {
      content = (
        <Alert variant="destructive">
            <Clock className="h-4 w-4" />
            <AlertTitle>Invitation Expired</AlertTitle>
            <AlertDescription>
                This invitation link has expired for security reasons. Please ask the administrator to generate a new one for you.
            </AlertDescription>
        </Alert>
      );
  } else {
    content = (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Welcome, {admin.name}!</CardTitle>
                <CardDescription>Set your password to complete your account setup.</CardDescription>
            </CardHeader>
            <CardContent>
                <SetPasswordForm adminId={admin.id} />
            </CardContent>
            <CardFooter className="flex items-center justify-center text-sm">
                <p>
                    Already have an account?{" "}
                    <Link href="/admin" className="font-semibold text-primary underline-offset-4 hover:underline">
                        Login
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
  }


  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
            <div className="flex justify-center mb-6">
                <h1 className="text-2xl font-bold text-center text-foreground">Beyond Borders Logistics</h1>
            </div>
            {content}
        </div>
    </main>
  );
}
