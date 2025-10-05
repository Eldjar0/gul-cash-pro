import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileDown, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const generateOrderPDF = () => {
    const lowStockProducts = products.filter(p => p.stock <= (p.min_stock || 0));
    
    if (lowStockProducts.length === 0) {
      toast.info('Aucun produit en stock faible');
      return;
    }

    const doc = new jsPDF();

    // En-tête
    doc.setFontSize(20);
    doc.text('Bon de Commande - Produits à Commander', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
    
    // Catégoriser les produits
    const outOfStock = lowStockProducts.filter(p => p.stock === 0);
    const lowStock = lowStockProducts.filter(p => p.stock > 0 && p.stock <= (p.min_stock || 0));

    let currentY = 40;

    // Section Rupture de stock
    if (outOfStock.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38); // red
      doc.text('🔴 RUPTURE DE STOCK (URGENT)', 14, currentY);
      currentY += 8;

      const outOfStockData = outOfStock.map(p => [
        p.name,
        p.barcode || '-',
        p.stock.toString(),
        (p.min_stock || 0).toString(),
        Math.max(10, (p.min_stock || 5) * 2).toString(), // Quantité suggérée
        p.supplier || '-'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Produit', 'Code-barres', 'Stock', 'Min', 'Qté à commander', 'Fournisseur']],
        body: outOfStockData,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] },
        styles: { fontSize: 9 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Section Stock faible
    if (lowStock.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(234, 88, 12); // orange
      doc.text('🟠 STOCK FAIBLE', 14, currentY);
      currentY += 8;

      const lowStockData = lowStock.map(p => [
        p.name,
        p.barcode || '-',
        p.stock.toString(),
        (p.min_stock || 0).toString(),
        Math.max(5, Math.ceil((p.min_stock || 5) * 1.5)).toString(),
        p.supplier || '-'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Produit', 'Code-barres', 'Stock', 'Min', 'Qté à commander', 'Fournisseur']],
        body: lowStockData,
        theme: 'grid',
        headStyles: { fillColor: [234, 88, 12] },
        styles: { fontSize: 9 }
      });
    }

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`commande-produits-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF généré avec succès');
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
        <Button onClick={generateOrderPDF} className="gap-2">
          <FileDown className="h-4 w-4" />
          Générer PDF Commande
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
