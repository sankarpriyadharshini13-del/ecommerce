import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="card mt-10 grid place-items-center gap-3 p-16 text-center">
      <p className="text-6xl font-extrabold text-brand-500">404</p>
      <p className="font-bold">We could not find that page</p>
      <Link to="/" className="btn-primary">Back to home</Link>
    </div>
  );
}
