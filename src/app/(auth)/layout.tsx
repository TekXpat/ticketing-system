import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

// Signed-in users have no reason to see the sign-in and sign-up pages.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/account");
  return children;
}
