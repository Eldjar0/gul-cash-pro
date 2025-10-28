import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AlertType = 'stock_low' | 'stock_out' | 'cash_register_closed' | 'pending_orders' | 'report_pending';

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  count?: number;
  actionUrl?: string;
}

export const useMobileAlerts = () => {
  return useQuery({
    queryKey: ['mobile-alerts'],
    queryFn: async (): Promise<Alert[]> => {
      const alerts: Alert[] = [];

      // Vérifier le statut de la caisse
      const today = new Date().toISOString().split('T')[0];
      const { data: todayReport } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('report_date', today)
        .is('closing_amount', null)
        .limit(1)
        .maybeSingle();

      if (!todayReport) {
        alerts.push({
          id: 'cash-register-closed',
          type: 'cash_register_closed',
          severity: 'critical',
          title: 'Caisse fermée',
          description: 'La caisse n\'est pas ouverte. Ouvrez-la pour commencer les ventes.',
          actionUrl: '/mobile/cash-register',
        });
      }

      // Vérifier les produits en rupture de stock
      const { data: outOfStockProducts, count: outOfStockCount } = await supabase
        .from('products')
        .select('id, name', { count: 'exact' })
        .eq('stock', 0)
        .eq('is_active', true);

      if (outOfStockCount && outOfStockCount > 0) {
        alerts.push({
          id: 'stock-out',
          type: 'stock_out',
          severity: 'critical',
          title: 'Produits en rupture',
          description: `${outOfStockCount} produit(s) n'ont plus de stock`,
          count: outOfStockCount,
          actionUrl: '/mobile/alerts',
        });
      }

      // Vérifier les produits en stock faible
      const { data: lowStockProducts, count: lowStockCount } = await supabase
        .from('products')
        .select('id, name, stock', { count: 'exact' })
        .gt('stock', 0)
        .lte('stock', 10)
        .eq('is_active', true);

      if (lowStockCount && lowStockCount > 0) {
        alerts.push({
          id: 'stock-low',
          type: 'stock_low',
          severity: 'warning',
          title: 'Stock faible',
          description: `${lowStockCount} produit(s) ont un stock faible`,
          count: lowStockCount,
          actionUrl: '/mobile/alerts',
        });
      }

      return alerts;
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
};
