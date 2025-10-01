import { Button } from '@/components/ui/button';
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
      <div className="space-y-3">
        <Button 
          onClick={handleBack}
          className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border-2 border-[#444] font-mono"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          RETOUR
        </Button>

        <div className="grid grid-cols-2 gap-2">
          {products.map((product) => (
            <Button
              key={product.id}
              onClick={() => onProductSelect(product)}
              className="h-20 flex flex-col justify-center items-center p-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border-2 hover:border-pos-success/50 transition-all font-mono"
              style={{ 
                borderColor: currentCategory?.color || '#444',
              }}
            >
              <span className="font-bold text-xs text-center line-clamp-2 mb-1">
                {product.name}
              </span>
              <span className="text-pos-success text-sm font-bold">
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 p-1 pt-2 animate-fade-in">
      {categories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className="group relative h-24 sm:h-28 flex flex-col justify-center items-center gap-2 text-white font-bold border-2 transition-all duration-300 font-mono hover:scale-[1.02] active:scale-[0.98] overflow-hidden rounded-xl"
          style={{ 
            backgroundColor: category.color,
            borderColor: category.color,
            boxShadow: `0 4px 20px -4px ${category.color}80`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/20 via-transparent to-black/10 transition-opacity duration-300" />
          
          <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
            <span className="text-2xl sm:text-3xl">{category.icon || '📦'}</span>
          </div>
          
          <span className="text-[10px] sm:text-xs relative z-10 tracking-wider uppercase font-semibold px-3 py-1 bg-black/30 backdrop-blur-sm rounded-full">
            {category.name}
          </span>
        </Button>
      ))}
    </div>
  );
}
