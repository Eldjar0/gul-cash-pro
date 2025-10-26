import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  price: number;
  barcode?: string;
  stock?: number;
}

interface LabelProductSelectorProps {
  products: Product[];
  onAutoAssign: (selectedProducts: { product: Product; copies: number }[]) => void;
  isLoading?: boolean;
}

export const LabelProductSelector = ({
  products,
  onAutoAssign,
  isLoading = false,
}: LabelProductSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [copies, setCopies] = useState<Record<string, number>>({});

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
        const newCopies = { ...copies };
        delete newCopies[productId];
        setCopies(newCopies);
      } else {
        newSet.add(productId);
        setCopies(prev => ({ ...prev, [productId]: 1 }));
      }
      return newSet;
    });
  };

  const updateCopies = (productId: string, count: number) => {
    setCopies(prev => ({ ...prev, [productId]: Math.max(1, count) }));
  };

  const handleAutoAssign = () => {
    const selected = Array.from(selectedProducts).map(id => {
      const product = products.find(p => p.id === id);
      return {
        product: product!,
        copies: copies[id] || 1,
      };
    });
    onAutoAssign(selected);
  };

  const handleDragStart = (e: React.DragEvent, product: Product) => {
    e.dataTransfer.setData('product', JSON.stringify(product));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sélection des produits</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-2">
            {filteredProducts.map(product => {
              const isSelected = selectedProducts.has(product.id);
              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all ${
                    isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, product)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleProduct(product.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.price.toFixed(2)}€
                      {product.barcode && (
                        <span className="ml-2">• {product.barcode}</span>
                      )}
                    </div>
                    {product.stock !== undefined && (
                      <Badge variant="outline" className="mt-1">
                        Stock: {product.stock}
                      </Badge>
                    )}
                  </div>
                  {isSelected && (
                    <Input
                      type="number"
                      min="1"
                      value={copies[product.id] || 1}
                      onChange={(e) => updateCopies(product.id, parseInt(e.target.value) || 1)}
                      className="w-16"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t space-y-2">
          <div className="text-sm text-muted-foreground">
            {selectedProducts.size} produit(s) sélectionné(s)
          </div>
          <Button
            onClick={handleAutoAssign}
            disabled={selectedProducts.size === 0 || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assigner automatiquement
          </Button>
          <div className="text-xs text-muted-foreground">
            Astuce: Glissez-déposez les produits sur la feuille A4 pour un placement manuel
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
