/*
  Warnings:

  - A unique constraint covering the columns `[groupId,cycleNumber,roundNumber]` on the table `DrawResult` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[membershipId,cycleNumber,roundNumber]` on the table `GroupPayment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DrawResult_groupId_roundNumber_key";

-- DropIndex
DROP INDEX "GroupPayment_membershipId_roundNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "DrawResult_groupId_cycleNumber_roundNumber_key" ON "DrawResult"("groupId", "cycleNumber", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPayment_membershipId_cycleNumber_roundNumber_key" ON "GroupPayment"("membershipId", "cycleNumber", "roundNumber");
