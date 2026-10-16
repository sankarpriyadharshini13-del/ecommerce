import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeletons';
import { useCategories } from '../lib/hooks';
import api from '../lib/api';

const ranges = [['Under ₹500', '', 500], ['₹500 – ₹1,000', 500, 1000], ['₹1,000 – ₹2,000', 1000, 2000], ['Above ₹2,000', 2000, '']];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const { data: categories } = useCategories();
  const [showFilters, setShowFilters] = useState(false);
  const [min, setMin] = useState(params.get('minPrice') || '');
  const [max, setMax] = useState(params.get('maxPrice') || '');

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'new';
  const page = Number(params.get('page') || 1);

  useEffect(() => { setMin(params.get('minPrice') || ''); setMax(params.get('maxPrice') || ''); }, [params]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', Object.fromEntries(params)],
    queryFn: () => api.get('/products', { params: { ...Object.fromEntries(params), limit: 20 } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };
  const applyPrice = (a = min, b = max) => update({ minPrice: a, maxPrice: b });
  const hasFilters = category || params.get('minPrice') || params.get('maxPrice');

  const filters = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-extrabold">Category</h3>
        <div className="space-y-1">
          {[{ slug: '', name: 'All' }, ...(categories || [])].map((c) => (
            <label key={c.slug} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-brand-50">
              <input type="radio" name="cat" checked={category === c.slug} onChange={() => update({ category: c.slug })} className="accent-brand-500" />
              {c.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-extrabold">Price</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {ranges.map(([label, a, b]) => (
            <button key={label} onClick={() => applyPrice(a, b)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${String(a) === (params.get('minPrice') || '') && String(b) === (params.get('maxPrice') || '') ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-brand-100 hover:bg-brand-50'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min" className="input !px-3 !py-2" aria-label="Minimum price" />
          <span className="text-ink/40">to</span>
          <input type="number" min="0" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max" className="input !px-3 !py-2" aria-label="Maximum price" />
        </div>
        <button onClick={() => applyPrice()} className="btn-outline mt-3 w-full !py-2">Apply price</button>
      </div>
      {hasFilters && <button onClick={() => setParams(search ? { search } : {})} className="btn-ghost w-full">Clear filters</button>}
    </div>
  );

  return (
    <div className="pt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold sm:text-2xl">{search ? `Results for “${search}”` : categories?.find((c) => c.slug === category)?.name || 'All products'}</h1>
          <p className="text-sm text-ink/55">{data ? `${data.total} products` : ' '}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters((s) => !s)} className="btn-outline !py-2 lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
          <select value={sort} onChange={(e) => update({ sort: e.target.value === 'new' ? '' : e.target.value })} className="input !w-auto !rounded-full !py-2" aria-label="Sort by">
            <option value="new">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-4 overflow-hidden lg:hidden">
            <div className="card p-4">{filters}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-6">
        <aside className="card sticky top-40 hidden h-fit w-64 shrink-0 p-5 lg:block">{filters}</aside>
        <div className={`min-w-0 flex-1 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : data?.products.length ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {data.pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button disabled={page <= 1} onClick={() => update({ page: page - 1 })} className="btn-outline !px-3" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="text-sm font-semibold">Page {data.page} of {data.pages}</span>
                  <button disabled={page >= data.pages} onClick={() => update({ page: page + 1 })} className="btn-outline !px-3" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
                </div>
              )}
            </>
          ) : (
            <div className="card grid place-items-center gap-3 p-14 text-center">
              <SearchX className="h-12 w-12 text-brand-400" />
              <p className="font-bold">No products match your search</p>
              <p className="text-sm text-ink/60">Try a different keyword or clear the filters.</p>
              <button onClick={() => setParams({})} className="btn-primary">Clear all</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
