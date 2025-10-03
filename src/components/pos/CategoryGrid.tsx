import { useCategories } from '@/hooks/useCategories';
import { useProductsByCategory } from '@/hooks/useProducts';
import { useState } from 'react';
import { Product } from '@/hooks/useProducts';
import { Package2 } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

interface CategoryGridProps {
  onProductSelect: (product: Product) => void;
}

export function CategoryGrid({ onProductSelect }: CategoryGridProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const { data: products } = useProductsByCategory(selectedCategoryId);

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Aucune catégorie</div>;
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleBack = () => {
    setSelectedCategoryId(undefined);
  };

  return (
    <div className="h-full flex flex-col">
      {!selectedCategoryId ? (
        <>
          <h3 className="text-lg font-bold mb-4 text-foreground">Catégories</h3>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category, index) => {
                const Icon = DynamicIcon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className="aspect-square rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 hover:shadow-2xl border-2 backdrop-blur-sm relative overflow-hidden group animate-scale-in"
                    style={{
                      backgroundColor: `${category.color}20`,
                      borderColor: `${category.color}60`,
                      animationDelay: `${index * 0.05}s`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div 
                      className="p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon && <Icon name={category.icon} size={40} className="text-white drop-shadow-lg" />}
                      {!category.icon && <Package2 className="h-10 w-10 text-white drop-shadow-lg" />}
                    </div>
                    <span className="font-bold text-center text-sm relative z-10" style={{ color: category.color }}>
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Produits</h3>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all border border-primary/20 hover:border-primary/40 font-semibold hover:shadow-lg hover:shadow-primary/20"
            >
              ← Retour
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {!products || products.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Aucun produit
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product, index) => (
                  <button
                    key={product.id}
                    onClick={() => onProductSelect(product)}
                    className="p-4 rounded-xl backdrop-blur-sm bg-background/60 hover:bg-primary/10 border border-border/50 hover:border-primary/40 transition-all text-left group hover:shadow-lg animate-scale-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{product.name}</div>
                    <div className="text-xs text-muted-foreground mb-2">{product.barcode}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold text-lg">{product.price.toFixed(2)}€</span>
                      {product.stock !== null && product.stock !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock > (product.min_stock || 0) ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                          {product.stock}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
