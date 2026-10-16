import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/errors.js';

const r = Router();
r.use(authenticate);

const itemInclude = {
  product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } },
};

// All money math happens here, never on the client.
async function buildCart(userId) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: itemInclude, orderBy: { id: 'asc' } } },
  });
  const items = (cart?.items || []).map((i) => ({
    id: i.id,
    productId: i.productId,
    name: i.product.name,
    image: i.product.images[0]?.url || null,
    price: i.product.price,
    mrp: i.product.mrp,
    stock: i.product.stock,
    isActive: i.product.isActive,
    quantity: i.quantity,
    subtotal: i.product.price * i.quantity,
  }));
  return {
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    total: items.reduce((n, i) => n + i.subtotal, 0),
  };
}

const getOrCreateCart = (userId) =>
  prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });

r.get('/', asyncHandler(async (req, res) => res.json(await buildCart(req.user.id))));

const addBody = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
});

r.post('/items', asyncHandler(async (req, res) => {
  const { productId, quantity } = addBody.parse(req.body);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new HttpError(404, 'Product not available');

  const cart = await getOrCreateCart(req.user.id);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  const nextQty = (existing?.quantity || 0) + quantity;
  if (nextQty > product.stock) {
    throw new HttpError(409, product.stock === 0 ? 'Out of stock' : `Only ${product.stock} left in stock`);
  }
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: nextQty },
    create: { cartId: cart.id, productId, quantity },
  });
  res.status(201).json(await buildCart(req.user.id));
}));

r.patch('/items/:itemId', asyncHandler(async (req, res) => {
  const { quantity } = z.object({ quantity: z.coerce.number().int().min(0).max(20) }).parse(req.body);
  const itemId = Number(req.params.itemId);
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId: req.user.id } },
    include: { product: true },
  });
  if (!item) throw new HttpError(404, 'Cart item not found');
  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    if (quantity > item.product.stock) throw new HttpError(409, `Only ${item.product.stock} left in stock`);
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }
  res.json(await buildCart(req.user.id));
}));

r.delete('/items/:itemId', asyncHandler(async (req, res) => {
  await prisma.cartItem.deleteMany({
    where: { id: Number(req.params.itemId), cart: { userId: req.user.id } },
  });
  res.json(await buildCart(req.user.id));
}));

r.delete('/', asyncHandler(async (req, res) => {
  await prisma.cartItem.deleteMany({ where: { cart: { userId: req.user.id } } });
  res.json(await buildCart(req.user.id));
}));

export default r;
