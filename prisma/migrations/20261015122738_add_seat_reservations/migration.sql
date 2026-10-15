-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('HELD', 'SOLD');

-- CreateTable
CREATE TABLE "seat_reservations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "seat_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'HELD',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seat_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seat_reservations_event_id_idx" ON "seat_reservations"("event_id");

-- CreateIndex
CREATE INDEX "seat_reservations_user_id_idx" ON "seat_reservations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "seat_reservations_event_id_seat_id_key" ON "seat_reservations"("event_id", "seat_id");

-- AddForeignKey
ALTER TABLE "seat_reservations" ADD CONSTRAINT "seat_reservations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_reservations" ADD CONSTRAINT "seat_reservations_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_reservations" ADD CONSTRAINT "seat_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
