import { supabase } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';
import { HttpError, asyncHandler } from '../utils/errors.js';

// Verifies the Supabase access token and makes sure a Prisma User row exists.
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Missing auth token');

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Invalid or expired token');

  const su = data.user;
  let user = await prisma.user.findUnique({ where: { id: su.id } });
  if (!user) {
    const requestedRole = su.user_metadata?.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
    user = await prisma.user.create({
      data: {
        id: su.id,
        email: su.email,
        name: su.user_metadata?.name || su.email.split('@')[0],
        role: requestedRole,
      },
    });
  }
  req.user = user;
  next();
});

export const requireAdmin = (req, _res, next) =>
  req.user?.role === 'ADMIN' ? next() : next(new HttpError(403, 'Admin access only'));
