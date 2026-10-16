import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, PackageOpen } from 'lucide-react';
import OrderCard from '../components/OrderCard';
import { Block } from '../components/Skeletons';
import api from '../lib/api';

export default function MyOrders() {
  const placed = useLocation().state?.placed;
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => api.get('/orders').then((r) => r.data.orders) });

  return (
    <div className="pt-6">
      {placed && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center gap-4 rounded-3xl bg-green-50 p-5">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15 }} className="grid h-12 w-12 place-items-center rounded-full bg-green-600 text-white"><Check className="h-6 w-6" /></motion.span>
          <div><p className="font-extrabold text-green-800">Order placed</p><p className="text-sm text-green-700">Your order {placed} is on its way. Pay in cash on delivery.</p></div>
        </motion.div>
      )}
      <h1 className="mb-4 text-2xl font-extrabold">My orders</h1>
      {isLoading ? (
        <div className="space-y-4"><Block className="h-64" /><Block className="h-64" /></div>
      ) : data?.length ? (
        <div className="space-y-4">{data.map((o) => <OrderCard key={o.id} order={o} />)}</div>
      ) : (
        <div className="card grid place-items-center gap-3 p-14 text-center">
          <PackageOpen className="h-12 w-12 text-brand-400" />
          <p className="font-bold">You have not placed any orders yet</p>
          <Link to="/products" className="btn-primary">Start shopping</Link>
        </div>
      )}
    </div>
  );
}
