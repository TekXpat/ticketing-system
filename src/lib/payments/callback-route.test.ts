import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/payments/callback/route";
import { db } from "@/lib/db";
import { isValidCallbackSecret } from "./secret";

const SECRET = "test-secret-value";

function call(body: unknown, secret?: string) {
  return POST(
    new Request("http://localhost/api/payments/callback", {
      method: "POST",
      headers: secret ? { "x-callback-secret": secret } : {},
      body: JSON.stringify(body),
    }),
  );
}

describe("isValidCallbackSecret", () => {
  it("accepts only the exact secret", () => {
    expect(isValidCallbackSecret(SECRET, SECRET)).toBe(true);
    expect(isValidCallbackSecret("wrong", SECRET)).toBe(false);
    expect(isValidCallbackSecret(null, SECRET)).toBe(false);
  });

  it("refuses everything when no secret is configured", () => {
    expect(isValidCallbackSecret("anything", undefined)).toBe(false);
    expect(isValidCallbackSecret("", "")).toBe(false);
  });
});

describe("payment callback route", () => {
  afterEach(() => vi.unstubAllEnvs());
  afterAll(() => db.$disconnect());

  it("rejects a call with a wrong or missing secret", async () => {
    vi.stubEnv("PAYMENT_CALLBACK_SECRET", SECRET);
    const body = { providerRef: "momo_x", outcome: "success" };

    expect((await call(body, "wrong")).status).toBe(401);
    expect((await call(body)).status).toBe(401);
  });

  it("refuses every call when the server has no secret configured", async () => {
    vi.stubEnv("PAYMENT_CALLBACK_SECRET", "");

    const response = await call({ providerRef: "momo_x", outcome: "success" }, "anything");

    expect(response.status).toBe(401);
  });

  it("rejects a malformed body and an unknown payment", async () => {
    vi.stubEnv("PAYMENT_CALLBACK_SECRET", SECRET);

    expect((await call({ providerRef: "momo_x", outcome: "maybe" }, SECRET)).status).toBe(400);
    expect((await call({ providerRef: "momo_unknown", outcome: "success" }, SECRET)).status).toBe(
      404,
    );
  });
});
