import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from './api';
import { errMsg } from './format';
import { useAuth } from '../context/AuthContext';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.categories),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCart() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart').then((r) => r.data),
    enabled: !!user,
  });
  const opts = { onSuccess: (data) => qc.setQueryData(['cart'], data), onError: (e) => toast.error(errMsg(e)) };

  const add = useMutation({
    mutationFn: ({ productId, quantity = 1 }) => api.post('/cart/items', { productId, quantity }).then((r) => r.data),
    ...opts,
  });
  const update = useMutation({
    mutationFn: ({ itemId, quantity }) => api.patch(`/cart/items/${itemId}`, { quantity }).then((r) => r.data),
    ...opts,
  });
  const remove = useMutation({
    mutationFn: (itemId) => api.delete(`/cart/items/${itemId}`).then((r) => r.data),
    ...opts,
  });
  return { cart: query.data, isLoading: query.isLoading && !!user, add, update, remove };
}

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/wishlist').then((r) => r.data.products),
    enabled: !!user,
  });
  const ids = new Set((query.data || []).map((p) => p.id));
  const toggle = useMutation({
    mutationFn: ({ productId, liked }) =>
      liked ? api.delete(`/wishlist/${productId}`) : api.post(`/wishlist/${productId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
    onError: (e) => toast.error(errMsg(e)),
  });
  return { products: query.data, isLoading: query.isLoading && !!user, ids, toggle };
}
