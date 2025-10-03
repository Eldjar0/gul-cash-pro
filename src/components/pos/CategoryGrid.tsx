import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';
import { useProductsByCategory } from '@/hooks/useProducts';
import { useState } from 'react';
import { Product } from '@/hooks/useProducts';
import { ChevronLeft, Package2, Tag } from 'lucide-react';
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
        <div className="text-center space-y-3">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Package2 className="h-5 w-5 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Chargement des catégories...</p>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-muted/50 rounded-2xl mb-4">
          <Package2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Aucune catégorie</h3>
        <p className="text-sm text-muted-foreground">Ajoutez des catégories pour organiser vos produits</p>
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
      <div className="space-y-2 animate-fade-in">
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-2 p-1.5 bg-gradient-to-r from-card to-muted/30 rounded-lg border border-border shadow-sm">
          <Button 
            onClick={handleBack}
            className="h-7 px-2 bg-card hover:bg-muted text-foreground font-bold border border-border transition-all duration-200 rounded-md hover:scale-105 active:scale-95 shadow-sm text-xs"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Retour
          </Button>
          <div className="flex items-center gap-1.5 flex-1">
            {currentCategory?.icon && (
              <div 
                className="p-1.5 rounded-md shadow-sm"
                style={{ backgroundColor: `${currentCategory.color}20`, borderColor: currentCategory.color }}
              >
                <DynamicIcon name={currentCategory.icon} size={14} style={{ color: currentCategory.color }} />
              </div>
            )}
            <div>
              <h2 className="text-xs font-black text-foreground uppercase tracking-tight leading-none">
                {currentCategory?.name}
              </h2>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">{products.length} produit{products.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Grille de produits modernisée */}
        <div className="grid grid-cols-2 gap-1.5">
          {products.map((product, index) => (
            <button
              key={product.id}
              onClick={() => onProductSelect(product)}
              className="group relative overflow-hidden bg-card hover:bg-gradient-to-br hover:from-card hover:to-muted/30 border border-border hover:border-primary/50 rounded-lg p-2 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Badge prix */}
              <div 
                className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md shadow-md backdrop-blur-sm border"
                style={{ 
                  backgroundColor: `${currentCategory?.color}20`,
                  borderColor: `${currentCategory?.color}40`,
                }}
              >
                <div className="text-xs font-black leading-none" style={{ color: currentCategory?.color }}>
                  {product.price.toFixed(2)}€
                </div>
                <div className="text-xs font-medium text-muted-foreground leading-none mt-0.5">
                  /{product.unit || 'u'}
                </div>
              </div>

              {/* Icône produit */}
              <div className="mb-1.5">
                <div 
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md shadow-sm transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${currentCategory?.color}15` }}
                >
                  <Package2 className="h-4 w-4" style={{ color: currentCategory?.color }} />
                </div>
              </div>

              {/* Nom du produit */}
              <h3 className="text-xs font-bold text-foreground leading-tight line-clamp-2 min-h-[1.75rem]">
                {product.name}
              </h3>

              {/* Stock indicator (si disponible) */}
              {product.stock !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  <div className={`w-1 h-1 rounded-full ${product.stock > (product.min_stock || 0) ? 'bg-accent' : 'bg-destructive'}`}></div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {product.stock > 0 ? `${product.stock}` : 'Rupture'}
                  </span>
                </div>
              )}

              {/* Effet de survol */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg"></div>
            </button>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-muted/50 rounded-lg mb-2">
              <Package2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-xs font-bold text-foreground mb-1">Aucun produit</h3>
            <p className="text-xs text-muted-foreground">Cette catégorie ne contient pas encore de produits</p>
          </div>
        )}
      </div>
    );
  }

  // Affichage des catégories
  return (
    <div className="space-y-1.5 animate-fade-in">
      <div className="grid grid-cols-2 gap-1.5">
        {categories.map((category, index) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className="group relative overflow-hidden rounded-lg p-3 transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 border border-transparent hover:border-white/20 animate-fade-in"
            style={{ 
              backgroundColor: category.color,
              animationDelay: `${index * 0.05}s`
            }}
          >
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Contenu */}
            <div className="relative z-10 flex flex-col items-start gap-1.5">
              {/* Icône */}
              {category.icon && (
                <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-md shadow-md group-hover:scale-110 transition-transform duration-300">
                  <DynamicIcon name={category.icon} size={18} className="text-white" />
                </div>
              )}
              
              {/* Nom */}
              <h3 className="text-xs font-black text-white uppercase tracking-wide leading-tight">
                {category.name}
              </h3>
              
              {/* Flèche */}
              <div className="mt-auto">
                <div className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <ChevronLeft className="h-3 w-3 text-white rotate-180" />
                </div>
              </div>
            </div>

            {/* Cercle décoratif */}
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>
          </button>
        ))}
      </div>
    </div>
  );
}
