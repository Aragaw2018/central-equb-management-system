/*
  Warnings:

  - The `status` column on the `EqubGroup` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `EqubMembership` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `chapaCheckoutUrl` on the `GroupPayment` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `GroupPayment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `GroupPayment` table. All the data in the column will be lost.
  - You are about to drop the column `txRef` on the `GroupPayment` table. All the data in the column will be lost.
  - The `status` column on the `GroupPayment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Guarantor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `documentStatus` column on the `Guarantor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `kycStatus` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[transactionId]` on the table `GroupPayment` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `category` on the `EqubPlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `transactionId` to the `GroupPayment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "GroupPayment_txRef_key";

-- AlterTable
ALTER TABLE "EqubGroup" ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "EqubMembership" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "EqubPlan" DROP COLUMN "category",
ADD COLUMN     "category" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GroupPayment" DROP COLUMN "chapaCheckoutUrl",
DROP COLUMN "paidAt",
DROP COLUMN "paymentMethod",
DROP COLUMN "txRef",
ADD COLUMN     "note" TEXT,
ADD COLUMN     "receiptImageUrl" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "transactionId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Guarantor" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
DROP COLUMN "documentStatus",
ADD COLUMN     "documentStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'MEMBER',
DROP COLUMN "kycStatus",
ADD COLUMN     "kycStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "DocumentStatus";

-- DropEnum
DROP TYPE "EqubCategory";

-- DropEnum
DROP TYPE "GroupStatus";

-- DropEnum
DROP TYPE "GuarantorStatus";

-- DropEnum
DROP TYPE "KycStatus";

-- DropEnum
DROP TYPE "MembershipStatus";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "Role";

-- CreateIndex
CREATE UNIQUE INDEX "GroupPayment_transactionId_key" ON "GroupPayment"("transactionId");
