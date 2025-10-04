import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  sale_count: number;
  avg_price: number;
}

export const useTopProducts = (days: number = 30) => {
  return useQuery({
    queryKey: ['top-products', days],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      const { data, error } = await supabase
        .from('sale_items')
        .select('product_id, product_name, quantity, total')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Aggregate by product
      const productMap = new Map<string, ProductPerformance>();

      data?.forEach((item) => {
        const existing = productMap.get(item.product_id || 'unknown');
        if (existing) {
          existing.total_quantity += Number(item.quantity);
          existing.total_revenue += Number(item.total);
          existing.sale_count += 1;
        } else {
          productMap.set(item.product_id || 'unknown', {
            product_id: item.product_id || 'unknown',
            product_name: item.product_name,
            total_quantity: Number(item.quantity),
            total_revenue: Number(item.total),
            sale_count: 1,
            avg_price: 0,
          });
        }
      });

      // Calculate averages and sort
      const products = Array.from(productMap.values())
        .map((p) => ({
          ...p,
          avg_price: p.total_revenue / p.total_quantity,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);

      return products;
    },
  });
};

export const useLowPerformingProducts = (days: number = 30, threshold: number = 5) => {
  return useQuery({
    queryKey: ['low-performing-products', days, threshold],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      const { data: saleItems, error: saleError } = await supabase
        .from('sale_items')
        .select('product_id, product_name, quantity')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (saleError) throw saleError;

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, stock')
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Count sales per product
      const salesCount = new Map<string, number>();
      saleItems?.forEach((item) => {
        const id = item.product_id || 'unknown';
        salesCount.set(id, (salesCount.get(id) || 0) + Number(item.quantity));
      });

      // Find products with sales below threshold
      const lowPerforming = products
        ?.filter((p) => (salesCount.get(p.id) || 0) < threshold)
        .map((p) => ({
          ...p,
          sales_count: salesCount.get(p.id) || 0,
        }))
        .sort((a, b) => a.sales_count - b.sales_count);

      return lowPerforming || [];
    },
  });
};
