import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 does not read .env itself. Load it so host commands such as
// `npx prisma studio` find DATABASE_URL. Variables already set (as Docker
// Compose does in the containers) are not overridden.
config({ quiet: true });

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
