// providers/CartProvider.jsx
// One cart in memory for the whole app so the header badge, the product pages
// and the cart screen never disagree. The server owns the cart; this is a cache
// that refetches after every mutation.

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { cart as cartApi } from '../api/endpoints';
import { adaptCartItem, errorText } from '../api/adapters';
import { useAuth } from './AuthProvider';

const CartContext = createContext(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return [];
    }
    setLoading(true);
    try {
      const data = await cartApi.get();
      const next = (data?.items || []).map(adaptCartItem);
      setItems(next);
      setError('');
      return next;
    } catch (err) {
      setError(errorText(err, 'Could not load your cart.'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (payload) => {
    await cartApi.add(payload);
    return refresh();
  }, [refresh]);

  const updateItem = useCallback(async (itemId, quantity) => {
    if (quantity <= 0) {
      await cartApi.removeItem(itemId);
    } else {
      await cartApi.updateItem(itemId, { quantity });
    }
    return refresh();
  }, [refresh]);

  const removeItem = useCallback(async (itemId) => {
    await cartApi.removeItem(itemId);
    return refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    await cartApi.clear();
    return refresh();
  }, [refresh]);

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + (i.quantity || 0), 0);
    const subtotal = items.reduce((n, i) => n + (i.total || 0), 0);
    return { items, count, subtotal, loading, error, refresh, add, updateItem, removeItem, clear };
  }, [items, loading, error, refresh, add, updateItem, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
