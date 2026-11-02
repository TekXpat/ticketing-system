import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "password123";

async function main() {
  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { role: "ORGANISER" },
    create: {
      email: DEMO_EMAIL,
      name: "Demo User",
      role: "ORGANISER",
      passwordHash: await hashPassword(DEMO_PASSWORD),
    },
  });
  console.log(`Seeded ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // A gate staff account, so the gate can be tried without editing the database.
  await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: { role: "STAFF" },
    create: {
      email: "staff@example.com",
      name: "Gate Staff",
      role: "STAFF",
      passwordHash: await hashPassword(DEMO_PASSWORD),
    },
  });
  console.log(`Seeded staff@example.com / ${DEMO_PASSWORD}`);
  // Demo bus layout: 5 rows x 4 seats, reused by every bus journey.
  const BUS_LAYOUT_NAME = "Demo bus (20 seats)";
  const existingBus = await prisma.seatLayout.findFirst({
    where: { name: BUS_LAYOUT_NAME },
  });

  if (existingBus) {
    console.log(`Layout "${BUS_LAYOUT_NAME}" already exists, skipping`);
  } else {
    const letters = ["A", "B", "C", "D"];
    const seats: { label: string; rowIndex: number; colIndex: number }[] = [];

    for (let row = 1; row <= 5; row++) {
      for (let col = 0; col < letters.length; col++) {
        seats.push({
          label: `${row}${letters[col]}`,
          rowIndex: row - 1,
          colIndex: col,
        });
      }
    }

    await prisma.seatLayout.create({
      data: { name: BUS_LAYOUT_NAME, seats: { create: seats } },
    });
    console.log(`Created layout "${BUS_LAYOUT_NAME}" with ${seats.length} seats`);
  }
}

main()
  .catch((error) => {
    console.error(error);

    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
