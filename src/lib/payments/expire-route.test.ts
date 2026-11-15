import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/maintenance/expire/route";

const SECRET = "test-maintenance-secret";

function call(secret?: string) {
  return POST(
    new Request("http://localhost/api/maintenance/expire", {
      method: "POST",
      headers: secret ? { "x-callback-secret": secret } : {},
    }),
  );
}

// Only the refusal paths are tested here. The sweep itself is tested in
// settle.test.ts, and running it here would time out other tests' payments
// when the test files run in parallel on the same database.
describe("expire endpoint", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("refuses a missing or wrong secret", async () => {
    vi.stubEnv("PAYMENT_CALLBACK_SECRET", SECRET);

    expect((await call()).status).toBe(401);
    expect((await call("wrong")).status).toBe(401);
  });

  it("refuses every call when no secret is configured", async () => {
    vi.stubEnv("PAYMENT_CALLBACK_SECRET", "");

    expect((await call("anything")).status).toBe(401);
  });
});
