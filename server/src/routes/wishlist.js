import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { productInclude } from './catalog.js';
import { HttpError, asyncHandler } from '../utils/errors.js';

const r = Router();
r.use(authenticate);

r.get('/', asyncHandler(async (req, res) => {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId: req.user.id, product: { isActive: true } },
    include: { product: { include: productInclude } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ products: rows.map((w) => w.product) });
}));

r.post('/:productId', asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new HttpError(404, 'Product not found');
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: req.user.id, productId } },
    update: {}, create: { userId: req.user.id, productId },
  });
  res.status(201).json({ ok: true });
}));

r.delete('/:productId', asyncHandler(async (req, res) => {
  await prisma.wishlistItem.deleteMany({
    where: { userId: req.user.id, productId: Number(req.params.productId) },
  });
  res.json({ ok: true });
}));

export default r;
