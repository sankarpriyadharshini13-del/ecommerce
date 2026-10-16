import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload, uploadImages, deleteImages } from '../utils/upload.js';
import { productInclude } from './catalog.js';
import { HttpError, asyncHandler } from '../utils/errors.js';

const r = Router();
r.use(authenticate, requireAdmin);

/* ---------- Dashboard ---------- */
r.get('/stats', asyncHandler(async (_req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const [products, users, orders, revenue, recent, byStatus] = await Promise.all([
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
    prisma.order.findMany({ where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } }, select: { total: true, createdAt: true } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    days.push({ key: d.toDateString(), date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), revenue: 0, orders: 0 });
  }
  for (const o of recent) {
    const day = days.find((d) => d.key === o.createdAt.toDateString());
    if (day) { day.revenue += o.total; day.orders += 1; }
  }

  res.json({
    totals: { products, users, orders, revenue: revenue._sum.total || 0 },
    daily: days.map(({ key, ...rest }) => rest),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
  });
}));

/* ---------- Products ---------- */
const productSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().min(10).max(5000),
  price: z.coerce.number().int().min(1),
  mrp: z.coerce.number().int().min(1).optional(),
  stock: z.coerce.number().int().min(0),
  categoryId: z.coerce.number().int().positive(),
  brand: z.string().trim().max(80).optional().default(''),
  isActive: z.preprocess((v) => v === true || v === 'true' || v === 'on' || v === '1', z.boolean()),
});

r.get('/products', asyncHandler(async (_req, res) => {
  const products = await prisma.product.findMany({ include: productInclude, orderBy: { createdAt: 'desc' } });
  res.json({ products });
}));

r.get('/products/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) }, include: productInclude });
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ product });
}));

r.post('/products', upload.array('images', 8), asyncHandler(async (req, res) => {
  const data = productSchema.parse(req.body);
  if (!req.files?.length) throw new HttpError(400, 'Upload at least one product image');
  const mrp = Math.max(data.mrp ?? data.price, data.price);

  const uploaded = await uploadImages(req.files);
  try {
    const product = await prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new HttpError(400, 'Invalid category');
      const created = await tx.product.create({
        data: {
          name: data.name, description: data.description, price: data.price, mrp,
          stock: data.stock, brand: data.brand || null, isActive: data.isActive, categoryId: data.categoryId,
          rating: Math.round((3.8 + Math.random() * 1.0) * 10) / 10, // placeholder until real reviews exist
          ratingCount: 10 + Math.floor(Math.random() * 400),
          images: { create: uploaded.map((u, i) => ({ url: u.url, path: u.path, position: i })) },
        },
        include: productInclude,
      });
      if (data.stock > 0) {
        await tx.inventoryMovement.create({ data: { productId: created.id, change: data.stock, reason: 'INITIAL' } });
      }
      return created;
    });
    res.status(201).json({ product });
  } catch (err) {
    await deleteImages(uploaded.map((u) => u.path)).catch(() => {});
    throw err;
  }
}));

r.put('/products/:id', upload.array('images', 8), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const data = productSchema.parse(req.body);
  const removeIds = z.array(z.coerce.number().int()).catch([]).parse(
    [].concat(req.body.removeImageIds ?? [])
  );
  const mrp = Math.max(data.mrp ?? data.price, data.price);
  const uploaded = await uploadImages(req.files || []);
  let removedPaths = [];

  try {
    const product = await prisma.$transaction(async (tx) => {
      const current = await tx.product.findUnique({ where: { id }, include: { images: true } });
      if (!current) throw new HttpError(404, 'Product not found');

      const toRemove = current.images.filter((i) => removeIds.includes(i.id));
      const remaining = current.images.length - toRemove.length + uploaded.length;
      if (remaining < 1) throw new HttpError(400, 'A product needs at least one image');
      removedPaths = toRemove.map((i) => i.path);
      if (toRemove.length) await tx.productImage.deleteMany({ where: { id: { in: toRemove.map((i) => i.id) } } });
      if (uploaded.length) {
        const start = current.images.length;
        await tx.productImage.createMany({
          data: uploaded.map((u, i) => ({ productId: id, url: u.url, path: u.path, position: start + i })),
        });
      }
      if (data.stock !== current.stock) {
        await tx.inventoryMovement.create({
          data: { productId: id, change: data.stock - current.stock, reason: 'ADMIN_EDIT' },
        });
      }
      return tx.product.update({
        where: { id },
        data: {
          name: data.name, description: data.description, price: data.price, mrp,
          stock: data.stock, brand: data.brand || null, isActive: data.isActive, categoryId: data.categoryId,
        },
        include: productInclude,
      });
    });
    await deleteImages(removedPaths).catch(() => {});
    res.json({ product });
  } catch (err) {
    await deleteImages(uploaded.map((u) => u.path)).catch(() => {});
    throw err;
  }
}));

r.delete('/products/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!product) throw new HttpError(404, 'Product not found');
  // Order history keeps its snapshot (name, price, image); productId becomes null.
  await prisma.product.delete({ where: { id } });
  await deleteImages(product.images.map((i) => i.path)).catch(() => {});
  res.json({ ok: true });
}));

/* ---------- Users ---------- */
r.get('/users', asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { orders: { select: { total: true, createdAt: true, status: true } } },
  });
  res.json({
    users: users.map((u) => {
      const paid = u.orders.filter((o) => o.status !== 'CANCELLED');
      return {
        id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt,
        totalOrders: u.orders.length,
        totalSpent: paid.reduce((s, o) => s + o.total, 0),
        lastOrderAt: u.orders.length ? new Date(Math.max(...u.orders.map((o) => o.createdAt))) : null,
      };
    }),
  });
}));

r.get('/users/:id/orders', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, name: true, email: true } });
  if (!user) throw new HttpError(404, 'User not found');
  const orders = await prisma.order.findMany({
    where: { userId: user.id }, include: { items: true, address: true }, orderBy: { createdAt: 'desc' },
  });
  res.json({ user, orders });
}));

/* ---------- Orders ---------- */
r.get('/orders', asyncHandler(async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: true, address: true, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ orders });
}));

const NEXT = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

r.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const { status } = z.object({ status: z.enum(['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']) }).parse(req.body);
  const id = Number(req.params.id);

  const order = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!current) throw new HttpError(404, 'Order not found');
    if (!NEXT[current.status].includes(status)) {
      throw new HttpError(400, `Cannot move order from ${current.status} to ${status}`);
    }
    if (status === 'CANCELLED') {
      for (const item of current.items) {
        if (!item.productId) continue;
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        await tx.inventoryMovement.create({
          data: { productId: item.productId, change: item.quantity, reason: 'ORDER_CANCELLED', orderId: id },
        });
      }
    }
    return tx.order.update({
      where: { id }, data: { status },
      include: { items: true, address: true, user: { select: { name: true, email: true } } },
    });
  });
  res.json({ order });
}));

export default r;
