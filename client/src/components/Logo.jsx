import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="Gulabi home">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-500 text-white shadow-lift">
        <ShoppingBag className="h-5 w-5" />
      </span>
      <span className="text-2xl font-extrabold tracking-tight text-brand-600">gulabi</span>
    </Link>
  );
}
