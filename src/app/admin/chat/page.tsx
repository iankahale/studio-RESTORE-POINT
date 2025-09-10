import { getAdmins, getChatMessages } from "@/lib/data";
import { AdminChat } from "@/components/admin-chat";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const initialMessages = await getChatMessages();
  const admins = await getAdmins();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/admin');
  }

  return <AdminChat initialMessages={initialMessages} admins={admins} currentUser={currentUser} />;
}
