import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';
import { useProductsByCategory } from '@/hooks/useProducts';
import { useState } from 'react';
import { Product } from '@/hooks/useProducts';
import { ChevronLeft } from 'lucide-react';

interface CategoryGridProps {
  onProductSelect: (product: Product) => void;
}

export function CategoryGrid({ onProductSelect }: CategoryGridProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const { data: products } = useProductsByCategory(selectedCategoryId);

  if (categoriesLoading) {
    return <div className="text-center py-4">Chargement des catégories...</div>;
  }

  if (!categories || categories.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">
      Aucune catégorie disponible
    </div>;
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleBack = () => {
    setSelectedCategoryId(undefined);
  };

  if (selectedCategoryId && products) {
    return (
      <div className="space-y-3">
        <Button 
          variant="outline" 
          onClick={handleBack}
          className="mb-2"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Retour aux catégories
        </Button>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {products.map((product) => (
            <Button
              key={product.id}
              onClick={() => onProductSelect(product)}
              variant="outline"
              className="h-20 flex flex-col justify-center items-center p-2 hover:scale-105 transition-transform"
              style={{
                borderColor: categories.find(c => c.id === selectedCategoryId)?.color || '#3B82F6',
              }}
            >
              <span className="font-semibold text-sm text-center line-clamp-2">
                {product.name}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {product.price.toFixed(2)}€
              </span>
            </Button>
          ))}
        </div>
        {products.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Aucun produit dans cette catégorie
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {categories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className="h-24 flex flex-col justify-center items-center gap-2 text-white font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
          style={{ backgroundColor: category.color }}
        >
          <span className="text-2xl">{category.icon || '📦'}</span>
          <span className="text-sm">{category.name}</span>
        </Button>
      ))}
    </div>
  );
}
