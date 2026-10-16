import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import OrderCard from '../../components/OrderCard';
import { Block } from '../../components/Skeletons';
import api from '../../lib/api';
import { errMsg } from '../../lib/format';

const NEXT = { PENDING: 'CONFIRMED', CONFIRMED: 'SHIPPED', SHIPPED: 'DELIVERED' };
const ACTION = { CONFIRMED: 'Confirm order', SHIPPED: 'Mark as shipped', DELIVERED: 'Mark as delivered' };
const TABS = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrders() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('ALL');
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'orders'], queryFn: () => api.get('/admin/orders').then((r) => r.data.orders) });

  const setStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => { toast.success('Order updated'); qc.invalidateQueries({ queryKey: ['admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const rows = (data || []).filter((o) => tab === 'ALL' || o.status === tab);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Orders</h1>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold ${tab === t ? 'bg-brand-500 text-white' : 'bg-white text-ink/70 hover:bg-brand-50'}`}>
            {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {isLoading ? <div className="space-y-4"><Block className="h-64" /><Block className="h-64" /></div> :
        rows.length === 0 ? <p className="card p-10 text-center text-ink/55">No orders here.</p> :
        <div className="space-y-4">
          {rows.map((o) => (
            <OrderCard key={o.id} order={o} customer={o.user} actions={
              NEXT[o.status] || ['PENDING', 'CONFIRMED'].includes(o.status) ? (
                <>
                  {NEXT[o.status] && <button disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: o.id, status: NEXT[o.status] })} className="btn-primary">{ACTION[NEXT[o.status]]}</button>}
                  {['PENDING', 'CONFIRMED'].includes(o.status) && (
                    <button disabled={setStatus.isPending} onClick={() => window.confirm('Cancel this order? Stock will be returned.') && setStatus.mutate({ id: o.id, status: 'CANCELLED' })} className="btn-ghost text-red-500">Cancel order</button>
                  )}
                </>
              ) : null
            } />
          ))}
        </div>}
    </div>
  );
}
