const styles = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-sky-100 text-sky-800',
  SHIPPED: 'bg-violet-100 text-violet-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
};
const label = (s) => s.charAt(0) + s.slice(1).toLowerCase();

export default function StatusBadge({ status }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}>{label(status)}</span>;
}
