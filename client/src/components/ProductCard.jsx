import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Heart, ShoppingCart, Star, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart, useWishlist } from '../lib/hooks';
import { discountPct, inr } from '../lib/format';

export function RatingPill({ rating, count }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
      {Number(rating).toFixed(1)} <Star className="h-3 w-3 fill-current" />
      {count != null && <span className="font-medium opacity-80">({count})</span>}
    </span>
  );
}

export default function ProductCard({ product: p }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { add } = useCart();
  const { ids, toggle } = useWishlist();
  const [added, setAdded] = useState(false);

  const liked = ids.has(p.id);
  const off = discountPct(p.mrp, p.price);
  const soldOut = p.stock <= 0;
  const goLogin = () => navigate('/login', { state: { from: location.pathname + location.search } });

  const onAdd = () => {
    if (!user) return goLogin();
    add.mutate({ productId: p.id }, {
      onSuccess: () => { setAdded(true); toast.success('Added to cart'); setTimeout(() => setAdded(false), 1400); },
    });
  };
  const onHeart = () => (user ? toggle.mutate({ productId: p.id, liked }) : goLogin());

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="card group relative flex flex-col overflow-hidden hover:shadow-lift"
    >
      <button
        onClick={onHeart}
        aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
        className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow"
      >
        <motion.span key={String(liked)} initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
          <Heart className={`h-5 w-5 ${liked ? 'fill-brand-500 text-brand-500' : 'text-ink/50'}`} />
        </motion.span>
      </button>

      <Link to={`/product/${p.id}`} className="block overflow-hidden bg-brand-50">
        <div className="relative aspect-[3/4]">
          {p.images?.[0] ? (
            <img src={p.images[0].url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-ink/40">No image</div>
          )}
          {soldOut && (
            <div className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-bold">Out of stock</div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link to={`/product/${p.id}`} className="truncate text-sm text-ink/80" title={p.name}>{p.name}</Link>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-extrabold">{inr(p.price)}</span>
          {off > 0 && (
            <>
              <span className="text-sm text-ink/40 line-through">{inr(p.mrp)}</span>
              <span className="text-sm font-bold text-green-600">{off}% off</span>
            </>
          )}
        </div>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
          <Truck className="h-3.5 w-3.5" /> Free Delivery
        </span>
        <div className="mt-0.5"><RatingPill rating={p.rating} count={p.ratingCount} /></div>

        <button onClick={onAdd} disabled={soldOut || add.isPending} className="btn-primary mt-auto !py-2.5">
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.span key="ok" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <Check className="h-4 w-4" /> Added
              </motion.span>
            ) : (
              <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Add to cart
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.article>
  );
}
