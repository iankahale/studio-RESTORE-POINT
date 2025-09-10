
import { getCurrentUser } from "@/lib/auth";
import { ProfilePage } from "@/components/profile-page";
import { redirect } from "next/navigation";

export default async function AdminProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/admin');
  }

  return <ProfilePage user={currentUser} />;
}

    