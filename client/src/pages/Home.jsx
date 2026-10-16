import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Banknote, Shirt, ShoppingBasket, Smartphone, Tag, Truck } from 'lucide-react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeletons';
import { useCategories } from '../lib/hooks';
import api from '../lib/api';

const icons = { fashion: Shirt, electronics: Smartphone, grocery: ShoppingBasket };
const perks = [
  { Icon: Truck, text: 'Free delivery on every order' },
  { Icon: Banknote, text: 'Cash on delivery available' },
  { Icon: Tag, text: 'Everyday low prices' },
];

export default function Home() {
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'home'],
    queryFn: () => api.get('/products', { params: { limit: 20 } }).then((r) => r.data),
  });

  return (
    <>
      <Hero />

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {perks.map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-card">
            <Icon className="h-5 w-5 text-brand-500" /> {text}
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-extrabold sm:text-2xl">Shop by category</h2>
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {catLoading
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-brand-100/70" />)
            : categories?.map((c) => {
                const Icon = icons[c.slug] || Tag;
                return (
                  <motion.div key={c.id} whileHover={{ y: -6 }} whileTap={{ scale: 0.97 }}>
                    <Link to={`/products?category=${c.slug}`} className="card flex flex-col items-center gap-3 p-4 text-center hover:shadow-lift sm:p-7">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-600 sm:h-16 sm:w-16">
                        <Icon className="h-7 w-7" />
                      </span>
                      <span className="text-sm font-bold sm:text-base">{c.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-extrabold sm:text-2xl">Products for you</h2>
          <Link to="/products" className="flex items-center gap-1 text-sm font-bold text-brand-600">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : data?.products.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="card p-10 text-center text-ink/60">No products yet. Check back soon.</p>
        )}
      </section>
    </>
  );
}
