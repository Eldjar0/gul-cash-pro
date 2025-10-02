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
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pos-success mx-auto mb-2"></div>
          <p className="text-xs text-gray-500 font-mono">CHARGEMENT...</p>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-6 text-center">
        <Package2 className="h-10 w-10 mx-auto mb-2 text-gray-600" />
        <p className="text-gray-500 text-sm font-mono">AUCUNE CATÉGORIE</p>
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
      <div className="space-y-2">
        <Button 
          onClick={handleBack}
          className="w-full h-10 bg-muted hover:bg-muted/80 text-foreground font-bold border border-border transition-all duration-200 rounded-xl active:scale-95 shadow-sm text-xs"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          RETOUR
        </Button>

        <div className="grid grid-cols-2 gap-2">
          {products.map((product) => (
            <Button
              key={product.id}
              onClick={() => onProductSelect(product)}
              className="h-20 flex flex-col justify-center items-center p-2 bg-white hover:shadow-lg text-foreground border hover:scale-[1.03] transition-all duration-200 rounded-xl active:scale-95 shadow-md group"
              style={{ 
                borderColor: currentCategory?.color || 'hsl(210, 100%, 50%)',
              }}
            >
              <div className="p-1.5 rounded-lg mb-1 transition-colors" style={{ backgroundColor: `${currentCategory?.color}20` }}>
                <Package2 className="h-4 w-4" style={{ color: currentCategory?.color }} />
              </div>
              <span className="font-bold text-xs text-center line-clamp-2 mb-0.5 leading-tight">
                {product.name}
              </span>
              <span className="text-primary text-sm font-black">
                {product.price.toFixed(2)}€
              </span>
            </Button>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-8">
            <Package2 className="h-12 w-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-500 font-mono text-sm">AUCUN PRODUIT</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-fade-in">
      {categories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className="w-full h-16 flex items-center justify-start gap-3 px-4 text-white font-bold transition-all duration-200 rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
          style={{ backgroundColor: category.color }}
        >
          {category.icon && (
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <DynamicIcon name={category.icon} size={20} className="flex-shrink-0" />
            </div>
          )}
          <span className="text-sm uppercase tracking-wide">
            {category.name}
          </span>
        </Button>
      ))}
    </div>
  );
}
