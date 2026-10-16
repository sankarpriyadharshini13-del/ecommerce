export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const discountPct = (mrp, price) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';
