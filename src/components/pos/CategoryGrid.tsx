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
      <div className="space-y-4 animate-fade-in">
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-card to-muted/30 rounded-2xl border-2 border-border shadow-sm">
          <Button 
            onClick={handleBack}
            className="h-10 px-4 bg-card hover:bg-muted text-foreground font-bold border-2 border-border transition-all duration-200 rounded-xl hover:scale-105 active:scale-95 shadow-md"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-3 flex-1">
            {currentCategory?.icon && (
              <div 
                className="p-3 rounded-xl shadow-md"
                style={{ backgroundColor: `${currentCategory.color}20`, borderColor: currentCategory.color }}
              >
                <DynamicIcon name={currentCategory.icon} size={24} style={{ color: currentCategory.color }} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                {currentCategory?.name}
              </h2>
              <p className="text-sm text-muted-foreground">{products.length} produit{products.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Grille de produits modernisée */}
        <div className="grid grid-cols-2 gap-3">
          {products.map((product, index) => (
            <button
              key={product.id}
              onClick={() => onProductSelect(product)}
              className="group relative overflow-hidden bg-card hover:bg-gradient-to-br hover:from-card hover:to-muted/30 border-2 border-border hover:border-primary/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Badge prix */}
              <div 
                className="absolute top-2 right-2 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-sm border-2"
                style={{ 
                  backgroundColor: `${currentCategory?.color}20`,
                  borderColor: `${currentCategory?.color}40`,
                }}
              >
                <div className="text-lg font-black" style={{ color: currentCategory?.color }}>
                  {product.price.toFixed(2)}€
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  /{product.unit || 'u'}
                </div>
              </div>

              {/* Icône produit */}
              <div className="mb-3">
                <div 
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl shadow-md transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${currentCategory?.color}15` }}
                >
                  <Package2 className="h-6 w-6" style={{ color: currentCategory?.color }} />
                </div>
              </div>

              {/* Nom du produit */}
              <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2 mb-2 min-h-[2.5rem]">
                {product.name}
              </h3>

              {/* Stock indicator (si disponible) */}
              {product.stock !== undefined && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`w-2 h-2 rounded-full ${product.stock > (product.min_stock || 0) ? 'bg-accent' : 'bg-destructive'}`}></div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {product.stock > 0 ? `Stock: ${product.stock}` : 'Rupture'}
                  </span>
                </div>
              )}

              {/* Effet de survol */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>
            </button>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-muted/50 rounded-2xl mb-4">
              <Package2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Aucun produit</h3>
            <p className="text-sm text-muted-foreground">Cette catégorie ne contient pas encore de produits</p>
          </div>
        )}
      </div>
    );
  }

  // Affichage des catégories
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category, index) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 border-2 border-transparent hover:border-white/20 animate-fade-in"
            style={{ 
              backgroundColor: category.color,
              animationDelay: `${index * 0.05}s`
            }}
          >
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Contenu */}
            <div className="relative z-10 flex flex-col items-start gap-3">
              {/* Icône */}
              {category.icon && (
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DynamicIcon name={category.icon} size={28} className="text-white" />
                </div>
              )}
              
              {/* Nom */}
              <h3 className="text-base font-black text-white uppercase tracking-wide leading-tight">
                {category.name}
              </h3>
              
              {/* Flèche */}
              <div className="mt-auto">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <ChevronLeft className="h-4 w-4 text-white rotate-180" />
                </div>
              </div>
            </div>

            {/* Cercle décoratif */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
          </button>
        ))}
      </div>
    </div>
  );
}
