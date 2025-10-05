import { useEffect, useRef } from 'react';
import { useCustomers } from './useCustomers';
import { useCreateNotification } from './useNotifications';
import { useAuth } from './useAuth';

const MILESTONE_THRESHOLDS = [100, 250, 500, 1000, 2500, 5000];

export const useCustomerMilestoneAlerts = () => {
  const { data: customers = [] } = useCustomers();
  const createNotification = useCreateNotification();
  const { user } = useAuth();
  const notifiedMilestonesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !customers.length) return;

    customers.forEach((customer) => {
      const points = customer.loyalty_points || 0;

      MILESTONE_THRESHOLDS.forEach((threshold) => {
        const milestoneKey = `${customer.id}-${threshold}`;

        // Check if customer has reached a milestone we haven't notified about
        if (points >= threshold && !notifiedMilestonesRef.current.has(milestoneKey)) {
          notifiedMilestonesRef.current.add(milestoneKey);

          createNotification.mutate({
            user_id: user.id,
            title: '🎉 Palier fidélité atteint',
            message: `${customer.name} a atteint ${threshold} points de fidélité!`,
            type: 'success',
            action_url: '/customers',
          });
        }
      });
    });
  }, [customers, user, createNotification]);
};
