/*
  Warnings:

  - The `status` column on the `BookCopy` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Borrowing` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Reservation` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "BookCopy" DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Borrowing" DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1;

-- DropEnum
DROP TYPE "BorrowStatus";

-- DropEnum
DROP TYPE "CopyStatus";

-- DropEnum
DROP TYPE "ReservationStatus";

-- CreateIndex
CREATE INDEX "BookCopy_bookId_status_idx" ON "BookCopy"("bookId", "status");

-- CreateIndex
CREATE INDEX "Reservation_readerId_bookId_status_idx" ON "Reservation"("readerId", "bookId", "status");
