-- CreateTable
CREATE TABLE "Submissions" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "studentId" TEXT,
    "assignmentCode" TEXT NOT NULL,

    CONSTRAINT "Submissions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Submissions" ADD CONSTRAINT "Submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submissions" ADD CONSTRAINT "Submissions_assignmentCode_fkey" FOREIGN KEY ("assignmentCode") REFERENCES "Assignment"("assignmentCode") ON DELETE RESTRICT ON UPDATE CASCADE;
