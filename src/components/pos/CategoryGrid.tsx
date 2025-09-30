import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Product } from '@/types/pos';
import { MOCK_PRODUCTS } from '@/data/mockProducts';

interface CategoryGridProps {
  onProductSelect: (product: Product, quantity?: number) => void;
}

const categories = [
  { name: 'Boissons', color: 'bg-category-blue', products: [] as Product[] },
  { name: 'Boulangerie', color: 'bg-category-green', products: [] as Product[] },
  { name: 'Fruits', color: 'bg-category-orange', products: [] as Product[] },
  { name: 'Légumes', color: 'bg-category-teal', products: [] as Product[] },
  { name: 'Produits laitiers', color: 'bg-category-purple', products: [] as Product[] },
];

// Organiser les produits par catégorie
categories.forEach((cat) => {
  cat.products = MOCK_PRODUCTS.filter((p) => p.category === cat.name);
});

export function CategoryGrid({ onProductSelect }: CategoryGridProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Catégories de produits</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((category) => (
          <Card
            key={category.name}
            className={`${category.color} p-4 hover:scale-105 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl border-0`}
          >
            <h3 className="text-white font-bold text-center text-sm mb-3">
              {category.name}
            </h3>
            <div className="space-y-2">
              {category.products.slice(0, 3).map((product) => (
                <Button
                  key={product.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => onProductSelect(product, product.type === 'unit' ? 1 : undefined)}
                  className="w-full text-xs h-8 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                >
                  {product.name}
                </Button>
              ))}
              {category.products.length > 3 && (
                <div className="text-xs text-white/80 text-center">
                  +{category.products.length - 3} autres
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
