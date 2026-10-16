import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ClipboardList, IndianRupee, Package, Users } from 'lucide-react';
import { Block } from '../../components/Skeletons';
import api from '../../lib/api';
import { inr } from '../../lib/format';

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api.get('/admin/stats').then((r) => r.data) });

  const cards = data && [
    { label: 'Total products', value: data.totals.products, Icon: Package },
    { label: 'Total users', value: data.totals.users, Icon: Users },
    { label: 'Total orders', value: data.totals.orders, Icon: ClipboardList },
    { label: 'Revenue', value: inr(data.totals.revenue), Icon: IndianRupee },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Block key={i} className="h-28" />)
          : cards.map(({ label, value, Icon }, n) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n * 0.06 }} className="card flex items-center gap-4 p-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-600"><Icon className="h-6 w-6" /></span>
                <div><p className="text-sm text-ink/55">{label}</p><p className="text-2xl font-extrabold">{value}</p></div>
              </motion.div>
            ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-extrabold">Revenue, last 7 days</h2>
          {isLoading ? <Block className="h-64" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.daily}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43397" stopOpacity={0.4} /><stop offset="100%" stopColor="#f43397" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffe0ef" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} width={56} />
                <Tooltip formatter={(v) => inr(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#d91e80" strokeWidth={3} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-extrabold">Orders, last 7 days</h2>
          {isLoading ? <Block className="h-64" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffe0ef" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
                <Tooltip />
                <Bar dataKey="orders" fill="#f43397" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
    </div>
  );
}
