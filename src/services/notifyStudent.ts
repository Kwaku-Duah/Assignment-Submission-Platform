import { transporter } from '../utils/mailer';
import { promises as fsPromises } from 'fs';
import handlebars from 'handlebars';
import { ADMIN_MAIL, FRONTEND_ORIGIN } from '../secrets';

interface SubmissionInfo {
  title?: string;
  assignmentCode: string | null;
  studentEmail: string;
  studentFirstName: string;
  studentLastName: string;
  studentId: string;
}

export const notifyStudent = async (
  studentEmail: string,
  submissionInfo: SubmissionInfo
): Promise<void> => {
  const location = await fsPromises.readFile('src/templates/studentAlert.html', 'utf-8');
  const template = handlebars.compile(location);

  const placeHolders = {
    submissionInfo,
    studentEmail: submissionInfo.studentEmail,
    studentId: submissionInfo.studentId,
    frontURL: FRONTEND_ORIGIN
  };

  const htmlMessage = template(placeHolders);

  await transporter.sendMail({
    from: ADMIN_MAIL,
    to: submissionInfo.studentEmail,
    subject: 'Submitted Assignment',
    text: 'Hello',
    html: htmlMessage
  });
};
