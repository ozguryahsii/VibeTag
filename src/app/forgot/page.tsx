import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ForgotForm } from "@/components/ResetForms";

export const dynamic = "force-dynamic";

export default async function ForgotPage() {
  if (await getCurrentUser()) redirect("/home");
  return <ForgotForm />;
}
