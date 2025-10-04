import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export interface CashierPerformance {
  cashier_id: string;
  cashier_name: string;
  total_sales: number;
  sales_count: number;
  avg_sale_amount: number;
  total_revenue: number;
}

export const useCashierPerformance = (days: number = 30) => {
  return useQuery({
    queryKey: ['cashier-performance', days],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('cashier_id, total, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('is_cancelled', false);

      if (salesError) throw salesError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name');

      if (profilesError) throw profilesError;

      // Create a map of cashier IDs to names
      const cashierNames = new Map(
        profiles?.map((p) => [p.id, p.full_name || 'Unknown']) || []
      );

      // Aggregate by cashier
      const cashierMap = new Map<string, CashierPerformance>();

      sales?.forEach((sale) => {
        const cashierId = sale.cashier_id || 'unknown';
        const existing = cashierMap.get(cashierId);

        if (existing) {
          existing.total_sales += 1;
          existing.total_revenue += Number(sale.total);
        } else {
          cashierMap.set(cashierId, {
            cashier_id: cashierId,
            cashier_name: cashierNames.get(cashierId) || 'Caissier inconnu',
            total_sales: 1,
            sales_count: 1,
            avg_sale_amount: 0,
            total_revenue: Number(sale.total),
          });
        }
      });

      // Calculate averages and sort
      const cashiers = Array.from(cashierMap.values())
        .map((c) => ({
          ...c,
          avg_sale_amount: c.total_revenue / c.total_sales,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue);

      return cashiers;
    },
  });
};
