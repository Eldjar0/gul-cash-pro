import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DailyReport {
  id: string;
  report_date: string;
  opening_amount: number;
  closing_amount: number | null;
  total_sales: number;
  total_cash: number;
  total_card: number;
  total_mobile: number;
  sales_count: number;
  cashier_id: string | null;
  serial_number: string | null;
  created_at: string;
}

export interface ReportData {
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalMobile: number;
  salesCount: number;
  vatByRate: Record<number, { totalHT: number; totalVAT: number }>;
}

export function useDailyReports() {
  return useQuery({
    queryKey: ['daily_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .order('report_date', { ascending: false });

      if (error) throw error;
      return data as DailyReport[];
    },
  });
}

export function useTodayReport() {
  return useQuery({
    queryKey: ['today_report'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('report_date', today)
        .is('closing_amount', null)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DailyReport | null;
    },
    refetchOnWindowFocus: true,
  });
}

export function useOpenDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (openingAmount: number) => {
      const today = new Date().toISOString().split('T')[0];
      
      // Vérifier si un rapport existe déjà pour cette date
      const { data: existing } = await supabase
        .from('daily_reports')
        .select('id, closing_amount')
        .eq('report_date', today)
        .maybeSingle();

      const { data: user } = await supabase.auth.getUser();

      if (existing) {
        if (existing.closing_amount === null) {
          throw new Error('La journée est déjà ouverte');
        } else {
          // Rouvrir la journée en réinitialisant les données
          const { data, error } = await supabase
            .from('daily_reports')
            .update({
              opening_amount: openingAmount,
              closing_amount: null,
              total_sales: 0,
              total_cash: 0,
              total_card: 0,
              total_mobile: 0,
              sales_count: 0,
              serial_number: null,
              cashier_id: user.user?.id,
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          return data;
        }
      }

      // Créer un nouveau rapport si aucun n'existe
      const { data, error } = await supabase
        .from('daily_reports')
        .insert({
          report_date: today,
          opening_amount: openingAmount,
          closing_amount: null,
          total_sales: 0,
          total_cash: 0,
          total_card: 0,
          total_mobile: 0,
          sales_count: 0,
          cashier_id: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today_report'] });
      queryClient.invalidateQueries({ queryKey: ['daily_reports'] });
      toast.success('Journée ouverte avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'ouverture de la journée');
    },
  });
}

export function useCloseDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, closingAmount, reportData }: { 
      reportId: string; 
      closingAmount: number;
      reportData: ReportData;
    }) => {
      // Générer le numéro de série
      const { data: serialNumber, error: serialError } = await supabase
        .rpc('generate_z_serial_number');

      if (serialError) throw serialError;

      const { data, error } = await supabase
        .from('daily_reports')
        .update({
          closing_amount: closingAmount,
          total_sales: reportData.totalSales,
          total_cash: reportData.totalCash,
          total_card: reportData.totalCard,
          total_mobile: reportData.totalMobile,
          sales_count: reportData.salesCount,
          serial_number: serialNumber,
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today_report'] });
      queryClient.invalidateQueries({ queryKey: ['daily_reports'] });
      toast.success('Journée fermée avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la fermeture de la journée');
    },
  });
}

export async function getTodayReportData(): Promise<ReportData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Exclure les ventes annulées (conformité légale belge)
  const { data: sales, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (*)
    `)
    .gte('date', today.toISOString())
    .lt('date', tomorrow.toISOString())
    .eq('is_cancelled', false);

  if (error) throw error;

  const totalSales = sales?.reduce((sum, sale) => sum + sale.total, 0) || 0;
  const totalCash = sales?.filter(s => s.payment_method === 'cash').reduce((sum, sale) => sum + sale.total, 0) || 0;
  const totalCard = sales?.filter(s => s.payment_method === 'card').reduce((sum, sale) => sum + sale.total, 0) || 0;
  const totalMobile = sales?.filter(s => s.payment_method === 'mobile').reduce((sum, sale) => sum + sale.total, 0) || 0;
  const salesCount = sales?.length || 0;

  // Calculer TVA par taux - normaliser le taux pour éviter les doublons
  const vatByRate: Record<number, { totalHT: number; totalVAT: number }> = {};
  
  sales?.forEach(sale => {
    sale.sale_items?.forEach((item: any) => {
      // Normaliser le taux (arrondir à 2 décimales)
      const rate = Math.round(parseFloat(item.vat_rate) * 100) / 100;
      if (!vatByRate[rate]) {
        vatByRate[rate] = { totalHT: 0, totalVAT: 0 };
      }
      const priceHT = item.unit_price / (1 + rate / 100);
      const itemHT = priceHT * item.quantity;
      const itemVAT = itemHT * (rate / 100);
      vatByRate[rate].totalHT += itemHT;
      vatByRate[rate].totalVAT += itemVAT;
    });
  });

  return {
    totalSales,
    totalCash,
    totalCard,
    totalMobile,
    salesCount,
    vatByRate,
  };
}
