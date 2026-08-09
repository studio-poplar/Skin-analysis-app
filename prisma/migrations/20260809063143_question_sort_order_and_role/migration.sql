-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "role" TEXT,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;
