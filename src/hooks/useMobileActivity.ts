import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ActivityType = 'sale' | 'product_added' | 'product_updated' | 'stock_alert' | 'cash_movement' | 'order_created';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export const useMobileActivity = (limit: number = 10) => {
  return useQuery({
    queryKey: ['mobile-activity', limit],
    queryFn: async (): Promise<Activity[]> => {
      const activities: Activity[] = [];
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Récupérer les ventes récentes
      const { data: sales } = await supabase
        .from('sales')
        .select('id, total, date, sale_number')
        .gte('date', yesterday.toISOString())
        .eq('is_cancelled', false)
        .order('date', { ascending: false })
        .limit(5);

      sales?.forEach(sale => {
        activities.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          title: `Vente #${sale.sale_number}`,
          description: `${sale.total.toFixed(2)}€`,
          timestamp: sale.date,
        });
      });

      // Récupérer les mouvements de stock récents
      const { data: stockMovements } = await supabase
        .from('stock_movements')
        .select('id, product_name, movement_type, quantity, created_at, reason')
        .gte('created_at', yesterday.toISOString())
        .in('movement_type', ['in', 'adjustment'])
        .order('created_at', { ascending: false })
        .limit(3);

      stockMovements?.forEach(movement => {
        activities.push({
          id: `stock-${movement.id}`,
          type: movement.movement_type === 'in' ? 'product_added' : 'product_updated',
          title: movement.product_name,
          description: movement.reason || `${movement.movement_type === 'in' ? '+' : ''}${movement.quantity} unités`,
          timestamp: movement.created_at,
        });
      });

      // Récupérer les produits en alerte stock
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, name, stock, updated_at')
        .lte('stock', 10)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(2);

      lowStockProducts?.forEach(product => {
        activities.push({
          id: `alert-${product.id}`,
          type: 'stock_alert',
          title: `Alerte: ${product.name}`,
          description: `Stock faible (${product.stock} unités)`,
          timestamp: product.updated_at || new Date().toISOString(),
        });
      });

      // Trier par date et limiter
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
};
