/*
  Warnings:

  - A unique constraint covering the columns `[groupId,roundNumber]` on the table `DrawResult` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DrawResult_groupId_roundNumber_key" ON "DrawResult"("groupId", "roundNumber");
