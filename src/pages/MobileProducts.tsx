import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  X,
} from 'lucide-react';
import { useAdvancedSearchProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useSuppliers } from '@/hooks/useSuppliers';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function MobileProducts() {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { data: suppliers = [] } = useSuppliers();

  // Advanced search filters
  const [searchTerm, setSearchTerm] = useState('');
  const [priceMin, setPriceMin] = useState<number | undefined>();
  const [priceMax, setPriceMax] = useState<number | undefined>();
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockMin, setStockMin] = useState<number | undefined>();
  const [stockMax, setStockMax] = useState<number | undefined>();
  const [selectedType, setSelectedType] = useState<'unit' | 'weight' | ''>('');
  
  // UI states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('mobile-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Use advanced search hook
  const { data: products = [] } = useAdvancedSearchProducts({
    searchTerm,
    priceMin,
    priceMax,
    supplier: selectedSupplier,
    categoryId: selectedCategory,
    stockMin,
    stockMax,
    type: selectedType || undefined,
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

  const resetFilters = () => {
    setSearchTerm('');
    setPriceMin(undefined);
    setPriceMax(undefined);
    setSelectedSupplier('');
    setSelectedCategory('all');
    setStockMin(undefined);
    setStockMax(undefined);
    setSelectedType('');
    toast.success('Filtres réinitialisés');
  };

  const activeFiltersCount = [
    priceMin !== undefined,
    priceMax !== undefined,
    selectedSupplier !== '',
    selectedCategory !== 'all',
    stockMin !== undefined,
    stockMax !== undefined,
    selectedType !== '',
  ].filter(Boolean).length;

  const sortedProducts = [...products].sort((a, b) => {
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

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <Filter className="h-4 w-4 mr-1" />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh]">
                <SheetHeader>
                  <SheetTitle>Filtres avancés</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(85vh-100px)] mt-4">
                  <div className="space-y-6 pr-4">
                    {/* Price Range */}
                    <div className="space-y-2">
                      <Label>Prix</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Min (€)</Label>
                          <Input
                            type="number"
                            placeholder="Min"
                            value={priceMin ?? ''}
                            onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
                            data-scan-ignore="true"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Max (€)</Label>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={priceMax ?? ''}
                            onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
                            data-scan-ignore="true"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Supplier */}
                    <div className="space-y-2">
                      <Label>Fournisseur</Label>
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les fournisseurs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous</SelectItem>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.name}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les catégories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Stock Range */}
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Min</Label>
                          <Input
                            type="number"
                            placeholder="Min"
                            value={stockMin ?? ''}
                            onChange={(e) => setStockMin(e.target.value ? Number(e.target.value) : undefined)}
                            data-scan-ignore="true"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Max</Label>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={stockMax ?? ''}
                            onChange={(e) => setStockMax(e.target.value ? Number(e.target.value) : undefined)}
                            data-scan-ignore="true"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Product Type */}
                    <div className="space-y-2">
                      <Label>Type de produit</Label>
                      <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous</SelectItem>
                          <SelectItem value="unit">Unité</SelectItem>
                          <SelectItem value="weight">Poids</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={resetFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                  <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                    Appliquer
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters Badges */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {priceMin !== undefined && (
                <Badge variant="secondary" className="gap-1">
                  Prix min: {priceMin}€
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceMin(undefined)} />
                </Badge>
              )}
              {priceMax !== undefined && (
                <Badge variant="secondary" className="gap-1">
                  Prix max: {priceMax}€
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceMax(undefined)} />
                </Badge>
              )}
              {selectedSupplier && (
                <Badge variant="secondary" className="gap-1">
                  {selectedSupplier}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSupplier('')} />
                </Badge>
              )}
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find(c => c.id === selectedCategory)?.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('all')} />
                </Badge>
              )}
              {stockMin !== undefined && (
                <Badge variant="secondary" className="gap-1">
                  Stock min: {stockMin}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setStockMin(undefined)} />
                </Badge>
              )}
              {stockMax !== undefined && (
                <Badge variant="secondary" className="gap-1">
                  Stock max: {stockMax}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setStockMax(undefined)} />
                </Badge>
              )}
              {selectedType && (
                <Badge variant="secondary" className="gap-1">
                  {selectedType === 'unit' ? 'Unité' : 'Poids'}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedType('')} />
                </Badge>
              )}
            </div>
          )}
        </Card>

        {/* Products List */}
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
            {sortedProducts.length === 0 ? (
              <Card className="p-8 text-center col-span-2">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucun produit trouvé</p>
              </Card>
            ) : (
              sortedProducts.map((product) => {
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
