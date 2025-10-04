import { useEffect, useRef } from 'react';
import { useProducts } from './useProducts';
import { useProductBatches } from './useProductBatches';
import { usePromotions } from './usePromotions';
import { useCreateNotification } from './useNotifications';
import { useAuth } from './useAuth';
import { differenceInDays, parseISO, isWithinInterval, addDays } from 'date-fns';

/**
 * Hook for automatic alerts
 * Checks for:
 * - Low stock products
 * - Expiring batches
 * - Expiring promotions
 */
export const useAutomaticAlerts = () => {
  const { user } = useAuth();
  const { data: products } = useProducts();
  const { data: batches } = useProductBatches();
  const { data: promotions } = usePromotions();
  const createNotification = useCreateNotification();
  
  const notifiedItemsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !products || !batches || !promotions) return;

    const now = new Date();
    
    // Check low stock
    products.forEach((product) => {
      if (!product.is_active || product.stock === null || product.min_stock === null) return;
      
      const notificationKey = `low-stock-${product.id}`;
      
      if (product.stock <= product.min_stock && !notifiedItemsRef.current.has(notificationKey)) {
        notifiedItemsRef.current.add(notificationKey);
        
        const severity = product.stock === 0 ? 'error' : 'warning';
        
        createNotification.mutate({
          user_id: user.id,
          title: product.stock === 0 ? '🚨 Rupture de stock' : '⚠️ Stock faible',
          message: `${product.name}: ${product.stock} ${product.unit} restant(s)`,
          type: severity,
          action_url: '/products',
        });
      }
    });

    // Check expiring batches (within 30 days)
    batches.forEach((batch) => {
      if (!batch.expiry_date) return;
      
      const expiryDate = parseISO(batch.expiry_date);
      const daysUntilExpiry = differenceInDays(expiryDate, now);
      const notificationKey = `expiring-batch-${batch.id}`;
      
      if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30 && !notifiedItemsRef.current.has(notificationKey)) {
        notifiedItemsRef.current.add(notificationKey);
        
        const severity = daysUntilExpiry <= 7 ? 'error' : 'warning';
        
        createNotification.mutate({
          user_id: user.id,
          title: daysUntilExpiry <= 7 ? '🚨 Lot expire bientôt!' : '⏰ Lot proche expiration',
          message: `Lot ${batch.batch_number} expire dans ${daysUntilExpiry} jour(s)`,
          type: severity,
          action_url: '/inventory',
        });
      }
    });

    // Check expiring promotions (within 3 days)
    const threeDaysFromNow = addDays(now, 3);
    
    promotions.forEach((promotion) => {
      if (!promotion.is_active || !promotion.end_date) return;

      const endDate = parseISO(promotion.end_date);
      const notificationKey = `expiring-promo-${promotion.id}`;

      if (
        isWithinInterval(endDate, { start: now, end: threeDaysFromNow }) &&
        !notifiedItemsRef.current.has(notificationKey)
      ) {
        notifiedItemsRef.current.add(notificationKey);
        
        createNotification.mutate({
          user_id: user.id,
          title: '⏰ Promotion bientôt expirée',
          message: `"${promotion.name}" expire bientôt`,
          type: 'info',
          action_url: '/promotions',
        });
      }
    });
  }, [products, batches, promotions, user, createNotification]);
};
