import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LowStockAlert() {
      const { data: lowStockProducts } = useQuery({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock, min_stock, barcode, image')
        .eq('is_active', true)
        .order('stock', { ascending: true });

      if (error) throw error;

      // Filter products where stock is at or below minimum stock
      return data?.filter(p => 
        p.stock !== null && 
        p.min_stock !== null && 
        p.stock <= p.min_stock
      ).slice(0, 10) || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (!lowStockProducts || lowStockProducts.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800 dark:text-orange-400">
        Stock faible détecté
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-orange-700 dark:text-orange-300">
          {lowStockProducts.length} produit(s) ont un stock inférieur au seuil minimum
        </p>
        
        <div className="space-y-2">
          {lowStockProducts.slice(0, 5).map(product => (
            <div key={product.id} className="flex items-center justify-between text-sm bg-white dark:bg-gray-900 p-2 rounded gap-2">
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-medium truncate">{product.name}</span>
                {product.barcode && (
                  <span className="text-xs text-muted-foreground">({product.barcode})</span>
                )}
              </div>
              <span className="font-bold text-orange-600 shrink-0">
                {product.stock} / {product.min_stock} min
              </span>
            </div>
          ))}
        </div>

        {lowStockProducts.length > 5 && (
          <p className="text-xs text-orange-600">
            + {lowStockProducts.length - 5} autre(s) produit(s)
          </p>
        )}

        <Button asChild size="sm" variant="outline" className="mt-2 border-orange-600 text-orange-700 hover:bg-orange-100">
          <Link to="/inventory-management">
            Voir tous les produits
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
