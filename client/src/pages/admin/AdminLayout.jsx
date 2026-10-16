import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, LogOut, Package, PlusSquare, Store, Users } from 'lucide-react';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', Icon: Package, end: true },
  { to: '/admin/products/new', label: 'Add product', Icon: PlusSquare },
  { to: '/admin/users', label: 'Users', Icon: Users },
  { to: '/admin/orders', label: 'Orders', Icon: ClipboardList },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-bold transition ${isActive ? 'bg-brand-500 text-white shadow-lift' : 'text-ink/70 hover:bg-brand-50'}`;

  return (
    <div className="min-h-screen bg-[#fff7fb] lg:flex">
      <aside className="border-brand-100 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-6 lg:py-6">
          <Logo />
          <button onClick={() => { logout(); navigate('/login'); }} className="btn-ghost !px-3 lg:hidden" aria-label="Log out"><LogOut className="h-5 w-5" /></button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4">
          {links.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}><Icon className="h-5 w-5" />{label}</NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-brand-50 p-4 lg:absolute lg:bottom-0 lg:block lg:w-full">
          <NavLink to="/" className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-ink/70 hover:bg-brand-50"><Store className="h-5 w-5" />View store</NavLink>
          <button onClick={() => { logout(); navigate('/login'); }} className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-ink/70 hover:bg-brand-50"><LogOut className="h-5 w-5" />Log out</button>
          <p className="mt-2 truncate px-4 text-xs text-ink/45">{user?.email}</p>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8"><Outlet /></main>
    </div>
  );
}
