import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Banknote, Loader2, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Field } from '../components/AuthShell';
import { Block } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../lib/hooks';
import api from '../lib/api';
import { errMsg, inr } from '../lib/format';

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the receiver’s name'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  address: z.string().trim().min(5, 'Enter house number, street and area'),
  city: z.string().trim().min(2, 'Enter your city'),
  state: z.string().min(1, 'Select your state'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
});

export default function Checkout() {
  const { user } = useAuth();
  const { cart, isLoading } = useCart();
  const navigate = useNavigate();
  const qc = useQueryClient();
  // One key per checkout visit: retries/double-clicks can never create two orders.
  const idempotencyKey = useRef(crypto.randomUUID());
  const placed = useRef(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name || '', state: '' },
  });

  useEffect(() => {
    if (!isLoading && !placed.current && (!cart || cart.items.length === 0)) navigate('/cart', { replace: true });
  }, [isLoading, cart, navigate]);

  const place = useMutation({
    mutationFn: (address) =>
      api.post('/orders', { address, paymentMethod: 'COD' }, { headers: { 'Idempotency-Key': idempotencyKey.current } }).then((r) => r.data.order),
    onSuccess: (order) => {
      placed.current = true;
      qc.setQueryData(['cart'], { items: [], count: 0, total: 0 });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      navigate('/orders', { replace: true, state: { placed: order.orderNumber } });
    },
    onError: (e) => { toast.error(errMsg(e)); qc.invalidateQueries({ queryKey: ['cart'] }); },
  });

  if (isLoading || !cart) return <div className="grid gap-6 pt-6 lg:grid-cols-[1fr_22rem]"><Block className="h-96" /><Block className="h-64" /></div>;

  const input = (name) => `input ${errors[name] ? 'input-error' : ''}`;

  return (
    <div className="pt-6">
      <h1 className="mb-4 text-2xl font-extrabold">Checkout</h1>
      <form onSubmit={handleSubmit((v) => place.mutate(v))} noValidate className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-7">
            <h2 className="mb-4 font-extrabold">Delivery address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name?.message}><input autoComplete="name" className={input('name')} {...register('name')} /></Field>
              <Field label="Mobile number" error={errors.phone?.message}><input inputMode="numeric" maxLength={10} autoComplete="tel" placeholder="10-digit number" className={input('phone')} {...register('phone')} /></Field>
              <div className="sm:col-span-2">
                <Field label="Address" error={errors.address?.message}><input autoComplete="street-address" placeholder="House no., building, street, area" className={input('address')} {...register('address')} /></Field>
              </div>
              <Field label="City" error={errors.city?.message}><input autoComplete="address-level2" className={input('city')} {...register('city')} /></Field>
              <Field label="State" error={errors.state?.message}>
                <select className={input('state')} {...register('state')}>
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Pincode" error={errors.pincode?.message}><input inputMode="numeric" maxLength={6} autoComplete="postal-code" className={input('pincode')} {...register('pincode')} /></Field>
            </div>
          </section>

          <section className="card p-5 sm:p-7">
            <h2 className="mb-3 font-extrabold">Payment method</h2>
            <label className="flex items-center gap-3 rounded-2xl border-2 border-brand-500 bg-brand-50 p-4">
              <input type="radio" checked readOnly className="accent-brand-500" />
              <Banknote className="h-5 w-5 text-brand-600" />
              <span><b className="block text-sm">Cash on delivery</b><span className="text-xs text-ink/60">Pay when your order arrives</span></span>
            </label>
          </section>
        </div>

        <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-40">
          <h2 className="font-extrabold">Order summary</h2>
          <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {cart.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-50">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</div>
                <span className="min-w-0 flex-1 truncate">{i.name} <span className="text-ink/50">× {i.quantity}</span></span>
                <b>{inr(i.subtotal)}</b>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm"><span className="flex items-center gap-1"><Truck className="h-4 w-4" />Delivery</span><span className="font-bold text-green-600">Free</span></div>
          <div className="flex justify-between border-t border-dashed border-brand-200 pt-3 text-lg font-extrabold"><span>Total</span><span>{inr(cart.total)}</span></div>
          <button disabled={place.isPending} className="btn-primary w-full !py-3.5">
            {place.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Place order
          </button>
          <Link to="/cart" className="block text-center text-sm font-semibold text-brand-600">Back to cart</Link>
        </aside>
      </form>
    </div>
  );
}
