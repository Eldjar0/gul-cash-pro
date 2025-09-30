import { useState } from 'react';
import { Search, Barcode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Product } from '@/types/pos';
import { MOCK_PRODUCTS } from '@/data/mockProducts';

interface ProductSearchProps {
  onProductSelect: (product: Product, quantity?: number) => void;
}

export function ProductSearch({ onProductSelect }: ProductSearchProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value.length >= 2) {
      const filtered = MOCK_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(value.toLowerCase()) ||
          p.barcode?.includes(value) ||
          p.category?.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  const handleBarcodeSearch = (barcode: string) => {
    const product = MOCK_PRODUCTS.find((p) => p.barcode === barcode);
    if (product) {
      onProductSelect(product, 1);
      setSearch('');
      setResults([]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.length >= 8) {
                handleBarcodeSearch(search);
              }
            }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Barcode className="h-4 w-4" />
        </Button>
      </div>

      {results.length > 0 && (
        <Card className="absolute z-50 w-full max-h-60 overflow-auto bg-card shadow-lg">
          {results.map((product) => (
            <button
              key={product.id}
              onClick={() => {
                onProductSelect(product, product.type === 'unit' ? 1 : undefined);
                setSearch('');
                setResults([]);
              }}
              className="w-full text-left px-4 py-2 hover:bg-muted transition-colors border-b last:border-0"
            >
              <div className="font-medium text-foreground">{product.name}</div>
              <div className="text-sm text-muted-foreground flex justify-between">
                <span>{product.category}</span>
                <span className="font-medium text-primary">
                  {product.price.toFixed(2)}€{product.type === 'weight' && '/kg'}
                </span>
              </div>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
