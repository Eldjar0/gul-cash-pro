-- Migrer les paniers sauvegardés vers mobile_orders
DO $$
DECLARE
  cart_record RECORD;
  new_order_number TEXT;
  cart_item JSONB;
  new_items JSONB := '[]'::JSONB;
  total_amt NUMERIC := 0;
BEGIN
  -- Pour chaque panier sauvegardé
  FOR cart_record IN SELECT * FROM saved_carts LOOP
    -- Générer un numéro de commande
    SELECT generate_mobile_order_number() INTO new_order_number;
    
    -- Réinitialiser les items et le total pour chaque panier
    new_items := '[]'::JSONB;
    total_amt := 0;
    
    -- Transformer chaque item du cart_data
    FOR cart_item IN SELECT * FROM jsonb_array_elements(cart_record.cart_data) LOOP
      new_items := new_items || jsonb_build_object(
        'product_id', cart_item->'product'->>'id',
        'product_name', cart_item->'product'->>'name',
        'quantity', (cart_item->>'quantity')::NUMERIC,
        'unit_price', (cart_item->'product'->>'price')::NUMERIC,
        'total_price', (cart_item->>'total')::NUMERIC
      );
      
      total_amt := total_amt + (cart_item->>'total')::NUMERIC;
    END LOOP;
    
    -- Insérer dans mobile_orders
    INSERT INTO mobile_orders (
      order_number,
      status,
      items,
      total_amount,
      notes,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      new_order_number,
      'pending',
      new_items,
      total_amt,
      cart_record.cart_name,
      cart_record.cashier_id,
      cart_record.created_at,
      cart_record.updated_at
    );
  END LOOP;
  
  RAISE NOTICE 'Migration terminée avec succès';
END $$;

-- Optionnel: Supprimer l'ancienne table saved_carts après vérification
-- DROP TABLE IF EXISTS saved_carts;