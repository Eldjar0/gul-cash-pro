import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Search,
  Package,
  RefreshCw,
  Star,
  Filter,
  SortAsc,
  Grid3x3,
  List,
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function MobileProducts() {
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('mobile-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Scanner physique unifié
  useBarcodeScanner({
    onScan: (barcode) => {
      const product = products.find(p => p.barcode === barcode);
      if (product) {
        navigate(`/mobile/product/${product.id}`);
      } else {
        toast.error('Produit non trouvé');
      }
    },
    enabled: true,
    debugMode: false,
  });

  const toggleFavorite = (productId: string) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    
    setFavorites(newFavorites);
    localStorage.setItem('mobile-favorites', JSON.stringify(newFavorites));
    toast.success(favorites.includes(productId) ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  const filteredProducts = products
    .filter((product) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchLower) || 
        product.barcode?.toLowerCase().includes(searchLower);
      
      const matchesCategory = filterCategory === 'all' || product.category_id === filterCategory;
      
      const isLowStock = product.stock !== undefined && 
                        product.min_stock !== undefined && 
                        product.stock > 0 &&
                        product.stock <= product.min_stock;
      const isOutOfStock = product.stock === 0;
      
      const matchesStock = 
        filterStock === 'all' ||
        (filterStock === 'low' && isLowStock) ||
        (filterStock === 'out' && isOutOfStock);
      
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'stock') return (a.stock || 0) - (b.stock || 0);
      return 0;
    });

  return (
    <MobileLayout title="Produits" showBottomNav={true}>
      <div className="p-4 space-y-4">
        {/* Search and Filters */}
        <Card className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-scan-ignore="true"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const options: typeof sortBy[] = ['name', 'price', 'stock'];
                const current = options.indexOf(sortBy);
                setSortBy(options[(current + 1) % options.length]);
              }}
            >
              <SortAsc className="h-4 w-4 mr-1" />
              {sortBy === 'name' ? 'Nom' : sortBy === 'price' ? 'Prix' : 'Stock'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const options: typeof filterStock[] = ['all', 'low', 'out'];
                const current = options.indexOf(filterStock);
                setFilterStock(options[(current + 1) % options.length]);
              }}
            >
              <Filter className="h-4 w-4 mr-1" />
              {filterStock === 'all' ? 'Tous' : filterStock === 'low' ? 'Faible' : 'Rupture'}
            </Button>
          </div>
        </Card>

        {/* Products List */}
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
            {filteredProducts.length === 0 ? (
              <Card className="p-8 text-center col-span-2">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucun produit trouvé</p>
              </Card>
            ) : (
              filteredProducts.map((product) => {
                const category = categories.find(c => c.id === product.category_id);
                const isFavorite = favorites.includes(product.id);
                const isLowStock = product.stock !== undefined && 
                                  product.min_stock !== undefined && 
                                  product.stock > 0 &&
                                  product.stock <= product.min_stock;
                const isOutOfStock = product.stock === 0;

                return (
                  <Card key={product.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold line-clamp-2">{product.name}</h3>
                        {category && (
                          <Badge variant="secondary" className="mt-1">
                            {category.name}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(product.id)}
                      >
                        <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      </Button>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prix:</span>
                        <span className="font-bold">{product.price.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stock:</span>
                        <Badge variant={isOutOfStock ? 'destructive' : isLowStock ? 'outline' : 'default'}>
                          {product.stock || 0}
                        </Badge>
                      </div>
                      {product.barcode && (
                        <div className="text-xs text-muted-foreground">
                          {product.barcode}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => navigate(`/mobile/product/${product.id}`)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Floating Add Button */}
        <Button
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg"
          onClick={() => navigate('/mobile/product/new')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </MobileLayout>
  );
}
