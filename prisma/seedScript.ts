import { hashSync } from 'bcrypt';
import { ROLE } from '@prisma/client';
import db from '../src/dbConfig/db';

const logMessage = (message: string) => {
  process.stdout.write(`${message}\n`);
};

const email = 'gloria@amalitech.org';

export async function seedScript() {
  // Check if the user with the given email already exists
  const existingUser = await db.user.findFirst({
    where: {
      email: 'gloria@amalitech.org'
    }
  });

  if (existingUser) {
    // If the user exists, delete it
    await db.user.delete({
      where: {
        email: 'gloria@amalitech.org'
      }
    });

    logMessage('Existing user deleted.');
  }

  // Create the user with the specified details
  const hashedPassword = hashSync('RashHalimahGloria', 10);
  const staffID = 'GROUP-2';

  await db.user.create({
    data: {
      firstName: 'Rashida',
      lastName: 'Halimah',
      email: email,
      staffId: staffID,
      password: hashedPassword,
      role: ROLE.ADMIN
    }
  });

  logMessage('User created successfully.');
}

seedScript();
