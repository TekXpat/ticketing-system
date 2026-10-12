import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "./db";

// Runs against the real database: `make up` locally, a Postgres service in CI.
describe("database", () => {
  afterAll(() => db.$disconnect());

  it("deletes a user's sessions when the user is deleted", async () => {
    const user = await db.user.create({
      data: { email: `db-test-${randomUUID()}@example.com`, passwordHash: "unused" },
    });
    await db.session.create({
      data: { id: randomUUID(), userId: user.id, expiresAt: new Date(Date.now() + 60_000) },
    });

    await db.user.delete({ where: { id: user.id } });

    await expect(db.session.count({ where: { userId: user.id } })).resolves.toBe(0);
  });
});
