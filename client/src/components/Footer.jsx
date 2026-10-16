import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-ink/60">Low prices, free delivery, pay when it arrives.</p>
        </div>
        <nav className="flex gap-5 text-sm font-semibold text-ink/70">
          <Link to="/products" className="hover:text-brand-600">All products</Link>
          <Link to="/orders" className="hover:text-brand-600">My orders</Link>
          <Link to="/wishlist" className="hover:text-brand-600">Wishlist</Link>
        </nav>
      </div>
    </footer>
  );
}
