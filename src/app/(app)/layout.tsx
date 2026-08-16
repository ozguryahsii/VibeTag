import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { unreadMessageCount } from "@/lib/social";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // The inbox badge lives on the tab bar now, so the count is read once here
  // rather than on whichever screen happens to show a header.
  const unreadDm = await unreadMessageCount(user.id);

  return (
    <>
      {children}
      <BottomNav unreadDm={unreadDm} />
    </>
  );
}
