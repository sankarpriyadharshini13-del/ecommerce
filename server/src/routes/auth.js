import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/errors.js';

const r = Router();

// Current user (creates the Prisma user on first call via the middleware)
r.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

// Public: lets the UI know whether the "claim admin" button should be offered
r.get('/admin-exists', asyncHandler(async (_req, res) => {
  const count = await prisma.user.count({ where: { role: 'ADMIN' } });
  res.json({ exists: count > 0 });
}));

// Makes the calling user ADMIN, but only while no admin exists yet.
r.post('/make-first-admin', authenticate, asyncHandler(async (req, res) => {
  const updated = await prisma.$transaction(async (tx) => {
    const admins = await tx.user.count({ where: { role: 'ADMIN' } });
    if (admins > 0) throw new HttpError(403, 'An admin already exists');
    return tx.user.update({ where: { id: req.user.id }, data: { role: 'ADMIN' } });
  });
  res.json({ user: updated });
}));

export default r;
