import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { unreadMessageCount } from "@/lib/social";
import { BottomNav } from "@/components/BottomNav";
import { NativePushBridge } from "@/components/NativePushBridge";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // New accounts confirm their email before the app opens. Accounts that
  // existed before verification arrived carry mustVerifyEmail = false and are
  // never sent here — locking somebody out of an account they already had is
  // not a security improvement.
  if (user.mustVerifyEmail) redirect("/verify");

  // The inbox badge lives on the tab bar now, so the count is read once here
  // rather than on whichever screen happens to show a header.
  const unreadDm = await unreadMessageCount(user.id);

  return (
    <>
      {/*
        Inert outside the app shell. Inside it, this is what makes a tapped
        notification open the screen it is about, and what keeps the device
        token current across reinstalls.
      */}
      <NativePushBridge />
      {children}
      <BottomNav unreadDm={unreadDm} />
    </>
  );
}
