import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/errors.js';

const r = Router();
r.use(authenticate);

const orderInclude = { items: true, address: true };

const addressSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  address: z.string().trim().min(5).max(250),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
});

const placeSchema = z.object({
  address: addressSchema,
  paymentMethod: z.literal('COD').default('COD'),
  idempotencyKey: z.string().min(8).max(100).optional(),
});

const newOrderNumber = () =>
  `MS${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

async function findExisting(key, userId) {
  const existing = await prisma.order.findUnique({ where: { idempotencyKey: key }, include: orderInclude });
  if (existing && existing.userId !== userId) throw new HttpError(409, 'Idempotency key already used');
  return existing;
}

r.post('/', asyncHandler(async (req, res) => {
  const body = placeSchema.parse(req.body);
  const key = req.headers['idempotency-key'] || body.idempotencyKey;
  if (!key || String(key).length < 8) throw new HttpError(400, 'Idempotency-Key is required');
  const userId = req.user.id;

  // Same key again => return the order created the first time.
  const prior = await findExisting(String(key), userId);
  if (prior) return res.status(200).json({ order: prior, duplicate: true });

  try {
    const order = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } } } },
      });
      if (!cart || cart.items.length === 0) throw new HttpError(400, 'Your cart is empty');

      let total = 0;
      for (const item of cart.items) {
        if (!item.product.isActive) throw new HttpError(409, `"${item.product.name}" is no longer available`);
        // Atomic stock check + decrement: only succeeds if enough stock remains.
        const { count } = await tx.product.updateMany({
          where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (count === 0) throw new HttpError(409, `Not enough stock for "${item.product.name}"`);
        total += item.product.price * item.quantity; // price always from DB
      }

      const address = await tx.address.create({ data: { userId, ...body.address } });
      const created = await tx.order.create({
        data: {
          orderNumber: newOrderNumber(),
          idempotencyKey: String(key),
          userId,
          addressId: address.id,
          paymentMethod: 'COD',
          total,
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              name: i.product.name,
              image: i.product.images[0]?.url || null,
              price: i.product.price,
              quantity: i.quantity,
            })),
          },
        },
        include: orderInclude,
      });

      await tx.inventoryMovement.createMany({
        data: cart.items.map((i) => ({
          productId: i.productId, change: -i.quantity, reason: 'ORDER', orderId: created.id,
        })),
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });
    res.status(201).json({ order, duplicate: false });
  } catch (err) {
    // Two identical requests racing: the loser hits the unique constraint.
    if (err.code === 'P2002' && String(err.meta?.target).includes('idempotencyKey')) {
      const again = await findExisting(String(key), userId);
      if (again) return res.status(200).json({ order: again, duplicate: true });
    }
    throw err;
  }
}));

r.get('/', asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id }, include: orderInclude, orderBy: { createdAt: 'desc' },
  });
  res.json({ orders });
}));

r.get('/:id', asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: Number(req.params.id), userId: req.user.id }, include: orderInclude,
  });
  if (!order) throw new HttpError(404, 'Order not found');
  res.json({ order });
}));

export default r;
