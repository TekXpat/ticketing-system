import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` runs at image build time with no database, so this
    // falls back to an empty string instead of using the strict env() helper.
    url: process.env.DATABASE_URL ?? "",
  },
});
