import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTodayReportData } from './useDailyReports';

export interface MobileStats {
  todayRevenue: number;
  todaySalesCount: number;
  averageBasket: number;
  cashRegisterStatus: 'opened' | 'closed';
  cashRegisterFund: number;
  lastSale: {
    id: string;
    total: number;
    timestamp: string;
  } | null;
  lowStockCount: number;
  pendingOrdersCount: number;
}

export const useMobileStats = () => {
  return useQuery({
    queryKey: ['mobile-stats'],
    queryFn: async (): Promise<MobileStats> => {
      // Récupérer les données du rapport du jour
      const reportData = await getTodayReportData();
      
      // Vérifier le statut de la caisse
      const today = new Date().toISOString().split('T')[0];
      const { data: todayReport } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('report_date', today)
        .is('closing_amount', null)
        .limit(1)
        .maybeSingle();

      // Récupérer la dernière vente
      const { data: lastSale } = await supabase
        .from('sales')
        .select('id, total, date')
        .eq('is_cancelled', false)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Compter les produits en stock faible
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .lte('stock', 10)
        .eq('is_active', true);

      // Compter les commandes en attente
      const { data: pendingOrders } = await supabase
        .from('mobile_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      return {
        todayRevenue: reportData.totalSales,
        todaySalesCount: reportData.salesCount,
        averageBasket: reportData.salesCount > 0 ? reportData.totalSales / reportData.salesCount : 0,
        cashRegisterStatus: todayReport ? 'opened' : 'closed',
        cashRegisterFund: todayReport?.opening_amount || 0,
        lastSale: lastSale ? {
          id: lastSale.id,
          total: lastSale.total,
          timestamp: lastSale.date,
        } : null,
        lowStockCount: lowStockProducts?.length || 0,
        pendingOrdersCount: pendingOrders?.length || 0,
      };
    },
    refetchInterval: 30000, // Auto-refresh toutes les 30 secondes
    refetchOnWindowFocus: true,
  });
};
