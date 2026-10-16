import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import OrderCard from '../../components/OrderCard';
import { Block } from '../../components/Skeletons';
import api from '../../lib/api';

export default function AdminUserOrders() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'user-orders', id], queryFn: () => api.get(`/admin/users/${id}/orders`).then((r) => r.data) });

  return (
    <div className="space-y-5">
      <Link to="/admin/users" className="inline-flex items-center gap-1 text-sm font-bold text-brand-600"><ArrowLeft className="h-4 w-4" /> Users</Link>
      {isLoading ? <Block className="h-64" /> : (
        <>
          <div><h1 className="text-2xl font-extrabold">{data.user.name}</h1><p className="text-sm text-ink/55">{data.user.email}</p></div>
          {data.orders.length === 0 ? <p className="card p-10 text-center text-ink/55">This user has not placed any orders.</p> :
            <div className="space-y-4">{data.orders.map((o) => <OrderCard key={o.id} order={o} />)}</div>}
        </>
      )}
    </div>
  );
}
