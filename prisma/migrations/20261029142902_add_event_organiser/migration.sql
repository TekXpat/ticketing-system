-- AlterTable
ALTER TABLE "events" ADD COLUMN     "organiser_id" TEXT;

-- CreateIndex
CREATE INDEX "events_organiser_id_idx" ON "events"("organiser_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organiser_id_fkey" FOREIGN KEY ("organiser_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
