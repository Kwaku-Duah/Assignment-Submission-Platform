import { ROLE } from '@prisma/client';
import db from '../dbConfig/db';

export const generateStudentID = async (): Promise<string> => {
  const lastStudent = await db.user.findFirst({
    where: { role: ROLE.STUDENT },
    orderBy: { staffId: 'desc' }
  });

  const lastUserId = lastStudent ? parseInt(lastStudent.staffId.split('-')[1]) : 0;
  const newStudentId = `STU-${String(lastUserId + 1).padStart(5, '0')}`;

  return newStudentId;
};
