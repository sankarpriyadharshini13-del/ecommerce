import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Banknote, Shirt, ShoppingBasket, Smartphone } from 'lucide-react';

// Edit this copy to match your real offers.
const slides = [
  { title: 'Lowest prices.\nFree delivery.', text: 'Shop thousands of products and pay on delivery.', cta: 'Start shopping', to: '/products', Icon: Banknote, bg: 'from-brand-500 via-brand-600 to-brand-800' },
  { title: 'Fashion for\nevery budget', text: 'New styles added every day, delivered free.', cta: 'Shop fashion', to: '/products?category=fashion', Icon: Shirt, bg: 'from-fuchsia-500 via-brand-500 to-rose-500' },
  { title: 'Gadgets and\nelectronics', text: 'Earphones, chargers, smart accessories and more.', cta: 'Shop electronics', to: '/products?category=electronics', Icon: Smartphone, bg: 'from-brand-700 via-brand-600 to-pink-400' },
  { title: 'Kitchen staples,\ndoor to door', text: 'Stock up on grocery essentials, free delivery.', cta: 'Shop grocery', to: '/products?category=grocery', Icon: ShoppingBasket, bg: 'from-rose-500 via-brand-500 to-orange-400' },
];

export default function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);
  const s = slides[i];

  return (
    <section className="relative mt-4 overflow-hidden rounded-3xl shadow-lift" aria-roledescription="carousel">
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className={`relative flex min-h-[15rem] items-center bg-gradient-to-br ${s.bg} px-6 py-10 text-white sm:min-h-[19rem] sm:px-14`}
        >
          <div className="relative z-10 max-w-md">
            <h1 className="whitespace-pre-line text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">{s.title}</h1>
            <p className="mt-3 text-base text-white/85 sm:text-lg">{s.text}</p>
            <Link to={s.to} className="btn mt-6 bg-white text-brand-700 hover:bg-brand-50">{s.cta}</Link>
          </div>
          <div className="pointer-events-none absolute -right-10 top-1/2 grid h-72 w-72 -translate-y-1/2 place-items-center rounded-full bg-white/10 sm:right-10 sm:h-80 sm:w-80">
            <div className="grid h-48 w-48 place-items-center rounded-full bg-white/15 sm:h-56 sm:w-56">
              <motion.div initial={{ rotate: -12, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }}>
                <s.Icon className="h-24 w-24 sm:h-28 sm:w-28" strokeWidth={1.4} />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-4 left-6 z-20 flex gap-2 sm:left-14">
        {slides.map((_, n) => (
          <button key={n} onClick={() => setI(n)} aria-label={`Go to slide ${n + 1}`}
            className={`h-2 rounded-full transition-all ${n === i ? 'w-7 bg-white' : 'w-2 bg-white/50'}`} />
        ))}
      </div>
    </section>
  );
}
