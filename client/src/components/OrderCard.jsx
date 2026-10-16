import { Check } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { fmtDate, inr } from '../lib/format';

const STEPS = [['PENDING', 'Placed'], ['CONFIRMED', 'Confirmed'], ['SHIPPED', 'Shipped'], ['DELIVERED', 'Delivered']];

export default function OrderCard({ order, actions, customer }) {
  const idx = STEPS.findIndex(([s]) => s === order.status);
  const a = order.address;
  return (
    <article className="card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-extrabold">Order {order.orderNumber}</p>
          <p className="text-sm text-ink/55">
            {fmtDate(order.createdAt)}{customer && ` · ${customer.name} (${customer.email})`}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status !== 'CANCELLED' && (
        <ol className="my-5 flex items-center" aria-label="Order progress">
          {STEPS.map(([s, text], n) => (
            <li key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-white ${n <= idx ? 'bg-brand-500' : 'bg-brand-100'}`}>
                  {n <= idx && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="text-[11px] font-semibold text-ink/60">{text}</span>
              </div>
              {n < STEPS.length - 1 && <span className={`mx-1 mb-4 h-0.5 flex-1 rounded ${n < idx ? 'bg-brand-500' : 'bg-brand-100'}`} />}
            </li>
          ))}
        </ol>
      )}

      <ul className="mt-4 divide-y divide-brand-50">
        {order.items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 py-3">
            <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-50">
              {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{it.name}</p>
              <p className="text-xs text-ink/55">Qty {it.quantity} × {inr(it.price)}</p>
            </div>
            <p className="text-sm font-bold">{inr(it.price * it.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3 border-t border-brand-50 pt-4">
        <div className="text-xs text-ink/60">
          <p className="font-semibold text-ink/80">Deliver to {a.name} · {a.phone}</p>
          <p>{a.address}, {a.city}, {a.state} {a.pincode}</p>
          <p>Cash on delivery</p>
        </div>
        <p className="text-lg font-extrabold">Total {inr(order.total)}</p>
      </div>
      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </article>
  );
}
