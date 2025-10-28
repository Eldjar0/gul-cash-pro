import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Edit, Package, Scan, SlidersHorizontal, X } from 'lucide-react';
import { useAdvancedSearchProducts, useSuppliers } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MobileBarcodeScanner } from './MobileBarcodeScanner';
import { MobileLayout } from './MobileLayout';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

export const MobileProductManager = () => {
  const { goToProduct, goToProductCreate } = useMobileNavigation();
  const { data: categories = [] } = useCategories();
  const { data: suppliers = [] } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');
  const [priceMin, setPriceMin] = useState<number | undefined>();
  const [priceMax, setPriceMax] = useState<number | undefined>();
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stockMin, setStockMin] = useState<number | undefined>();
  const [stockMax, setStockMax] = useState<number | undefined>();
  const [productType, setProductType] = useState<'unit' | 'weight' | undefined>();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: products = [] } = useAdvancedSearchProducts({
    searchTerm,
    priceMin,
    priceMax,
    supplier: selectedSupplier,
    categoryId: selectedCategory,
    stockMin,
    stockMax,
    type: productType
  });

  const activeFiltersCount = [
    priceMin !== undefined,
    priceMax !== undefined,
    selectedSupplier,
    selectedCategory,
    stockMin !== undefined,
    stockMax !== undefined,
    productType
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchTerm('');
    setPriceMin(undefined);
    setPriceMax(undefined);
    setSelectedSupplier('');
    setSelectedCategory('');
    setStockMin(undefined);
    setStockMax(undefined);
    setProductType(undefined);
  };

  return (
    <MobileLayout
      title="Produits"
      actions={
        <>
          <Button 
            size="icon"
            onClick={() => setScannerOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Scan className="h-5 w-5" />
          </Button>
          <Button 
            size="icon"
            onClick={() => goToProductCreate()}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </>
      }
    >
      <div className="p-4 space-y-4">
        {/* Barre de recherche avec bouton filtres */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative shrink-0">
                <SlidersHorizontal className="h-5 w-5" />
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="h-[85vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  Filtres avancés
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Réinitialiser
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="h-[calc(85vh-100px)] mt-4">
                <div className="space-y-6 p-4">
                  {/* Filtre Prix */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Prix (€)</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceMin ?? ''}
                        onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex-1"
                        step="0.01"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceMax ?? ''}
                        onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex-1"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Filtre Fournisseur */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Fournisseur</Label>
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les fournisseurs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous les fournisseurs</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier} value={supplier}>
                            {supplier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtre Catégorie */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Catégorie</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Toutes les catégories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtre Stock */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Stock</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={stockMin ?? ''}
                        onChange={(e) => setStockMin(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={stockMax ?? ''}
                        onChange={(e) => setStockMax(e.target.value ? Number(e.target.value) : undefined)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Filtre Type */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Type de produit</Label>
                    <Select 
                      value={productType || ''} 
                      onValueChange={(value) => setProductType(value ? value as 'unit' | 'weight' : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous les types</SelectItem>
                        <SelectItem value="unit">Unité</SelectItem>
                        <SelectItem value="weight">Poids</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <Button 
                  className="w-full" 
                  onClick={() => setFiltersOpen(false)}
                >
                  Appliquer les filtres
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Badges des filtres actifs */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {priceMin !== undefined && (
              <Badge variant="secondary" className="gap-1">
                Prix min: {priceMin}€
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setPriceMin(undefined)}
                />
              </Badge>
            )}
            {priceMax !== undefined && (
              <Badge variant="secondary" className="gap-1">
                Prix max: {priceMax}€
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setPriceMax(undefined)}
                />
              </Badge>
            )}
            {selectedSupplier && (
              <Badge variant="secondary" className="gap-1">
                {selectedSupplier}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setSelectedSupplier('')}
                />
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {categories.find(c => c.id === selectedCategory)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setSelectedCategory('')}
                />
              </Badge>
            )}
            {stockMin !== undefined && (
              <Badge variant="secondary" className="gap-1">
                Stock min: {stockMin}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setStockMin(undefined)}
                />
              </Badge>
            )}
            {stockMax !== undefined && (
              <Badge variant="secondary" className="gap-1">
                Stock max: {stockMax}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setStockMax(undefined)}
                />
              </Badge>
            )}
            {productType && (
              <Badge variant="secondary" className="gap-1">
                {productType === 'unit' ? 'Unité' : 'Poids'}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setProductType(undefined)}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Liste des produits */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-3">
            {products.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit'}
                </p>
              </Card>
            ) : (
              products.map((product) => {
                const category = categories.find(c => c.id === product.category_id);
                const isLowStock = product.stock !== undefined && 
                                  product.min_stock !== undefined && 
                                  product.stock > 0 &&
                                  product.stock <= product.min_stock;
                const isOutOfStock = product.stock === 0;

                return (
                  <Card 
                    key={product.id} 
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => goToProduct(product.id)}
                  >
                    <div className="flex gap-3">
                      {/* Image du produit */}
                      {product.image ? (
                        <div className="shrink-0 w-20 h-20 rounded overflow-hidden border border-border">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="shrink-0 w-20 h-20 rounded bg-muted flex items-center justify-center border border-border">
                          <Package className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-base">{product.name}</h3>
                            {category && (
                              <Badge variant="secondary" className="mt-1">
                                {category.name}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToProduct(product.id);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Prix:</span>
                            <span className="font-bold text-base">{product.price.toFixed(2)}€</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Stock:</span>
                            <Badge 
                              variant={isOutOfStock ? 'destructive' : isLowStock ? 'outline' : 'default'}
                            >
                              {product.stock || 0} {product.unit || 'unités'}
                            </Badge>
                          </div>
                          {product.barcode && (
                            <div className="text-xs text-muted-foreground font-mono pt-1">
                              {product.barcode}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Scanner */}
      <MobileBarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onProductFound={(product) => {
          setScannerOpen(false);
          goToProduct(product.id);
        }}
        onProductNotFound={(barcode) => {
          setScannerOpen(false);
          goToProductCreate(barcode);
        }}
      />
    </MobileLayout>
  );
};

export default MobileProductManager;

