import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';
import { useProductsByCategory } from '@/hooks/useProducts';
import { useState } from 'react';
import { Product } from '@/hooks/useProducts';
import { ChevronLeft, Package2 } from 'lucide-react';
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
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-1"></div>
          <p className="text-xs text-muted-foreground">CHARGEMENT...</p>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-4 text-center">
        <Package2 className="h-8 w-8 mx-auto mb-1 text-muted-foreground" />
        <p className="text-muted-foreground text-xs">AUCUNE CATÉGORIE</p>
      </div>
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
      <div className="space-y-0.5 md:space-y-1.5">
        <Button 
          onClick={handleBack}
          className="w-full h-7 md:h-8 bg-muted hover:brightness-110 text-foreground font-bold border border-border transition-all duration-100 rounded-lg active:brightness-90 shadow-sm text-[10px] md:text-xs cursor-pointer touch-action-manipulation"
        >
          <ChevronLeft className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
          RETOUR
        </Button>

        <div className="grid grid-cols-2 gap-0.5 md:gap-1.5">
          {products.map((product) => (
            <Button
              key={product.id}
              onClick={() => onProductSelect(product)}
              className="h-12 md:h-16 flex flex-col justify-center items-center p-1 md:p-2 hover:shadow-lg border-2 hover:brightness-110 transition-all duration-100 rounded-lg active:brightness-90 shadow-sm cursor-pointer touch-action-manipulation"
              style={{
                backgroundColor: `${currentCategory?.color}15`,
                borderColor: currentCategory?.color || 'hsl(210, 100%, 50%)',
              }}
            >
              <span className="font-bold text-[9px] md:text-xs text-center line-clamp-2 mb-0.5 md:mb-1 leading-tight text-foreground">
                {product.name}
              </span>
              <span className="text-[9px] md:text-xs font-black" style={{ color: currentCategory?.color }}>
                {product.price.toFixed(2)}€/{product.unit || 'u'}
              </span>
            </Button>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-4">
            <Package2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground text-xs">AUCUN PRODUIT</p>
          </div>
        )}
      </div>
    );
  }

  return (
      <div className="space-y-0.5 md:space-y-1.5 animate-fade-in">
      {categories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className="w-full h-10 md:h-12 flex items-center justify-start gap-1.5 md:gap-2 px-2 md:px-3 text-white font-bold transition-all duration-100 rounded-lg hover:brightness-110 active:brightness-90 shadow-md hover:shadow-lg cursor-pointer touch-action-manipulation"
          style={{ backgroundColor: category.color }}
        >
          {category.icon && (
            <div className="p-1 md:p-1.5 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center flex-shrink-0" style={{ minWidth: '24px', minHeight: '24px', width: '24px', height: '24px' }}>
              <DynamicIcon name={category.icon} size={14} className="flex-shrink-0" />
            </div>
          )}
          <span className="text-[10px] md:text-xs uppercase tracking-wide truncate">
            {category.name}
          </span>
        </Button>
      ))}
    </div>
  );
}
