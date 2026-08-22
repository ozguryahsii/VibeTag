import { redirect } from "next/navigation";
import { getCurrentUser, readPendingLogin } from "@/lib/auth";
import { LoginOtpForm } from "@/components/LoginOtpForm";

export const dynamic = "force-dynamic";

/**
 * Between password and app: outside the (app) group like /verify, because
 * there is no session yet — only the pending-login ticket. No ticket, no
 * screen; back to the password.
 */
export default async function VerifyLoginPage() {
  // Already signed in? The second step is behind them.
  const signedIn = await getCurrentUser();
  if (signedIn) redirect("/home");

  const user = await readPendingLogin();
  if (!user) redirect("/login");

  return <LoginOtpForm email={user.email} />;
}
