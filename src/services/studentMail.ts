import { promises as fsPromises } from 'fs';
import handlebars from 'handlebars';

import { ADMIN_MAIL, FRONTEND_ORIGIN } from '../secrets';
import { transporter } from '../utils/mailer';

export const studentEmailInvitation = async (student: unknown, email: string, password: string) => {
  const location = await fsPromises.readFile('src/templates/studentInvite.html', 'utf-8');
  const template = handlebars.compile(location);

  if (typeof student !== 'object' || student === null) {
    throw new Error('Invalid student type');
  }

  const safeStudent = student as Record<string, unknown>;
  const placeHolders = {
    firstName: safeStudent.firstName as string,
    lastName: safeStudent.lastName as string,
    email: email,
    password: password,
    id: safeStudent.staffId as string,
    frontURL: FRONTEND_ORIGIN
  };

  const htmlMessage = template(placeHolders);

  return transporter.sendMail({
    from: ADMIN_MAIL,
    to: email,
    subject: 'Claim Your Student Account Now',
    text: 'Hello',
    html: htmlMessage
  });
};
