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
          className="w-full text-white border-0 font-medium shadow-md hover:scale-[1.02] transition-transform"
          style={{ background: 'linear-gradient(135deg, hsl(217, 91%, 60%), hsl(217, 91%, 50%))' }}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          RETOUR
        </Button>

        <div className="grid grid-cols-2 gap-2.5">
          {products.map((product) => (
            <Button
              key={product.id}
              onClick={() => onProductSelect(product)}
              className="h-24 flex flex-col justify-center items-center p-3 text-white border-2 hover:scale-[1.02] transition-all font-medium rounded-xl shadow-md"
              style={{ 
                background: 'linear-gradient(135deg, rgba(58, 134, 255, 0.1), rgba(58, 134, 255, 0.05))',
                borderColor: currentCategory?.color || 'hsl(217, 91%, 60%)',
              }}
            >
              <span className="font-semibold text-sm text-center line-clamp-2 mb-1.5">
                {product.name}
              </span>
              <span className="text-primary text-base font-bold">
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0 animate-fade-in bg-white border-r border-gray-200">
      {categories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className="h-24 flex flex-col justify-center items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-medium transition-all duration-150 border border-gray-200 rounded-none shadow-none hover:shadow-sm"
        >
          <span className="text-3xl">{category.icon || '📦'}</span>
          <span className="text-[11px] leading-tight text-center px-2">
            {category.name}
          </span>
        </Button>
      ))}
    </div>
  );
}
