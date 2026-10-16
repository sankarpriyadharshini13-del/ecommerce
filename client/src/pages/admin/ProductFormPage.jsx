import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ImagePlus, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Field } from '../../components/AuthShell';
import { Block } from '../../components/Skeletons';
import { useCategories } from '../../lib/hooks';
import api from '../../lib/api';
import { errMsg } from '../../lib/format';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter a product name'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number({ invalid_type_error: 'Enter a price' }).int('Use whole rupees').min(1, 'Price must be at least ₹1'),
  mrp: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number().int('Use whole rupees').min(1).optional()),
  stock: z.coerce.number({ invalid_type_error: 'Enter stock' }).int('Use a whole number').min(0, 'Stock cannot be negative'),
  categoryId: z.coerce.number().int().min(1, 'Select a category'),
  brand: z.string().trim().optional(),
  isActive: z.boolean(),
}).refine((d) => d.mrp == null || d.mrp >= d.price, { path: ['mrp'], message: 'MRP must be equal to or more than the price' });

const empty = { name: '', description: '', price: '', mrp: '', stock: '', categoryId: '', brand: '', isActive: true };

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: categories } = useCategories();
  const [files, setFiles] = useState([]);
  const [removeIds, setRemoveIds] = useState([]);
  const [imgError, setImgError] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: empty });

  const { data: existing, isLoading } = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => api.get(`/admin/products/${id}`).then((r) => r.data.product),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) reset({
      name: existing.name, description: existing.description, price: existing.price, mrp: existing.mrp,
      stock: existing.stock, categoryId: existing.categoryId, brand: existing.brand || '', isActive: existing.isActive,
    });
  }, [existing, reset]);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const keptImages = (existing?.images || []).filter((i) => !removeIds.includes(i.id));

  const addFiles = (list) => {
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/'));
    setFiles((cur) => [...cur, ...imgs].slice(0, 8));
    setImgError('');
  };

  const save = useMutation({
    mutationFn: (fd) => (isEdit ? api.put(`/admin/products/${id}`, fd) : api.post('/admin/products', fd)),
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated' : 'Product added. It is now live in the store.');
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product'] });
      navigate('/admin/products');
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const onSubmit = (v) => {
    if (keptImages.length + files.length < 1) return setImgError('Add at least one product image');
    const fd = new FormData();
    ['name', 'description', 'price', 'stock', 'categoryId'].forEach((k) => fd.append(k, v[k]));
    fd.append('brand', v.brand || '');
    if (v.mrp) fd.append('mrp', v.mrp);
    fd.append('isActive', String(v.isActive));
    files.forEach((f) => fd.append('images', f));
    removeIds.forEach((rid) => fd.append('removeImageIds', rid));
    save.mutate(fd);
  };

  if (isEdit && isLoading) return <div className="space-y-4"><Block className="h-10 w-64" /><Block className="h-96" /></div>;
  const cls = (n) => `input ${errors[n] ? 'input-error' : ''}`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-brand-600"><ArrowLeft className="h-4 w-4" /> Products</Link>
      <h1 className="mb-5 text-2xl font-extrabold">{isEdit ? 'Edit product' : 'Add product'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-5 p-5 sm:p-8">
        <Field label="Product name" error={errors.name?.message}><input className={cls('name')} {...register('name')} /></Field>
        <Field label="Description" error={errors.description?.message}><textarea rows={5} className={cls('description')} {...register('description')} /></Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Selling price (₹)" error={errors.price?.message}><input type="number" min="1" className={cls('price')} {...register('price')} /></Field>
          <Field label="MRP before discount (₹, optional)" error={errors.mrp?.message}><input type="number" min="1" className={cls('mrp')} {...register('mrp')} /></Field>
          <Field label="Stock" error={errors.stock?.message}><input type="number" min="0" className={cls('stock')} {...register('stock')} /></Field>
          <Field label="Category" error={errors.categoryId?.message}>
            <select className={cls('categoryId')} {...register('categoryId')}>
              <option value="">Select category</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Brand (optional)" error={errors.brand?.message}><input className={cls('brand')} {...register('brand')} /></Field></div>
        </div>

        <div>
          <span className="label">Images</span>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className={`grid cursor-pointer place-items-center gap-1 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition hover:bg-brand-50 ${imgError ? 'border-red-400' : 'border-brand-200'}`}
          >
            <ImagePlus className="h-8 w-8 text-brand-500" />
            <span className="text-sm font-bold">Click or drop images here</span>
            <span className="text-xs text-ink/55">Up to 8 images, 5 MB each. The first one is the cover.</span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </label>
          {imgError && <p className="field-error" role="alert">{imgError}</p>}

          {(keptImages.length > 0 || files.length > 0) && (
            <ul className="mt-3 flex flex-wrap gap-3">
              {keptImages.map((img) => (
                <li key={img.id} className="relative h-24 w-20 overflow-hidden rounded-xl bg-brand-50">
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setRemoveIds((r) => [...r, img.id])} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 shadow" aria-label="Remove image"><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
              {previews.map((src, n) => (
                <li key={src} className="relative h-24 w-20 overflow-hidden rounded-xl bg-brand-50 ring-2 ring-brand-300">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setFiles((f) => f.filter((_, k) => k !== n))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 shadow" aria-label="Remove image"><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-brand-500" {...register('isActive')} />
          Show this product in the store
        </label>

        <div className="flex justify-end gap-3 border-t border-brand-50 pt-5">
          <Link to="/admin/products" className="btn-ghost">Cancel</Link>
          <button disabled={save.isPending} className="btn-primary min-w-36">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {isEdit ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  );
}
