import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Minus, Plus, ShoppingCart, Trash2, Truck } from 'lucide-react';
import { useCart } from '../lib/hooks';
import { Block } from '../components/Skeletons';
import { discountPct, inr } from '../lib/format';

function EmptyCart() {
  return (
    <div className="card mt-8 grid place-items-center gap-4 px-6 py-16 text-center">
      <div className="relative h-28 w-28">
        {[0, 1, 2].map((n) => (
          <motion.span key={n} className="absolute h-3 w-3 rounded-full bg-brand-300"
            style={{ left: 10 + n * 40, top: 6 }} animate={{ y: [0, -14, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.6, delay: n * 0.25 }} />
        ))}
        <motion.div className="absolute inset-x-0 bottom-0 grid h-20 place-items-center rounded-full bg-brand-100 text-brand-500"
          animate={{ rotate: [-6, 6, -6] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}>
          <ShoppingCart className="h-10 w-10" />
        </motion.div>
      </div>
      <h1 className="text-xl font-extrabold">Your cart is empty</h1>
      <p className="max-w-xs text-sm text-ink/60">Add products you like and they will show up here.</p>
      <Link to="/products" className="btn-primary">Start shopping</Link>
    </div>
  );
}

export default function Cart() {
  const { cart, isLoading, update, remove } = useCart();
  const navigate = useNavigate();

  if (isLoading) return <div className="space-y-3 pt-6"><Block className="h-28" /><Block className="h-28" /><Block className="h-28" /></div>;
  if (!cart || cart.items.length === 0) return <EmptyCart />;

  const blocked = cart.items.some((i) => !i.isActive || i.quantity > i.stock);

  return (
    <div className="pt-6">
      <h1 className="mb-4 text-2xl font-extrabold">My cart <span className="text-base font-semibold text-ink/50">({cart.count} items)</span></h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {cart.items.map((i) => {
              const off = discountPct(i.mrp, i.price);
              const problem = !i.isActive ? 'No longer available' : i.quantity > i.stock ? `Only ${i.stock} left in stock` : null;
              return (
                <motion.li key={i.id} layout exit={{ opacity: 0, x: -60 }} className="card flex gap-4 p-3 sm:p-4">
                  <Link to={`/product/${i.productId}`} className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-brand-50">
                    {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link to={`/product/${i.productId}`} className="truncate font-semibold">{i.name}</Link>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2">
                      <span className="font-extrabold">{inr(i.price)}</span>
                      {off > 0 && <><span className="text-sm text-ink/40 line-through">{inr(i.mrp)}</span><span className="text-sm font-bold text-green-600">{off}% off</span></>}
                    </div>
                    {problem && <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500"><AlertTriangle className="h-3.5 w-3.5" />{problem}</p>}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex items-center rounded-full border border-brand-200">
                        <button onClick={() => update.mutate({ itemId: i.id, quantity: i.quantity - 1 })} disabled={update.isPending}
                          className="grid h-9 w-9 place-items-center rounded-full hover:bg-brand-50" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                        <span className="w-7 text-center font-bold">{i.quantity}</span>
                        <button onClick={() => update.mutate({ itemId: i.id, quantity: i.quantity + 1 })} disabled={update.isPending || i.quantity >= i.stock}
                          className="grid h-9 w-9 place-items-center rounded-full hover:bg-brand-50 disabled:opacity-40" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-ink/60">Subtotal <b className="text-ink">{inr(i.subtotal)}</b></span>
                        <button onClick={() => remove.mutate(i.id)} className="grid h-9 w-9 place-items-center rounded-full text-red-500 hover:bg-red-50" aria-label={`Remove ${i.name}`}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-40">
          <h2 className="font-extrabold">Price details</h2>
          <div className="flex justify-between text-sm"><span>Items ({cart.count})</span><span>{inr(cart.total)}</span></div>
          <div className="flex justify-between text-sm"><span className="flex items-center gap-1"><Truck className="h-4 w-4" />Delivery</span><span className="font-bold text-green-600">Free</span></div>
          <div className="flex justify-between border-t border-dashed border-brand-200 pt-3 text-lg font-extrabold"><span>Order total</span><span>{inr(cart.total)}</span></div>
          <button disabled={blocked} onClick={() => navigate('/checkout')} className="btn-primary w-full !py-3.5">Continue to checkout</button>
          {blocked && <p className="text-xs font-medium text-red-500">Fix the items marked above to continue.</p>}
        </aside>
      </div>
    </div>
  );
}
