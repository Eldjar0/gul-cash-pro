import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useSearchProducts, Product } from '@/hooks/useProducts';

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
}

export function ProductSearch({ onProductSelect }: ProductSearchProps) {
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const { data: products, isLoading } = useSearchProducts(search);

  const handleSearch = (value: string) => {
    setSearch(value);
    setShowResults(value.length > 0);
  };

  const handleSelect = (product: Product) => {
    onProductSelect(product);
    setSearch('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un produit par nom ou code-barres..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-4 h-12 text-base"
        />
      </div>
      
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              Recherche en cours...
            </div>
          )}
          
          {!isLoading && products && products.length > 0 && (
            <div className="divide-y">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full p-3 hover:bg-muted/50 text-left transition-colors flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    {product.barcode && (
                      <div className="text-xs text-muted-foreground">
                        Code: {product.barcode}
                      </div>
                    )}
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {product.price.toFixed(2)}€
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {!isLoading && products && products.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Aucun produit trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}
