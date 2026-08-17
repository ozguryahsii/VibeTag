import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { VerifyForm } from "@/components/VerifyForm";

export const dynamic = "force-dynamic";

/**
 * Outside the (app) group on purpose.
 *
 * The app layout sends unverified new accounts here; if this page lived inside
 * that layout the redirect would send it to itself for ever.
 */
export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Already done and not being asked again — nothing to do here.
  if (user.emailVerifiedAt && !user.mustVerifyEmail) redirect("/settings");

  return <VerifyForm email={user.email} required={user.mustVerifyEmail} />;
}
