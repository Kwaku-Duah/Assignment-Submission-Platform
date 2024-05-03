import { transporter } from '../utils/mailer';
import { promises as fsPromises } from 'fs';
import handlebars from 'handlebars';
import { ADMIN_MAIL, FRONTEND_ORIGIN } from '../secrets';

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

export const notify = async (
  lecturerEmail: string,
  submissionInfo: SubmissionInfo
): Promise<void> => {
  const location = await fsPromises.readFile('src/templates/submittedLecturer.html', 'utf-8');
  const template = handlebars.compile(location);

  const placeHolders = {
    lecturerEmail,
    submissionInfo,
    studentId: submissionInfo.studentId,
    frontURL: FRONTEND_ORIGIN
  };

  const htmlMessage = template(placeHolders);

  await transporter.sendMail({
    from: ADMIN_MAIL,
    to: lecturerEmail,
    subject: 'Submitted Assignment',
    text: 'Hello',
    html: htmlMessage
  });
};
