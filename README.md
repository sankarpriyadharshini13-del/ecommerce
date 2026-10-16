# Gulabi: Meesho-style single-store e-commerce

React + Vite + Tailwind + Framer Motion + TanStack Query (client)
Express + Prisma + PostgreSQL + Supabase Auth/Storage (server)

## 1. Supabase setup
1. Create a project at supabase.com.
2. **Authentication > Providers > Email**: for local development turn **off** "Confirm email" so sign-up logs the user in immediately. (If left on, users must click the email link before logging in.)
3. **Storage**: create a bucket named `products` and make it **Public** (product images are served from it).
4. Copy the keys:
   - Project Settings > API: `Project URL`, `anon` key (client) and `service_role` key (server only, keep secret).
   - Project Settings > Database > Connection string: pooled (6543) and direct (5432) URLs.

## 2. Server
```bash
cd server
cp .env.example .env        # fill in the values
npm install                 # also runs prisma generate
npm run db:push             # creates all tables in your Supabase Postgres
npm run dev                 # http://localhost:5000
```
On start the server creates the three categories (Fashion, Electronics, Grocery) if missing.

## 3. Client
```bash
cd client
cp .env.example .env        # fill in the values
npm install
npm run dev                 # http://localhost:5173
```

## 4. Create the first admin
1. Open `/register` and create your account.
2. Click the user icon in the header, then **Make me admin**. This calls `POST /api/auth/make-first-admin`, which only works while no admin exists.
3. Log out and log in again: admins are redirected to `/admin`, customers to `/`.

Or with curl (use the access token of the logged-in user):
`curl -X POST http://localhost:5000/api/auth/make-first-admin -H "Authorization: Bearer <token>"`

## How it works
- **Auth**: Supabase issues the JWT. The client sends it as `Authorization: Bearer`. The `authenticate` middleware verifies it with Supabase and creates the Prisma `User` (role `CUSTOMER`) on first sight.
- **Pricing**: cart subtotals/totals and order totals are computed on the server from database prices. The client never sends a price.
- **Checkout** (`POST /api/orders`): one `$transaction` that checks and decrements stock atomically (`updateMany ... stock >= qty`), creates Address, Order, OrderItems and InventoryMovements, and clears the cart. The `Idempotency-Key` header makes repeated requests return the original order instead of creating another.
- **Admin cancel** returns stock and logs an InventoryMovement.
- **Order status** can only move PENDING > CONFIRMED > SHIPPED > DELIVERED (or be cancelled before shipping).
- **Product add**: images go to Supabase Storage, then Product + ProductImages + InventoryMovement are saved in one transaction. The product is visible to users as soon as `isActive` is true.

## Things to know
- Ratings are generated randomly when a product is created, and the reviews list on the product page is static sample text. There is no review model yet; replace both when you add real reviews.
- Hero banner copy lives in `client/src/components/Hero.jsx`.
- Prices are whole rupees (Int). `mrp` is an extra optional field used for the discount badge.
- Payment is COD only.

## API summary
Public: `GET /api/categories`, `GET /api/products`, `GET /api/products/:id`, `GET /api/auth/admin-exists`
Customer: `/api/auth/me`, `/api/cart`, `/api/wishlist`, `/api/orders`
Admin: `/api/admin/stats|products|users|orders`
