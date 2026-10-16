import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MailCheck } from 'lucide-react';
import AuthShell, { Field } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm: z.string(),
  role: z.enum(['CUSTOMER', 'ADMIN']).default('CUSTOMER'),
}).refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export default function Register() {
  const { user, register: signUp } = useAuth();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { role: 'CUSTOMER' } });

  useEffect(() => { if (user) navigate(user.role === 'ADMIN' ? '/admin' : '/', { replace: true }); }, [user, navigate]);

  const onSubmit = async ({ name, email, password, role }) => {
    try {
      const res = await signUp(name, email, password, role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER');
      if (res.needsConfirmation) setSent(true);
    } catch (e) {
      let errorMsg = e.message || 'Could not create account';
      if (errorMsg.includes('rate limit') || errorMsg.includes('exceeded')) {
        errorMsg = 'Email rate limit exceeded. Please wait a few minutes and try again, or use a different email.';
      }
      setError('root', { message: errorMsg });
    }
  };

  if (sent) {
    return (
      <AuthShell title="Check your inbox" subtitle="We sent a confirmation link to your email. Open it, then log in." footer={<Link to="/login" className="font-bold text-brand-600">Go to log in</Link>}>
        <div className="grid place-items-center text-brand-500"><MailCheck className="h-14 w-14" /></div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Shop in a minute. Pay on delivery."
      footer={<>Already have an account? <Link to="/login" className="font-bold text-brand-600">Log in</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.name?.message}>
          <input autoComplete="name" placeholder="Priya Sharma" className={`input ${errors.name ? 'input-error' : ''}`} {...register('name')} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" placeholder="you@example.com" className={`input ${errors.email ? 'input-error' : ''}`} {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input type="password" autoComplete="new-password" placeholder="At least 6 characters" className={`input ${errors.password ? 'input-error' : ''}`} {...register('password')} />
        </Field>
        <Field label="Confirm password" error={errors.confirm?.message}>
          <input type="password" autoComplete="new-password" placeholder="Type it again" className={`input ${errors.confirm ? 'input-error' : ''}`} {...register('confirm')} />
        </Field>
        <div className="mb-4">
          <span className="label">Register as</span>
          <div className="flex gap-3">
            <label className={`flex-1 cursor-pointer rounded-xl border-2 p-3 text-center transition-colors border-brand-100 hover:border-brand-200 ${watch('role') === 'CUSTOMER' ? 'border-brand-500 bg-brand-50' : ''}`}>
              <input type="radio" value="CUSTOMER" className="hidden" {...register('role')} />
              <span className="block font-semibold text-brand-700">User</span>
              <span className="text-xs text-ink/50">Shop products</span>
            </label>
            <label className={`flex-1 cursor-pointer rounded-xl border-2 p-3 text-center transition-colors border-brand-100 hover:border-brand-200 ${watch('role') === 'ADMIN' ? 'border-brand-500 bg-brand-50' : ''}`}>
              <input type="radio" value="ADMIN" className="hidden" {...register('role')} />
              <span className="block font-semibold text-brand-700">Admin</span>
              <span className="text-xs text-ink/50">Manage store</span>
            </label>
          </div>
        </div>
        {errors.root && <p className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600" role="alert">{errors.root.message}</p>}
        <button disabled={isSubmitting} className="btn-primary w-full !py-3.5">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </button>
      </form>
    </AuthShell>
  );
}
