import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LayoutDashboard, LogOut, Package, Search, ShieldCheck, ShoppingCart, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useCart, useCategories } from '../lib/hooks';
import api from '../lib/api';
import { errMsg } from '../lib/format';

export default function Header() {
  const { user, isAdmin, logout, claimAdmin } = useAuth();
  const { cart } = useCart();
  const { data: categories } = useCategories();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const [term, setTerm] = useState(params.get('search') || '');
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const { data: adminExists } = useQuery({
    queryKey: ['admin-exists'],
    queryFn: () => api.get('/auth/admin-exists').then((r) => r.data.exists),
    enabled: !!user && !isAdmin,
  });

  const submit = (e) => {
    e.preventDefault();
    navigate(term.trim() ? `/products?search=${encodeURIComponent(term.trim())}` : '/products');
  };

  const count = cart?.count || 0;
  const activeCat = pathname === '/products' ? params.get('category') : null;

  const handleClaim = async () => {
    try { await claimAdmin(); toast.success('You are now the admin'); navigate('/admin'); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const menuItem = 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-brand-50';

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:gap-6 sm:px-6">
        <Logo />
        <form onSubmit={submit} className="relative hidden flex-1 md:block" role="search">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search for sarees, earphones, atta and more"
            className="input rounded-full bg-brand-50/60 py-3 pl-12"
            aria-label="Search products"
          />
        </form>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link to="/wishlist" className="btn-ghost !px-3" aria-label="Wishlist">
            <Heart className="h-5 w-5" /><span className="hidden lg:inline">Wishlist</span>
          </Link>

          <div className="relative">
            <button onClick={() => setOpen((o) => !o)} className="btn-ghost !px-3" aria-label="Account menu" aria-expanded={open}>
              <User className="h-5 w-5" />
              <span className="hidden max-w-[7rem] truncate lg:inline">{user ? user.name : 'Profile'}</span>
            </button>
            <AnimatePresence>
              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="card absolute right-0 z-50 mt-2 w-60 p-2"
                  >
                    {user ? (
                      <>
                        <div className="px-3 py-2">
                          <p className="truncate text-sm font-bold">{user.name}</p>
                          <p className="truncate text-xs text-ink/50">{user.email}</p>
                        </div>
                        {isAdmin && <Link to="/admin" className={menuItem}><LayoutDashboard className="h-4 w-4 text-brand-500" />Admin panel</Link>}
                        <Link to="/orders" className={menuItem}><Package className="h-4 w-4 text-brand-500" />My orders</Link>
                        <Link to="/wishlist" className={menuItem}><Heart className="h-4 w-4 text-brand-500" />Wishlist</Link>
                        {!isAdmin && adminExists === false && (
                          <button onClick={handleClaim} className={menuItem}><ShieldCheck className="h-4 w-4 text-brand-500" />Make me admin</button>
                        )}
                        <button onClick={() => { logout(); navigate('/'); }} className={menuItem}><LogOut className="h-4 w-4 text-brand-500" />Log out</button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" className={menuItem}>Log in</Link>
                        <Link to="/register" className={menuItem}>Create account</Link>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <Link to="/cart" className="btn-primary relative !px-4" aria-label={`Cart, ${count} items`}>
            <ShoppingCart className="h-5 w-5" /><span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 1.8 }}
                animate={{ scale: 1 }}
                className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] font-bold text-white"
              >
                {count}
              </motion.span>
            )}
          </Link>
        </nav>
      </div>

      <form onSubmit={submit} className="relative px-3 pb-3 md:hidden" role="search">
        <Search className="pointer-events-none absolute left-7 top-1/2 h-5 w-5 -translate-y-[70%] text-ink/40" />
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search products" className="input rounded-full bg-brand-50/60 pl-12" aria-label="Search products" />
      </form>

      <div className="border-t border-brand-50">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2 sm:px-6">
          {[{ name: 'All products', slug: null }, ...(categories || [])].map((c) => {
            const active = pathname === '/products' && (c.slug ? activeCat === c.slug : !activeCat);
            return (
              <Link
                key={c.slug || 'all'}
                to={c.slug ? `/products?category=${c.slug}` : '/products'}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${active ? 'bg-brand-500 text-white' : 'text-ink/70 hover:bg-brand-50'}`}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
