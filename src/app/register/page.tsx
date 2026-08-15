import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/AuthForm";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/home");
  return <RegisterForm />;
}
