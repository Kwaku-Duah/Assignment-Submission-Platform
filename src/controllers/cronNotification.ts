import { CronJob } from 'cron';
import { notify } from '../services/notifyLecturer';
import db from '../dbConfig/db';
import { hourly } from '../../constants';

interface SubmissionInfo {
  title: string;
  assignmentCode: string | null;
  lecturerId: string;
  lecturerFirstName: string;
  lecturerLastName: string;
  lecturerEmail: string;
  studentFirstName: string;
  studentLastName: string;
  studentId: string;
}

const logMessage = (message: string) => {
  process.stdout.write(`${message}\n`);
};

const getLecturerInfo = async (
  lecturerId: string
): Promise<{ firstName: string; lastName: string; email: string }> => {
  const lecturer = await db.user.findUnique({
    where: {
      staffId: lecturerId
    },
    select: {
      firstName: true,
      lastName: true,
      email: true
    }
  });

  return lecturer || { firstName: '', lastName: '', email: '' };
};

export const sendJob = (): void => {
  const submissionsMap: Record<string, SubmissionInfo> = {};

  // sends email to lecturer every hour
  const job = new CronJob(hourly, async () => {
    try {
      const submissions = await db.submissions.findMany({
        where: {
          emailSent: false
        },
        include: {
          Assignment: {
            select: {
              title: true,
              assignmentCode: true,
              deadline: true,
              lecturerId: true
            }
          },
          Student: {
            select: {
              studentId: true
            }
          }
        }
      });

      for (const submission of submissions) {
        if (!submission.Assignment) {
          continue;
        }

        const { assignmentCode, title } = submission.Assignment;

        const studentUser = await db.user.findUnique({
          where: {
            staffId: submission.Student!.studentId
          },
          select: {
            staffId: true,
            firstName: true,
            lastName: true,
            email: true
          }
        });

        if (studentUser) {
          const { firstName, lastName, staffId } = studentUser;
          const submissionKey = `${assignmentCode}-${staffId}`;

          const lecturerInfo = await getLecturerInfo(submission.Assignment.lecturerId);

          if (lecturerInfo && !submissionsMap[submissionKey]) {
            const {
              firstName: lecturerFirstName,
              lastName: lecturerLastName,
              email: lecturerEmail
            } = lecturerInfo;

            const submissionInfo: SubmissionInfo = {
              title,
              assignmentCode,
              lecturerId: submission.Assignment.lecturerId,
              lecturerFirstName,
              lecturerLastName,
              lecturerEmail,
              studentFirstName: firstName || '',
              studentLastName: lastName || '',
              studentId: staffId || ''
            };

            submissionsMap[submissionKey] = submissionInfo;
          }
        }
      }

      for (const submissionKey in submissionsMap) {
        const submissionInfo = submissionsMap[submissionKey];

        // Check if any submission in the group has already been sent
        const anySubmissionSent = await db.submissions.findFirst({
          where: {
            emailSent: true,
            Assignment: {
              assignmentCode: submissionInfo.assignmentCode
            },
            Student: {
              studentId: submissionInfo.studentId
            }
          }
        });

        if (!anySubmissionSent) {
          // Send email notification only if no submission in the group has been sent
          await notify(submissionInfo.lecturerEmail, submissionInfo);

          // Update emailSent status for all submissions in the group
          await db.submissions.updateMany({
            where: {
              emailSent: false,
              Assignment: {
                assignmentCode: submissionInfo.assignmentCode
              },
              Student: {
                studentId: submissionInfo.studentId
              }
            },
            data: {
              emailSent: true
            }
          });
        }
      }
    } catch (errors: unknown) {
      logMessage('An error occured during cron operation');
    }
  });

  job.start();
};
