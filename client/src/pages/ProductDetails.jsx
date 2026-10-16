import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Banknote, Check, Minus, Plus, ShoppingCart, Star, Truck, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../lib/hooks';
import { RatingPill } from '../components/ProductCard';
import { Block } from '../components/Skeletons';
import api from '../lib/api';
import { discountPct, inr } from '../lib/format';

// Placeholder reviews so the UI is complete. Replace with a real reviews API later.
const SAMPLE_REVIEWS = [
  { name: 'Anita R.', stars: 5, text: 'Quality is great for the price. Arrived quickly.' },
  { name: 'Mohit S.', stars: 4, text: 'Matches the photos. Packaging could be better.' },
  { name: 'Deepa K.', stars: 5, text: 'Value for money. Would order again.' },
];

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { add } = useCart();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: p, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data.product),
  });

  if (isLoading) {
    return (
      <div className="grid gap-8 pt-6 md:grid-cols-2">
        <Block className="aspect-square" />
        <div className="space-y-4"><Block className="h-8 w-3/4" /><Block className="h-6 w-1/3" /><Block className="h-12" /><Block className="h-40" /></div>
      </div>
    );
  }
  if (isError || !p) {
    return <div className="card mt-8 p-14 text-center"><p className="font-bold">This product is not available.</p><Link to="/products" className="btn-primary mt-4">Browse products</Link></div>;
  }

  const off = discountPct(p.mrp, p.price);
  const maxQty = Math.min(p.stock, 10);
  const soldOut = p.stock <= 0;
  const requireLogin = () => navigate('/login', { state: { from: location.pathname } });

  const addToCart = (after) => {
    if (!user) return requireLogin();
    add.mutate({ productId: p.id, quantity: qty }, {
      onSuccess: () => {
        if (after) return after();
        setAdded(true); toast.success('Added to cart'); setTimeout(() => setAdded(false), 1500);
      },
    });
  };

  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, pct: Math.max(4, Math.round(100 * Math.exp(-Math.abs(s - p.rating) * 1.1))) }));

  return (
    <div className="pt-6">
      <nav className="mb-4 text-sm text-ink/55"><Link to="/" className="hover:text-brand-600">Home</Link> / <Link to={`/products?category=${p.category.slug}`} className="hover:text-brand-600">{p.category.name}</Link></nav>
      <div className="grid gap-8 md:grid-cols-2">
        {/* Gallery (left) */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
            {p.images.map((img, n) => (
              <button key={img.id} onClick={() => setActive(n)} aria-label={`Show image ${n + 1}`}
                className={`h-16 w-14 shrink-0 overflow-hidden rounded-xl border-2 sm:h-20 sm:w-16 ${n === active ? 'border-brand-500' : 'border-transparent'}`}>
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <div className="card relative aspect-[4/5] flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img key={active} src={p.images[active]?.url} alt={p.name}
                initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                className="absolute inset-0 h-full w-full object-cover" />
            </AnimatePresence>
          </div>
        </div>

        {/* Details (right) */}
        <div className="card space-y-5 p-5 sm:p-8">
          <div>
            {p.brand && <p className="text-sm font-bold text-brand-600">{p.brand}</p>}
            <h1 className="text-2xl font-extrabold leading-tight">{p.name}</h1>
            <div className="mt-2"><RatingPill rating={p.rating} count={p.ratingCount} /></div>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold">{inr(p.price)}</span>
              {off > 0 && <><span className="text-lg text-ink/40 line-through">{inr(p.mrp)}</span><span className="font-bold text-green-600">{off}% off</span></>}
            </div>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700"><Truck className="h-3.5 w-3.5" /> Free Delivery</span>
          </div>

          <p className={`text-sm font-bold ${soldOut ? 'text-red-500' : p.stock <= 5 ? 'text-amber-600' : 'text-green-600'}`}>
            {soldOut ? 'Out of stock' : p.stock <= 5 ? `Only ${p.stock} left` : 'In stock'}
          </p>

          {!soldOut && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold">Quantity</span>
              <div className="flex items-center rounded-full border border-brand-200">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center rounded-full hover:bg-brand-50" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center font-bold" aria-live="polite">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} className="grid h-10 w-10 place-items-center rounded-full hover:bg-brand-50 disabled:opacity-40" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => addToCart()} disabled={soldOut || add.isPending} className="btn-outline !py-3.5">
              <AnimatePresence mode="wait" initial={false}>
                {added ? (
                  <motion.span key="ok" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Check className="h-5 w-5" /> Added</motion.span>
                ) : (
                  <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Add to cart</motion.span>
                )}
              </AnimatePresence>
            </button>
            <button onClick={() => addToCart(() => navigate('/checkout'))} disabled={soldOut || add.isPending} className="btn-primary !py-3.5"><Zap className="h-5 w-5" /> Buy now</button>
          </div>
          <p className="flex items-center gap-2 text-xs text-ink/60"><Banknote className="h-4 w-4" /> Cash on delivery available</p>
        </div>
      </div>

      <section className="card mt-8 p-5 sm:p-8">
        <h2 className="mb-3 text-lg font-extrabold">Product details</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">{p.description}</p>
        <dl className="mt-4 grid max-w-md grid-cols-2 gap-y-2 text-sm">
          <dt className="text-ink/55">Category</dt><dd className="font-semibold">{p.category.name}</dd>
          {p.brand && <><dt className="text-ink/55">Brand</dt><dd className="font-semibold">{p.brand}</dd></>}
        </dl>
      </section>

      <section className="card mt-6 p-5 sm:p-8">
        <h2 className="mb-4 text-lg font-extrabold">Ratings and reviews</h2>
        <div className="grid gap-6 sm:grid-cols-[12rem_1fr]">
          <div className="text-center sm:text-left">
            <p className="text-5xl font-extrabold">{Number(p.rating).toFixed(1)}</p>
            <div className="mt-1 flex justify-center gap-0.5 text-amber-400 sm:justify-start">
              {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= Math.round(p.rating) ? 'fill-current' : ''}`} />)}
            </div>
            <p className="mt-1 text-xs text-ink/55">{p.ratingCount} ratings</p>
          </div>
          <div className="space-y-1.5">
            {dist.map(({ s, pct }) => (
              <div key={s} className="flex items-center gap-2 text-xs font-semibold">
                <span className="w-3">{s}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-100"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full bg-brand-500" /></div>
              </div>
            ))}
          </div>
        </div>
        <ul className="mt-6 divide-y divide-brand-50">
          {SAMPLE_REVIEWS.map((r) => (
            <li key={r.name} className="py-4">
              <div className="flex items-center gap-2"><RatingPill rating={r.stars} /><span className="text-sm font-bold">{r.name}</span></div>
              <p className="mt-1 text-sm text-ink/75">{r.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
