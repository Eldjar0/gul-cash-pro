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
          className="w-full text-white border-0 font-bold shadow-xl hover:shadow-2xl hover:shadow-primary/50 hover:scale-[1.03] transition-all duration-300 rounded-xl group"
          style={{ background: 'linear-gradient(135deg, hsl(217, 91%, 60%), hsl(262, 83%, 58%))' }}
        >
          <ChevronLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          RETOUR
        </Button>

        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <Button
              key={product.id}
              onClick={() => onProductSelect(product)}
              className="h-28 flex flex-col justify-center items-center p-3 text-gray-900 border-2 hover:scale-105 hover:-translate-y-1 transition-all duration-300 font-semibold rounded-2xl shadow-lg hover:shadow-2xl group bg-gradient-to-br from-white to-blue-50 hover:from-blue-100 hover:to-blue-200"
              style={{ 
                borderColor: currentCategory?.color || 'hsl(217, 91%, 60%)',
              }}
            >
              <span className="font-bold text-sm text-center line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {product.name}
              </span>
              <span className="text-primary text-lg font-black drop-shadow-md group-hover:scale-110 transition-transform">
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
    <div className="flex flex-col bg-gray-100 animate-fade-in">
      {categories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className="h-20 flex flex-col justify-center items-center gap-1 bg-white hover:bg-gray-50 text-gray-800 font-normal transition-colors duration-150 border-b border-gray-200 rounded-none shadow-none"
        >
          <span className="text-2xl">{category.icon || '📦'}</span>
          <span className="text-xs leading-tight text-center">
            {category.name}
          </span>
        </Button>
      ))}
    </div>
  );
}
