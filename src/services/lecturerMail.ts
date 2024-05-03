import { promises as fsPromises } from 'fs';
import handlebar from 'handlebars';

import { ADMIN_MAIL, FRONTEND_ORIGIN } from '../secrets';
import { transporter } from '../utils/mailer';

export const lecturerEmailInvitation = async (
  lecturer: unknown,
  email: string,
  password: string
) => {
  const location = await fsPromises.readFile('src/templates/lecturerInvite.html', 'utf-8');
  const template = handlebar.compile(location);

  if (typeof lecturer !== 'object' || lecturer === null) {
    throw new Error('Invalid lecturer type');
  }

  const safeLecturer = lecturer as Record<string, unknown>;
  const placeHolders = {
    firstName: safeLecturer.firstName as string,
    lastName: safeLecturer.lastName as string,
    email: email,
    password: password,
    id: safeLecturer.staffId as string,
    frontURL: FRONTEND_ORIGIN
  };

  const htmlMessage = template(placeHolders);

  return transporter.sendMail({
    from: ADMIN_MAIL,
    to: email,
    subject: 'Claim Your Lecturer Account Now',
    text: 'Hello',
    html: htmlMessage
  });
};
