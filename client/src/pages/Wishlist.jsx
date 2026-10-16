import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeletons';
import { useWishlist } from '../lib/hooks';

export default function Wishlist() {
  const { products, isLoading } = useWishlist();
  return (
    <div className="pt-6">
      <h1 className="mb-4 text-2xl font-extrabold">My wishlist</h1>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : products?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <div className="card grid place-items-center gap-3 p-14 text-center">
          <Heart className="h-12 w-12 text-brand-400" />
          <p className="font-bold">Nothing saved yet</p>
          <p className="text-sm text-ink/60">Tap the heart on any product to save it here.</p>
          <Link to="/products" className="btn-primary">Browse products</Link>
        </div>
      )}
    </div>
  );
}
