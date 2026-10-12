import { requireUser } from "@/lib/auth/session";

// Every page under (protected)/ requires a signed-in user. This check is the
// authoritative one: it runs on the server for every request to these routes.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
