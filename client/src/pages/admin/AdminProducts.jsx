import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, PlusSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Block } from '../../components/Skeletons';
import api from '../../lib/api';
import { errMsg, inr } from '../../lib/format';

export function StockBadge({ stock }) {
  const [text, cls] = stock <= 0 ? ['Out of stock', 'bg-red-100 text-red-700'] : stock <= 5 ? [`Low: ${stock} left`, 'bg-amber-100 text-amber-800'] : [`In stock: ${stock}`, 'bg-green-100 text-green-800'];
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{text}</span>;
}

export default function AdminProducts() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'products'], queryFn: () => api.get('/admin/products').then((r) => r.data.products) });
  const del = useMutation({
    mutationFn: (id) => api.delete(`/admin/products/${id}`),
    onSuccess: () => { toast.success('Product deleted'); qc.invalidateQueries({ queryKey: ['admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const rows = (data || []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Products</h1>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="input !w-48 !rounded-full !py-2.5" aria-label="Search products" />
          <Link to="/admin/products/new" className="btn-primary"><PlusSquare className="h-4 w-4" /> Add product</Link>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-brand-50 text-ink/55">
            <tr><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={6} className="p-3"><Block className="h-14" /></td></tr>) :
              rows.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-ink/55">No products found.</td></tr> :
              rows.map((p) => (
                <tr key={p.id} className="border-b border-brand-50 last:border-0">
                  <td className="p-4"><div className="flex items-center gap-3">
                    <div className="h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-brand-50">{p.images[0] && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}</div>
                    <div className="min-w-0"><p className="max-w-[16rem] truncate font-bold">{p.name}</p>{p.brand && <p className="text-xs text-ink/50">{p.brand}</p>}</div>
                  </div></td>
                  <td className="p-4">{p.category.name}</td>
                  <td className="p-4 font-bold">{inr(p.price)}</td>
                  <td className="p-4"><StockBadge stock={p.stock} /></td>
                  <td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${p.isActive ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>{p.isActive ? 'Visible' : 'Hidden'}</span></td>
                  <td className="p-4"><div className="flex justify-end gap-1">
                    <Link to={`/admin/products/${p.id}/edit`} className="btn-ghost !px-3" aria-label={`Edit ${p.name}`}><Pencil className="h-4 w-4" /></Link>
                    <button onClick={() => window.confirm(`Delete “${p.name}”? This cannot be undone.`) && del.mutate(p.id)} className="btn-ghost !px-3 text-red-500" aria-label={`Delete ${p.name}`}><Trash2 className="h-4 w-4" /></button>
                  </div></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
