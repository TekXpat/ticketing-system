import { requireGateAccess } from "@/lib/auth/session";

// Everything under /gate is for organisers and gate staff only.
export default async function GateLayout({ children }: { children: React.ReactNode }) {
  await requireGateAccess();
  return children;
}
