import { ROLE } from '@prisma/client';
import db from '../dbConfig/db';

export const generateLecturerID = async (): Promise<string> => {
  const lastLecturer = await db.user.findFirst({
    where: { role: ROLE.LECTURER },
    orderBy: { staffId: 'asc' }
  });

  const lastUserId = lastLecturer ? parseInt(lastLecturer.staffId.split('-')[1]) : 0;
  const newLecturerId = `LEC-${String(lastUserId + 1).padStart(5, '0')}`;

  return newLecturerId;
};
