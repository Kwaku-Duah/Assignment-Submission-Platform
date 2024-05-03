import { transporter } from '../utils/mailer';
import { promises as fsPromises } from 'fs';
import handlebar from 'handlebars';
import { ADMIN_MAIL } from '../secrets';

export const sendPasswordResetEmail = async (user: unknown, email: string, link: string) => {
  const location = await fsPromises.readFile('src/templates/forgotEmail.html', 'utf-8');
  const template = handlebar.compile(location);

  const placeHolders = {
    frontendURL: link
  };
  const htmlMessage = template(placeHolders);
  return transporter.sendMail({
    from: ADMIN_MAIL,
    to: email,
    subject: 'Reset Passport',
    text: 'Hello Reset...',
    html: htmlMessage
  });
};
