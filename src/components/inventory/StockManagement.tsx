import { useState, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileDown, Save, AlertTriangle, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateOrderPDF } from '@/utils/generateOrderPDF';

const ITEMS_PER_PAGE = 20;

export function StockManagement() {
  const { data: products = [], refetch } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStocks, setEditingStocks] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => 
    products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm))
    ), [products, searchTerm]);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
            onChange={(e) => handleSearchChange(e.target.value)}
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
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Gestion des Stocks ({filteredProducts.length} produits)</span>
            <span className="text-sm font-normal text-muted-foreground">
              Page {currentPage} sur {totalPages || 1}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {paginatedProducts.map((product) => (
              <div 
                key={product.id} 
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors flex-wrap"
              >
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center bg-muted rounded">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Afficher: première, dernière, et pages proches de la page actuelle
                const showPage = page === 1 || 
                                 page === totalPages || 
                                 Math.abs(page - currentPage) <= 2;
                const showEllipsis = page === 2 && currentPage > 4 ||
                                    page === totalPages - 1 && currentPage < totalPages - 3;
                
                if (showEllipsis && !showPage) {
                  return <span key={page} className="px-2 text-muted-foreground">...</span>;
                }
                
                if (!showPage) return null;
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[36px]"
                  >
                    {page}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
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
