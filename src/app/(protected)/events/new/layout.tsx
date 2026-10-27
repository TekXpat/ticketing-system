import { requireOrganiser } from "@/lib/auth/session";

// Everything under /events/new is for organisers only.
export default async function NewEventLayout({ children }: { children: React.ReactNode }) {
  await requireOrganiser();
  return children;
}
