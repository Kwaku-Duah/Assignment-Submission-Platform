/*
  Warnings:

  - You are about to drop the column `invitationId` on the `Student` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_invitationId_fkey";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "invitationId";

-- CreateTable
CREATE TABLE "_InvitationToStudent" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_InvitationToStudent_AB_unique" ON "_InvitationToStudent"("A", "B");

-- CreateIndex
CREATE INDEX "_InvitationToStudent_B_index" ON "_InvitationToStudent"("B");

-- AddForeignKey
ALTER TABLE "_InvitationToStudent" ADD CONSTRAINT "_InvitationToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvitationToStudent" ADD CONSTRAINT "_InvitationToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
