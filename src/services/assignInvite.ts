import { promises as fsPromises } from 'fs';
import handlebar from 'handlebars';

import { ADMIN_MAIL, FRONTEND_ORIGIN } from '../secrets';
import { transporter } from '../utils/mailer';

interface Student {
  firstName: string;
  lastName: string;
}

export const assignmentInviteEmail = async (
  student: Student,
  email: string,
  assignmentTitle: string,
  assignmentDeadline: string,
  assignmentCode: string
): Promise<void> => {
  const location = await fsPromises.readFile('src/templates/assignmentInvite.html', 'utf-8');
  const template = handlebar.compile(location);

  const placeHolders = {
    firstName: student.firstName,
    lastName: student.lastName,
    email: email,
    assignmentTitle: assignmentTitle,
    assignmentDeadline: assignmentDeadline,
    assignmentCode: assignmentCode,
    frontURL: FRONTEND_ORIGIN
  };

  const htmlMessage = template(placeHolders);

  await transporter.sendMail({
    from: ADMIN_MAIL,
    to: email,
    subject: 'Invitation to Assignment',
    text: 'Hello',
    html: htmlMessage
  });
};
