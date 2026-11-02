import { timingSafeEqual } from "node:crypto";

// Constant-time comparison. A missing secret on either side means "refuse".
export function isValidCallbackSecret(
  provided: string | null,
  expected: string | undefined,
): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
