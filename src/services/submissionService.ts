import db from '../dbConfig/db';
import { alertStudent } from '../controllers/notifyStudent';

export const createSubmission = async (
  fileUrl: string,
  studentId: string,
  assignmentCode: string
) => {
  try {
    const submission = await db.submissions.create({
      data: {
        url: fileUrl,
        studentId,
        assignmentCode
      }
    });

    if (submission.id) {
      const submissionInfo = {
        Assignment: { assignmentCode },
        Student: { studentId }
      };

      await alertStudent(submissionInfo);

      return submission;
    } else {
      throw new Error('Submission creation failed');
    }
  } catch (error) {
    throw new Error('Error creating submission: ' + error);
  }
};
