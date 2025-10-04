import { useEffect, useRef } from 'react';
import { usePromotions } from './usePromotions';
import { useCreateNotification } from './useNotifications';
import { useAuth } from './useAuth';
import { isWithinInterval, addDays, parseISO } from 'date-fns';

export const usePromotionAlerts = () => {
  const { data: promotions = [] } = usePromotions();
  const createNotification = useCreateNotification();
  const { user } = useAuth();
  const notifiedPromotionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !promotions.length) return;

    const now = new Date();
    const threeDaysFromNow = addDays(now, 3);

    promotions.forEach((promotion) => {
      if (!promotion.is_active || !promotion.end_date) return;

      const endDate = parseISO(promotion.end_date);
      const notificationKey = `${promotion.id}-expiring`;

      // Check if promotion expires within 3 days and we haven't notified yet
      if (
        isWithinInterval(endDate, { start: now, end: threeDaysFromNow }) &&
        !notifiedPromotionsRef.current.has(notificationKey)
      ) {
        notifiedPromotionsRef.current.add(notificationKey);
        
        createNotification.mutate({
          user_id: user.id,
          title: '⏰ Promotion bientôt expirée',
          message: `La promotion "${promotion.name}" expire bientôt`,
          type: 'info',
          action_url: '/promotions',
        });
      }
    });
  }, [promotions, user, createNotification]);
};
