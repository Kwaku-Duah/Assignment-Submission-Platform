import { NextFunction, Request, Response } from 'express';
import { assignmentInviteController } from '../controllers/assignmentInvite';
import db from '../dbConfig/db';
import { assignmentInviteEmail } from '../services/assignInvite';

jest.mock('../dbConfig/db', () => ({
  user: { findUnique: jest.fn() },
  assignment: { findUnique: jest.fn() },
  invitation: { create: jest.fn() }
}));

jest.mock('../services/assignInvite', () => ({
  assignmentInviteEmail: jest.fn()
}));

describe('assignmentInviteController', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {
        studentIds: ['student1', 'student2'],
        assignmentCode: 'assignment123'
      }
    } as Request;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    next = jest.fn() as NextFunction;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process invitations successfully', async () => {
    const user1 = { staffId: 'student1', email: 'student1@example.com' };
    const user2 = { staffId: 'student2', email: 'student2@example.com' };
    const assignment = { title: 'Assignment 1', deadline: new Date() };

    (db.user.findUnique as jest.Mock).mockImplementation(async ({ where }) => {
      if (where.staffId === 'student1') return user1;
      if (where.staffId === 'student2') return user2;
    });

    (db.assignment.findUnique as jest.Mock).mockResolvedValue(assignment);

    await assignmentInviteController(req, res, next);

    expect(assignmentInviteEmail).toHaveBeenCalledTimes(2);
    expect(assignmentInviteEmail).toHaveBeenCalledWith(
      user1,
      user1.email,
      assignment.title,
      expect.any(String),
      req.body.assignmentCode
    );
    expect(assignmentInviteEmail).toHaveBeenCalledWith(
      user2,
      user2.email,
      assignment.title,
      expect.any(String),
      req.body.assignmentCode
    );

    expect(db.invitation.create).toHaveBeenCalledTimes(2);
    expect(db.invitation.create).toHaveBeenCalledWith({
      data: {
        assignmentId: req.body.assignmentCode,
        students: { connect: { studentId: 'student1' } }
      }
    });
    expect(db.invitation.create).toHaveBeenCalledWith({
      data: {
        assignmentId: req.body.assignmentCode,
        students: { connect: { studentId: 'student2' } }
      }
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invitations processed',
      successfulEntries: [
        { studentId: 'student1', message: 'Invitation sent successfully' },
        { studentId: 'student2', message: 'Invitation sent successfully' }
      ],
      skippedEntries: []
    });

    expect(next).not.toHaveBeenCalled();
  });
});
