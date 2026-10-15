-- AlterTable
ALTER TABLE "events" ADD COLUMN     "seat_layout_id" TEXT;

-- AlterTable
ALTER TABLE "ticket_types" ADD COLUMN     "seated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "section" TEXT;

-- CreateTable
CREATE TABLE "seat_layouts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seat_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "layout_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'main',
    "row_index" INTEGER NOT NULL,
    "col_index" INTEGER NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seats_layout_id_idx" ON "seats"("layout_id");

-- CreateIndex
CREATE UNIQUE INDEX "seats_layout_id_label_key" ON "seats"("layout_id", "label");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_seat_layout_id_fkey" FOREIGN KEY ("seat_layout_id") REFERENCES "seat_layouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "seat_layouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
