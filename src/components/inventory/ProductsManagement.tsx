import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Package, Upload, Tag } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { CategoryDialog } from '@/components/products/CategoryDialog';
import { ImportProductsDialog } from '@/components/products/ImportProductsDialog';
import { BarcodeLabelDialog } from '@/components/products/BarcodeLabelDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ProductsManagement = () => {
  const { data: products = [] } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [barcodeLabelDialogOpen, setBarcodeLabelDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (stockFilter === 'out') return matchesSearch && p.stock === 0;
    if (stockFilter === 'low') return matchesSearch && p.stock > 0 && p.stock <= (p.min_stock || 0);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou code-barres..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="low">Stock faible</SelectItem>
            <SelectItem value="out">Rupture</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
          <Tag className="h-4 w-4 mr-2" />
          Catégories
        </Button>
        <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Importer
        </Button>
      </div>

      {filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun produit trouvé</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    {product.barcode && (
                      <Badge variant="outline" className="mt-1 font-mono text-xs">
                        {product.barcode}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix</span>
                    <span className="font-semibold">{product.price.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock</span>
                    <Badge variant={product.stock === 0 ? 'destructive' : product.stock <= (product.min_stock || 0) ? 'secondary' : 'default'}>
                      {product.stock} {product.unit}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
      <ImportProductsDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <BarcodeLabelDialog
        open={barcodeLabelDialogOpen}
        onOpenChange={setBarcodeLabelDialogOpen}
        selectedProductIds={selectedProducts}
      />
    </div>
  );
};
