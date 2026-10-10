/*
  Warnings:

  - You are about to drop the column `accountName` on the `EqubGroup` table. All the data in the column will be lost.
  - You are about to drop the column `accountNumber` on the `EqubGroup` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `EqubGroup` table. All the data in the column will be lost.
  - The `status` column on the `EqubGroup` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `EqubMembership` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `note` on the `GroupPayment` table. All the data in the column will be lost.
  - You are about to drop the column `receiptImageUrl` on the `GroupPayment` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `GroupPayment` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `GroupPayment` table. All the data in the column will be lost.
  - The `status` column on the `GroupPayment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Guarantor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `documentStatus` column on the `Guarantor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `kycStatus` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Equb` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[txRef]` on the table `GroupPayment` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `category` on the `EqubPlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `txRef` to the `GroupPayment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'ADMIN', 'ORGANIZER');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EqubCategory" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('OPEN', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "GuarantorStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Equb" DROP CONSTRAINT "Equb_organizerId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_equbId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropIndex
DROP INDEX "GroupPayment_transactionId_key";

-- AlterTable
ALTER TABLE "EqubGroup" DROP COLUMN "accountName",
DROP COLUMN "accountNumber",
DROP COLUMN "bankName",
DROP COLUMN "status",
ADD COLUMN     "status" "GroupStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "EqubMembership" DROP COLUMN "status",
ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "EqubPlan" DROP COLUMN "category",
ADD COLUMN     "category" "EqubCategory" NOT NULL;

-- AlterTable
ALTER TABLE "GroupPayment" DROP COLUMN "note",
DROP COLUMN "receiptImageUrl",
DROP COLUMN "reviewedAt",
DROP COLUMN "transactionId",
ADD COLUMN     "chapaCheckoutUrl" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "txRef" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Guarantor" DROP COLUMN "status",
ADD COLUMN     "status" "GuarantorStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "documentStatus",
ADD COLUMN     "documentStatus" "DocumentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER',
DROP COLUMN "kycStatus",
ADD COLUMN     "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "Equb";

-- DropTable
DROP TABLE "Payment";

-- CreateIndex
CREATE UNIQUE INDEX "GroupPayment_txRef_key" ON "GroupPayment"("txRef");
