import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Block } from '../../components/Skeletons';
import api from '../../lib/api';
import { fmtDate, inr } from '../../lib/format';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'users'], queryFn: () => api.get('/admin/users').then((r) => r.data.users) });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Users</h1>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-brand-50 text-ink/55">
            <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Orders</th><th className="p-4">Total purchased</th><th className="p-4">Last order</th></tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={5} className="p-3"><Block className="h-10" /></td></tr>) :
              data.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-ink/55">No users yet.</td></tr> :
              data.map((u) => (
                <tr key={u.id} onClick={() => navigate(`/admin/users/${u.id}`)} className="cursor-pointer border-b border-brand-50 last:border-0 hover:bg-brand-50/60">
                  <td className="p-4 font-bold">{u.name} {u.role === 'ADMIN' && <span className="ml-1 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] text-brand-700">Admin</span>}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">{u.totalOrders}</td>
                  <td className="p-4 font-bold">{inr(u.totalSpent)}</td>
                  <td className="p-4">{fmtDate(u.lastOrderAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
