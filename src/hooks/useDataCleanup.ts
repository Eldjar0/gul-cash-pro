import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export const useDataCleanup = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const deleteAllData = async () => {
    setIsDeleting(true);
    try {
      toast.info('Suppression en cours...');

      // Ordre important : supprimer les enfants avant les parents
      // 1. Sale items (dépend de sales)
      await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 2. Sales
      await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 3. Customer order items
      await supabase.from('customer_order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 4. Customer orders
      await supabase.from('customer_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 5. Quote items
      await supabase.from('quote_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 6. Quotes
      await supabase.from('quotes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 7. Refund items
      await supabase.from('refund_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 8. Refunds
      await supabase.from('refunds').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 9. Purchase order items
      await supabase.from('purchase_order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 10. Purchase orders
      await supabase.from('purchase_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 11. Product batches
      await supabase.from('product_batches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 12. Stock movements
      await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 13. Promotions
      await supabase.from('promotions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 14. Customer special prices
      await supabase.from('customer_special_prices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 15. Customer credit transactions
      await supabase.from('customer_credit_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 16. Customer credit accounts
      await supabase.from('customer_credit_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 17. Loyalty transactions
      await supabase.from('loyalty_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 18. Gift card transactions
      await supabase.from('gift_card_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 19. Gift cards
      await supabase.from('gift_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 20. Payment transactions
      await supabase.from('payment_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 21. Mobile orders
      await supabase.from('mobile_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 22. Inventory count items
      await supabase.from('inventory_count_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 23. Inventory counts
      await supabase.from('inventory_counts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 24. Cash movements
      await supabase.from('cash_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 25. Daily reports
      await supabase.from('daily_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 26. Saved carts
      await supabase.from('saved_carts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 27. Fiscal receipts
      await supabase.from('fiscal_receipts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 28. Products
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 29. Customers
      await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 30. Categories
      await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast.success('Toutes les données ont été supprimées avec succès !');
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Erreur lors de la suppression des données');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetSalesHistory = async () => {
    setIsResetting(true);
    try {
      toast.info('Réinitialisation de l\'historique en cours...');

      // 1. Supprimer les éléments de vente
      await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 2. Supprimer les reçus fiscaux (avant les ventes car dépendance)
      await supabase.from('fiscal_receipts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 3. Supprimer les ventes/factures
      await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 4. Supprimer les éléments de remboursement
      await supabase.from('refund_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 5. Supprimer les remboursements
      await supabase.from('refunds').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 6. Supprimer les transactions de paiement
      await supabase.from('payment_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 7. Supprimer les mouvements de caisse
      await supabase.from('cash_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 8. Supprimer les rapports journaliers
      await supabase.from('daily_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 9. Supprimer les paniers en attente
      await supabase.from('saved_carts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 10. Supprimer les tickets mobiles en attente
      await supabase.from('mobile_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast.success('Historique des ventes réinitialisé ! La numérotation recommencera à zéro.');
    } catch (error) {
      console.error('Error resetting sales history:', error);
      toast.error('Erreur lors de la réinitialisation');
    } finally {
      setIsResetting(false);
    }
  };

  return {
    deleteAllData,
    isDeleting,
    resetSalesHistory,
    isResetting,
  };
};
