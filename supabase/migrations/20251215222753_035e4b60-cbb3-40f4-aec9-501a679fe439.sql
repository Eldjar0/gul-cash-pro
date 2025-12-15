
-- Nettoyage de toutes les données de test (garde produits et catégories)

-- 1. Sale items (dépend de sales)
DELETE FROM sale_items WHERE id IS NOT NULL;

-- 2. Sales
DELETE FROM sales WHERE id IS NOT NULL;

-- 3. Customer order items
DELETE FROM customer_order_items WHERE id IS NOT NULL;

-- 4. Customer orders
DELETE FROM customer_orders WHERE id IS NOT NULL;

-- 5. Quote items
DELETE FROM quote_items WHERE id IS NOT NULL;

-- 6. Quotes
DELETE FROM quotes WHERE id IS NOT NULL;

-- 7. Refund items
DELETE FROM refund_items WHERE id IS NOT NULL;

-- 8. Refunds
DELETE FROM refunds WHERE id IS NOT NULL;

-- 9. Purchase order items
DELETE FROM purchase_order_items WHERE id IS NOT NULL;

-- 10. Purchase orders
DELETE FROM purchase_orders WHERE id IS NOT NULL;

-- 11. Product batches
DELETE FROM product_batches WHERE id IS NOT NULL;

-- 12. Stock movements
DELETE FROM stock_movements WHERE id IS NOT NULL;

-- 13. Promotions
DELETE FROM promotions WHERE id IS NOT NULL;

-- 14. Customer special prices
DELETE FROM customer_special_prices WHERE id IS NOT NULL;

-- 15. Customer credit transactions
DELETE FROM customer_credit_transactions WHERE id IS NOT NULL;

-- 16. Customer credit accounts
DELETE FROM customer_credit_accounts WHERE id IS NOT NULL;

-- 17. Loyalty transactions
DELETE FROM loyalty_transactions WHERE id IS NOT NULL;

-- 18. Gift card transactions
DELETE FROM gift_card_transactions WHERE id IS NOT NULL;

-- 19. Gift cards
DELETE FROM gift_cards WHERE id IS NOT NULL;

-- 20. Payment transactions
DELETE FROM payment_transactions WHERE id IS NOT NULL;

-- 21. Mobile orders (saved carts)
DELETE FROM mobile_orders WHERE id IS NOT NULL;

-- 22. Inventory count items
DELETE FROM inventory_count_items WHERE id IS NOT NULL;

-- 23. Inventory counts
DELETE FROM inventory_counts WHERE id IS NOT NULL;

-- 24. Cash movements
DELETE FROM cash_movements WHERE id IS NOT NULL;

-- 25. Daily reports
DELETE FROM daily_reports WHERE id IS NOT NULL;

-- 26. Saved carts
DELETE FROM saved_carts WHERE id IS NOT NULL;

-- 27. Customers (optionnel - décommentez si vous voulez supprimer les clients test)
DELETE FROM customers WHERE id IS NOT NULL;

-- 28. Fiscal receipts
DELETE FROM fiscal_receipts WHERE id IS NOT NULL;

-- 29. Audit logs
DELETE FROM audit_logs WHERE id IS NOT NULL;

-- 30. Notifications
DELETE FROM notifications WHERE id IS NOT NULL;

-- NE PAS SUPPRIMER: products, categories
