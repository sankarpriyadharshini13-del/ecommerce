import { motion } from 'framer-motion';
import Logo from './Logo';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-100 via-white to-brand-200 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
        className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-lift sm:p-10"
      >
        <Logo className="mb-6 justify-center" />
        <h1 className="text-center text-2xl font-extrabold">{title}</h1>
        <p className="mb-7 mt-1 text-center text-sm text-ink/60">{subtitle}</p>
        {children}
        <div className="mt-6 text-center text-sm text-ink/60">{footer}</div>
      </motion.div>
    </div>
  );
}

export const Field = ({ label, error, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="field-error" role="alert">{error}</p>}
  </div>
);
