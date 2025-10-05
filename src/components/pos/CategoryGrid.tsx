import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/hooks/useProducts';
import { Package, Grid3x3 } from 'lucide-react';
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

  return (
    <div className="flex flex-col gap-2 h-full">
      <Tabs defaultValue="categories" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="flex-1 mt-2 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-3 gap-2 p-1">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => onCategorySelect(null)}
                className="h-20 flex flex-col items-center justify-center gap-1 p-2"
              >
                <Grid3x3 className="h-5 w-5" />
                <span className="text-xs font-medium">Tout</span>
              </Button>
              {categories?.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => onCategorySelect(category.id)}
                  className="h-20 flex flex-col items-center justify-center gap-1 p-2 text-white font-semibold transition-all hover:brightness-110"
                  style={{ 
                    backgroundColor: selectedCategory === category.id 
                      ? category.color 
                      : `${category.color}CC`,
                    borderColor: category.color,
                    borderWidth: '2px'
                  }}
                >
                  <Package className="h-5 w-5" />
                  <span className="text-xs font-medium text-center line-clamp-2">
                    {category.name}
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="products" className="flex-1 mt-2 overflow-hidden">
          <ScrollArea className="h-full">
            {productsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-muted-foreground">Chargement...</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 p-1">
                {filteredProducts?.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    onClick={() => onProductSelect(product)}
                    className="h-20 flex flex-col items-center justify-center gap-1 p-2 hover:bg-primary/10"
                    disabled={product.stock <= 0}
                  >
                    <span className="text-xs font-medium text-center line-clamp-2">
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
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
