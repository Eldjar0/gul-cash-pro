import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/hooks/useProducts';
import { Package, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface CategoryGridProps {
  onProductSelect: (product: Product) => void;
  onCategorySelect: (categoryId: string | null) => void;
  selectedCategory: string | null;
}

export function CategoryGrid({ onProductSelect, onCategorySelect, selectedCategory }: CategoryGridProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading } = useProducts();

  const filteredProducts = selectedCategory
    ? products?.filter(p => p.category_id === selectedCategory)
    : products;

  const selectedCategoryData = categories?.find(c => c.id === selectedCategory);

  return (
    <div className="flex flex-col gap-2 h-full">
      {!selectedCategory ? (
        // Affichage des catégories
        <ScrollArea className="h-full">
          <div className="grid grid-cols-3 gap-1.5 p-1">
            {categories?.map((category) => (
              <Button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className="min-h-[6rem] h-auto flex flex-col items-center justify-center gap-1.5 p-2 text-white font-semibold transition-all hover:brightness-110"
                style={{ 
                  backgroundColor: category.color,
                  borderColor: category.color,
                  borderWidth: '2px'
                }}
              >
                <Package className="h-5 w-5 shrink-0" />
                <span className="text-xs font-medium text-center line-clamp-2 leading-snug break-words">
                  {category.name}
                </span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      ) : (
        // Affichage des produits de la catégorie sélectionnée
        <div className="flex flex-col h-full gap-2">
          <Button
            onClick={() => onCategorySelect(null)}
            variant="outline"
            className="w-full h-12 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Retour aux catégories</span>
          </Button>
          
          {selectedCategoryData && (
            <div 
              className="p-3 rounded-lg text-white font-semibold"
              style={{ backgroundColor: selectedCategoryData.color }}
            >
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span>{selectedCategoryData.name}</span>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1">
            {productsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-muted-foreground">Chargement...</div>
              </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 p-1">
                {filteredProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    onClick={() => onProductSelect(product)}
                    className="min-h-[6rem] h-auto flex flex-col items-center justify-center gap-1 p-2 hover:bg-primary/10"
                    disabled={product.stock <= 0}
                  >
                    <span className="text-xs font-medium text-center line-clamp-2 leading-snug break-words">
                      {product.name}
                    </span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-bold text-primary">
                        {product.price.toFixed(2)}€
                      </span>
                      {product.stock <= 0 && (
                        <span className="text-[10px] text-destructive font-medium">
                          Rupture
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-muted-foreground">Aucun produit dans cette catégorie</div>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
