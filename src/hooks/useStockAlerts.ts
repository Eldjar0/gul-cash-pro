import { useEffect, useRef } from 'react';
import { useProducts } from './useProducts';
import { useCreateNotification } from './useNotifications';
import { useAuth } from '@/contexts/AuthContext';

export const useStockAlerts = () => {
  const { data: products = [] } = useProducts();
  const createNotification = useCreateNotification();
  const { user } = useAuth();
  const lastCheckRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !products.length) return;

    // Check for low stock products
    const lowStockProducts = products.filter(
      (product) => 
        product.is_active && 
        product.stock !== null && 
        product.min_stock !== null &&
        product.stock <= product.min_stock &&
        product.stock > 0
    );

    // Check for out of stock products
    const outOfStockProducts = products.filter(
      (product) => 
        product.is_active && 
        product.stock !== null &&
        product.stock <= 0
    );

    // Create a unique key for this stock state
    const currentStateKey = `${lowStockProducts.length}-${outOfStockProducts.length}-${lowStockProducts.map(p => p.id).join(',')}-${outOfStockProducts.map(p => p.id).join(',')}`;
    
    // Only create notifications if the state has changed
    if (lastCheckRef.current === currentStateKey) return;
    lastCheckRef.current = currentStateKey;

    // Create notification for low stock if any
    if (lowStockProducts.length > 0) {
      const productNames = lowStockProducts.slice(0, 3).map(p => p.name).join(', ');
      const moreText = lowStockProducts.length > 3 ? ` et ${lowStockProducts.length - 3} autre(s)` : '';
      
      createNotification.mutate({
        user_id: user.id,
        title: '⚠️ Stock faible',
        message: `${lowStockProducts.length} produit(s) en stock faible: ${productNames}${moreText}`,
        type: 'warning',
        action_url: '/products',
      });
    }

    // Create notification for out of stock if any
    if (outOfStockProducts.length > 0) {
      const productNames = outOfStockProducts.slice(0, 3).map(p => p.name).join(', ');
      const moreText = outOfStockProducts.length > 3 ? ` et ${outOfStockProducts.length - 3} autre(s)` : '';
      
      createNotification.mutate({
        user_id: user.id,
        title: '❌ Rupture de stock',
        message: `${outOfStockProducts.length} produit(s) en rupture: ${productNames}${moreText}`,
        type: 'error',
        action_url: '/products',
      });
    }
  }, [products, user, createNotification]);
};
