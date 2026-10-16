import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { HttpError, asyncHandler } from '../utils/errors.js';

const r = Router();

export const productInclude = {
  images: { orderBy: { position: 'asc' } },
  category: { select: { id: true, name: true, slug: true } },
};

r.get('/categories', asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
  res.json({ categories });
}));

const listQuery = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(), // slug
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['new', 'price_asc', 'price_desc', 'rating']).default('new'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(20),
});

r.get('/products', asyncHandler(async (req, res) => {
  const q = listQuery.parse(req.query);
  const hasPrice = q.minPrice !== undefined || q.maxPrice !== undefined;
  const where = {
    isActive: true,
    ...(q.category && { category: { slug: q.category } }),
    ...(hasPrice && {
      price: {
        ...(q.minPrice !== undefined && { gte: q.minPrice }),
        ...(q.maxPrice !== undefined && { lte: q.maxPrice }),
      },
    }),
    ...(q.search && {
      OR: [
        { name: { contains: q.search, mode: 'insensitive' } },
        { brand: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
      ],
    }),
  };
  const orderBy = {
    new: { createdAt: 'desc' },
    price_asc: { price: 'asc' },
    price_desc: { price: 'desc' },
    rating: { rating: 'desc' },
  }[q.sort];

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where, orderBy, include: productInclude,
      skip: (q.page - 1) * q.limit, take: q.limit,
    }),
  ]);
  res.json({ products, total, page: q.page, pages: Math.ceil(total / q.limit) });
}));

r.get('/products/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid product id');
  const product = await prisma.product.findFirst({
    where: { id, isActive: true }, include: productInclude,
  });
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ product });
}));

export default r;
