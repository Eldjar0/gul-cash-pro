import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCategories } from '@/hooks/useCategories';
import { useProductsByCategory } from '@/hooks/useProducts';
import { useState } from 'react';
import { Product } from '@/hooks/useProducts';
import { ChevronLeft, Package2 } from 'lucide-react';

interface CategoryGridProps {
  onProductSelect: (product: Product) => void;
}

export function CategoryGrid({ onProductSelect }: CategoryGridProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const { data: products } = useProductsByCategory(selectedCategoryId);

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Package2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">Aucune catégorie disponible</p>
      </Card>
    );
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleBack = () => {
    setSelectedCategoryId(undefined);
  };

  if (selectedCategoryId && products) {
    const currentCategory = categories.find(c => c.id === selectedCategoryId);
    
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="gap-2 hover-glow"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentCategory?.icon || '📦'}</span>
            <h3 className="font-bold text-lg">{currentCategory?.name}</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((product) => (
            <Card
              key={product.id}
              onClick={() => onProductSelect(product)}
              className="relative p-4 cursor-pointer group overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-glow hover:-translate-y-1 animate-scale-in"
            >
              <div className="absolute inset-0 bg-[var(--gradient-glow)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex flex-col items-center justify-center gap-2 min-h-20">
                  <span className="font-bold text-sm text-center line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                    {product.name}
                  </span>
                  <span className="text-lg font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {product.price.toFixed(2)}€
                  </span>
                  {product.type === 'weight' && (
                    <span className="text-xs text-muted-foreground">au kg</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <Card className="p-12 text-center">
            <Package2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Aucun produit dans cette catégorie</p>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
      {categories.map((category) => (
        <Card
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className="relative h-32 cursor-pointer group overflow-hidden border-2 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-glow-lg"
          style={{ 
            background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative h-full flex flex-col items-center justify-center gap-3 p-4">
            <span className="text-4xl drop-shadow-lg">{category.icon || '📦'}</span>
            <span className="text-white font-bold text-base text-center drop-shadow-md">
              {category.name}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
