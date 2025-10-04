import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks } from 'date-fns';

interface SalesAnalytics {
  totalSales: number;
  totalRevenue: number;
  averageBasket: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  salesByDay: Array<{ date: string; sales: number; revenue: number }>;
  salesByHour: Array<{ hour: number; sales: number; revenue: number }>;
  salesByPaymentMethod: Array<{ method: string; count: number; amount: number }>;
  salesByCategory: Array<{ category: string; count: number; revenue: number }>;
}

export const useAnalytics = (period: 'today' | 'week' | 'month' | 'custom', startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['analytics', period, startDate, endDate],
    queryFn: async (): Promise<SalesAnalytics> => {
      let fromDate: Date;
      let toDate: Date = new Date();

      switch (period) {
        case 'today':
          fromDate = new Date();
          fromDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          fromDate = startOfWeek(new Date(), { weekStartsOn: 1 });
          toDate = endOfWeek(new Date(), { weekStartsOn: 1 });
          break;
        case 'month':
          fromDate = startOfMonth(new Date());
          toDate = endOfMonth(new Date());
          break;
        case 'custom':
          if (!startDate || !endDate) {
            throw new Error('Custom period requires start and end dates');
          }
          fromDate = startDate;
          toDate = endDate;
          break;
        default:
          fromDate = new Date();
          fromDate.setHours(0, 0, 0, 0);
      }

      // Fetch sales data
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*, sale_items(*, products(name, categories(name)))')
        .gte('date', fromDate.toISOString())
        .lte('date', toDate.toISOString())
        .eq('is_cancelled', false);

      if (error) throw error;

      const totalSales = sales?.length || 0;
      const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const averageBasket = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Top products
      const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
      sales?.forEach(sale => {
        sale.sale_items?.forEach((item: any) => {
          const name = item.product_name;
          const existing = productMap.get(name) || { name, quantity: 0, revenue: 0 };
          existing.quantity += item.quantity;
          existing.revenue += item.total;
          productMap.set(name, existing);
        });
      });
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Sales by day
      const dayMap = new Map<string, { sales: number; revenue: number }>();
      sales?.forEach(sale => {
        const day = new Date(sale.date).toLocaleDateString('fr-FR');
        const existing = dayMap.get(day) || { sales: 0, revenue: 0 };
        existing.sales += 1;
        existing.revenue += sale.total;
        dayMap.set(day, existing);
      });
      const salesByDay = Array.from(dayMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));

      // Sales by hour
      const hourMap = new Map<number, { sales: number; revenue: number }>();
      for (let i = 0; i < 24; i++) {
        hourMap.set(i, { sales: 0, revenue: 0 });
      }
      sales?.forEach(sale => {
        const hour = new Date(sale.date).getHours();
        const existing = hourMap.get(hour)!;
        existing.sales += 1;
        existing.revenue += sale.total;
      });
      const salesByHour = Array.from(hourMap.entries()).map(([hour, data]) => ({
        hour,
        ...data,
      }));

      // Sales by payment method
      const paymentMap = new Map<string, { count: number; amount: number }>();
      sales?.forEach(sale => {
        const method = sale.payment_method;
        const existing = paymentMap.get(method) || { count: 0, amount: 0 };
        existing.count += 1;
        existing.amount += sale.total;
        paymentMap.set(method, existing);
      });
      const salesByPaymentMethod = Array.from(paymentMap.entries()).map(([method, data]) => ({
        method,
        ...data,
      }));

      // Sales by category
      const categoryMap = new Map<string, { count: number; revenue: number }>();
      sales?.forEach(sale => {
        sale.sale_items?.forEach((item: any) => {
          const category = item.products?.categories?.name || 'Sans catégorie';
          const existing = categoryMap.get(category) || { count: 0, revenue: 0 };
          existing.count += item.quantity;
          existing.revenue += item.total;
          categoryMap.set(category, existing);
        });
      });
      const salesByCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        ...data,
      }));

      return {
        totalSales,
        totalRevenue,
        averageBasket,
        topProducts,
        salesByDay,
        salesByHour,
        salesByPaymentMethod,
        salesByCategory,
      };
    },
  });
};

export const useComparativeAnalytics = () => {
  return useQuery({
    queryKey: ['comparative-analytics'],
    queryFn: async () => {
      const now = new Date();
      
      // This week vs last week
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

      const [thisWeekSales, lastWeekSales] = await Promise.all([
        supabase
          .from('sales')
          .select('total')
          .gte('date', thisWeekStart.toISOString())
          .lte('date', thisWeekEnd.toISOString())
          .eq('is_cancelled', false),
        supabase
          .from('sales')
          .select('total')
          .gte('date', lastWeekStart.toISOString())
          .lte('date', lastWeekEnd.toISOString())
          .eq('is_cancelled', false),
      ]);

      const thisWeekRevenue = thisWeekSales.data?.reduce((sum, s) => sum + s.total, 0) || 0;
      const lastWeekRevenue = lastWeekSales.data?.reduce((sum, s) => sum + s.total, 0) || 0;
      const weekGrowth = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

      // This month vs last month
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      const [thisMonthSales, lastMonthSales] = await Promise.all([
        supabase
          .from('sales')
          .select('total')
          .gte('date', thisMonthStart.toISOString())
          .lte('date', thisMonthEnd.toISOString())
          .eq('is_cancelled', false),
        supabase
          .from('sales')
          .select('total')
          .gte('date', lastMonthStart.toISOString())
          .lte('date', lastMonthEnd.toISOString())
          .eq('is_cancelled', false),
      ]);

      const thisMonthRevenue = thisMonthSales.data?.reduce((sum, s) => sum + s.total, 0) || 0;
      const lastMonthRevenue = lastMonthSales.data?.reduce((sum, s) => sum + s.total, 0) || 0;
      const monthGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      return {
        week: {
          current: thisWeekRevenue,
          previous: lastWeekRevenue,
          growth: weekGrowth,
        },
        month: {
          current: thisMonthRevenue,
          previous: lastMonthRevenue,
          growth: monthGrowth,
        },
      };
    },
  });
};
