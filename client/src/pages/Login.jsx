import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import AuthShell, { Field } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CUSTOMER', 'ADMIN']).default('CUSTOMER'),
});

export default function Login() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { role: 'CUSTOMER' } });

  const go = (u) => navigate(u.role === 'ADMIN' ? '/admin' : from || '/', { replace: true });
  useEffect(() => { if (user) go(user); }, [user]); // eslint-disable-line

  const onSubmit = async ({ email, password, role }) => {
    try {
      const loggedInUser = await login(email, password);
      // Validate role matches the user's actual role
      if (role === 'ADMIN' && loggedInUser.role !== 'ADMIN') {
        await logout();
        throw new Error('You do not have admin privileges');
      }
      if (role === 'CUSTOMER' && loggedInUser.role === 'ADMIN') {
        // Allow admin to login as customer but warn them
        console.warn('Admin logging in as customer');
      }
      go(loggedInUser);
    }
    catch (e) { setError('root', { message: e.message || 'Could not log in' }); }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your cart and orders"
      footer={<>New here? <Link to="/register" className="font-bold text-brand-600">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" placeholder="you@example.com" className={`input ${errors.email ? 'input-error' : ''}`} {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input type="password" autoComplete="current-password" placeholder="Your password" className={`input ${errors.password ? 'input-error' : ''}`} {...register('password')} />
        </Field>
        <div className="mb-4">
          <span className="label">Login as</span>
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
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Log in
        </button>
      </form>
    </AuthShell>
  );
}
