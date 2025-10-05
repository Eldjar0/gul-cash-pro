import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const useFullExport = () => {
  const exportFullData = async () => {
    try {
      toast.info('Préparation de l\'export complet...');

      // Fetch all data in parallel
      const [
        salesData,
        productsData,
        customersData,
        categoriesData,
        dailyReportsData,
        purchaseOrdersData,
        quotesData,
        customerOrdersData,
        refundsData,
        stockMovementsData,
        productBatchesData,
      ] = await Promise.all([
        supabase.from('sales').select('*, sale_items(*), customers(*)').order('date', { ascending: false }),
        supabase.from('products').select('*, categories(*)').order('name'),
        supabase.from('customers').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('daily_reports').select('*').order('report_date', { ascending: false }),
        supabase.from('purchase_orders').select('*, purchase_order_items(*)').order('order_date', { ascending: false }),
        supabase.from('quotes').select('*, quote_items(*), customers(*)').order('quote_date', { ascending: false }),
        supabase.from('customer_orders').select('*, customer_order_items(*), customers(*)').order('order_date', { ascending: false }),
        supabase.from('refunds').select('*, refund_items(*), customers(*)').order('created_at', { ascending: false }),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: false }),
        supabase.from('product_batches').select('*, products(*)').order('received_date', { ascending: false }),
      ]);

      // Check for errors
      if (salesData.error) throw salesData.error;
      if (productsData.error) throw productsData.error;
      if (customersData.error) throw customersData.error;
      if (categoriesData.error) throw categoriesData.error;
      if (dailyReportsData.error) throw dailyReportsData.error;
      if (purchaseOrdersData.error) throw purchaseOrdersData.error;
      if (quotesData.error) throw quotesData.error;
      if (customerOrdersData.error) throw customerOrdersData.error;
      if (refundsData.error) throw refundsData.error;
      if (stockMovementsData.error) throw stockMovementsData.error;
      if (productBatchesData.error) throw productBatchesData.error;

      // Create complete backup object
      const fullBackup = {
        export_date: new Date().toISOString(),
        export_version: '1.0',
        data: {
          sales: salesData.data || [],
          products: productsData.data || [],
          customers: customersData.data || [],
          categories: categoriesData.data || [],
          daily_reports: dailyReportsData.data || [],
          purchase_orders: purchaseOrdersData.data || [],
          quotes: quotesData.data || [],
          customer_orders: customerOrdersData.data || [],
          refunds: refundsData.data || [],
          stock_movements: stockMovementsData.data || [],
          product_batches: productBatchesData.data || [],
        },
        statistics: {
          total_sales: salesData.data?.length || 0,
          total_products: productsData.data?.length || 0,
          total_customers: customersData.data?.length || 0,
          total_categories: categoriesData.data?.length || 0,
          total_daily_reports: dailyReportsData.data?.length || 0,
          total_purchase_orders: purchaseOrdersData.data?.length || 0,
          total_quotes: quotesData.data?.length || 0,
          total_customer_orders: customerOrdersData.data?.length || 0,
          total_refunds: refundsData.data?.length || 0,
          total_stock_movements: stockMovementsData.data?.length || 0,
          total_batches: productBatchesData.data?.length || 0,
        }
      };

      // Create JSON file
      const jsonContent = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `sauvegarde_complete_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Sauvegarde complète exportée avec succès ! (${Object.keys(fullBackup.data).length} tables)`);
    } catch (error) {
      console.error('Error exporting full data:', error);
      toast.error('Erreur lors de l\'export complet');
    }
  };

  return {
    exportFullData,
  };
};
