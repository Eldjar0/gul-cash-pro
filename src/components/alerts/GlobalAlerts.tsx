import { useAutomaticAlerts } from '@/hooks/useAutomaticAlerts';

/**
 * Global alerts component that monitors and triggers notifications
 * for low stock, expiring batches, and expiring promotions
 */
export function GlobalAlerts() {
  useAutomaticAlerts();
  return null; // This component doesn't render anything
}
