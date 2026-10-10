-- AlterTable
ALTER TABLE "DrawResult" ADD COLUMN     "cycleNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "EqubGroup" ADD COLUMN     "cycleNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "GroupPayment" ADD COLUMN     "cycleNumber" INTEGER NOT NULL DEFAULT 1;
