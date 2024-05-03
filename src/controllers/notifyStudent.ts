import db from '../dbConfig/db';
import { notifyStudent } from '../services/notifyStudent';

/**
 * Represents the information related to an assignment.
 */
interface Assignment {
  assignmentCode: string | null;
}
/**
 * Represents the information related to a student.
 */
interface Student {
  studentId: string;
}
/**
 * Represents a submission including assignment and student information.
 */
interface Submission {
  Assignment: Assignment;
  Student: Student;
}
/**
 * Represents detailed information about a submission.
 */
interface SubmissionInfo {
  assignmentCode: string | null;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
}

/**
 * Retrieves information about a student based on the provided student ID.
 *
 * @param {string} studentId - The ID of the student.
 * @returns {Promise<{ firstName: string; lastName: string; email: string }>} The information about the student.
 */

const getStudentInfo = async (
  studentId: string
): Promise<{ firstName: string; lastName: string; email: string }> => {
  const student = await db.user.findUnique({
    where: {
      staffId: studentId,
      role: 'STUDENT'
    },
    select: {
      firstName: true,
      lastName: true,
      email: true
    }
  });

  return student || { firstName: '', lastName: '', email: '' };
};

/**
 * Alerts the student by sending an email notification for a submission.
 *
 * @param {Submission} submission - The submission information including assignment and student details.
 * @returns {Promise<void>} A promise that resolves when the email notification is sent.
 * @throws {Error} If there's an error processing the submission.
 */

export const alertStudent = async (submission: Submission): Promise<void> => {
  try {
    const { Assignment, Student } = submission;

    if (!Assignment) {
      throw new Error('Submission is missing Assignment information.');
    }

    const { assignmentCode } = Assignment;

    if (!Student) {
      throw new Error('Submission is missing Student information.');
    }

    const { studentId } = Student;

    const studentInfo = await getStudentInfo(studentId);

    if (!studentInfo) {
      throw new Error(`Student with ID ${studentId} not found.`);
    }

    const {
      firstName: studentFirstName,
      lastName: studentLastName,
      email: studentEmail
    } = studentInfo;

    const submissionInfo: SubmissionInfo = {
      studentId,
      assignmentCode,
      studentFirstName,
      studentLastName,
      studentEmail
    };

    // Send email notification for every submission
    await notifyStudent(submissionInfo.studentEmail, submissionInfo);
    return;
  } catch (error) {
    throw new Error(`Error processing submission: ${error}`);
  }
};
