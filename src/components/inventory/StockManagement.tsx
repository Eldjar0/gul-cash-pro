import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileDown, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateOrderPDF } from '@/utils/generateOrderPDF';

export function StockManagement() {
  const { data: products = [], refetch } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStocks, setEditingStocks] = useState<Record<string, number>>({});

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const handleStockChange = (productId: string, newStock: number) => {
    setEditingStocks(prev => ({
      ...prev,
      [productId]: newStock
    }));
  };

  const handleQuickAdjust = async (product: any, adjustment: number) => {
    const currentStock = product.stock || 0;
    const newStock = Math.max(0, currentStock + adjustment);

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product.id);

      if (error) throw error;

      toast.success(`Stock ${adjustment > 0 ? 'augmenté' : 'diminué'} de ${Math.abs(adjustment)}`);
      refetch();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Erreur lors de la mise à jour du stock');
    }
  };

  const handleSaveStock = async (productId: string) => {
    const newStock = editingStocks[productId];
    if (newStock === undefined) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

      if (error) throw error;

      toast.success('Stock mis à jour');
      setEditingStocks(prev => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
      refetch();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Erreur lors de la mise à jour du stock');
    }
  };

  const handleGenerateOrderPDF = () => {
    const result = generateOrderPDF(products);
    if (result === null) {
      toast.info('Aucun produit en stock faible');
    } else {
      toast.success('PDF genere avec succes');
    }
  };

  const getStockBadge = (product: any) => {
    if (product.stock === 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    }
    if (product.stock <= (product.min_stock || 0)) {
      return <Badge className="bg-orange-500">Stock faible</Badge>;
    }
    return <Badge className="bg-green-500">OK</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleGenerateOrderPDF} className="gap-2">
          <FileDown className="h-4 w-4" />
          Generer PDF Commande
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestion des Stocks ({filteredProducts.length} produits)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors flex-wrap"
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{product.name}</p>
                    {getStockBadge(product)}
                  </div>
                  {product.barcode && (
                    <p className="text-sm text-muted-foreground">{product.barcode}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Stock actuel</p>
                    <p className="font-bold text-2xl">{product.stock || 0}</p>
                  </div>

                  {/* Boutons rapides +/- */}
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleQuickAdjust(product, -10)}
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 hover:bg-destructive hover:text-white"
                      title="Enlever 10"
                    >
                      --
                    </Button>
                    <Button
                      onClick={() => handleQuickAdjust(product, -1)}
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 hover:bg-destructive hover:text-white"
                      title="Enlever 1"
                    >
                      -
                    </Button>
                    <Button
                      onClick={() => handleQuickAdjust(product, 1)}
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 hover:bg-primary hover:text-white"
                      title="Ajouter 1"
                    >
                      +
                    </Button>
                    <Button
                      onClick={() => handleQuickAdjust(product, 10)}
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 hover:bg-primary hover:text-white"
                      title="Ajouter 10"
                    >
                      ++
                    </Button>
                  </div>
                  
                  {/* Input manuel */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Nouveau stock"
                      value={editingStocks[product.id] ?? ''}
                      onChange={(e) => handleStockChange(product.id, parseFloat(e.target.value) || 0)}
                      className="w-28"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveStock(product.id)}
                      disabled={editingStocks[product.id] === undefined}
                      className="gap-1"
                    >
                      <Save className="h-4 w-4" />
                      OK
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {products.filter(p => p.stock <= (p.min_stock || 0)).length > 0 && (
        <Card className="border-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Produits à commander
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700">
              {products.filter(p => p.stock === 0).length} produit(s) en rupture de stock
            </p>
            <p className="text-sm text-orange-700">
              {products.filter(p => p.stock > 0 && p.stock <= (p.min_stock || 0)).length} produit(s) en stock faible
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
