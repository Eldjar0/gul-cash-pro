import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export interface DailyRevenue {
  date: string;
  revenue: number;
  sales_count: number;
  avg_sale: number;
}

export const useDailyRevenue = (days: number = 30) => {
  return useQuery({
    queryKey: ['daily-revenue', days],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      const { data, error } = await supabase
        .from('sales')
        .select('date, total')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .eq('is_cancelled', false)
        .order('date', { ascending: true });

      if (error) throw error;

      // Group by date
      const revenueByDate = new Map<string, DailyRevenue>();

      data?.forEach((sale) => {
        const dateKey = format(new Date(sale.date), 'yyyy-MM-dd');
        const existing = revenueByDate.get(dateKey);

        if (existing) {
          existing.revenue += Number(sale.total);
          existing.sales_count += 1;
        } else {
          revenueByDate.set(dateKey, {
            date: dateKey,
            revenue: Number(sale.total),
            sales_count: 1,
            avg_sale: 0,
          });
        }
      });

      // Calculate averages
      const result = Array.from(revenueByDate.values()).map((d) => ({
        ...d,
        avg_sale: d.revenue / d.sales_count,
      }));

      return result;
    },
  });
};

export interface PaymentMethodStats {
  method: string;
  count: number;
  total: number;
  percentage: number;
}

export const usePaymentMethodStats = (days: number = 30) => {
  return useQuery({
    queryKey: ['payment-method-stats', days],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      const { data, error } = await supabase
        .from('sales')
        .select('payment_method, total')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .eq('is_cancelled', false);

      if (error) throw error;

      const methodMap = new Map<string, { count: number; total: number }>();
      let grandTotal = 0;

      data?.forEach((sale) => {
        const method = sale.payment_method || 'unknown';
        const amount = Number(sale.total);
        grandTotal += amount;

        const existing = methodMap.get(method);
        if (existing) {
          existing.count += 1;
          existing.total += amount;
        } else {
          methodMap.set(method, { count: 1, total: amount });
        }
      });

      const stats: PaymentMethodStats[] = Array.from(methodMap.entries()).map(
        ([method, data]) => ({
          method,
          count: data.count,
          total: data.total,
          percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
        })
      );

      return stats.sort((a, b) => b.total - a.total);
    },
  });
};
