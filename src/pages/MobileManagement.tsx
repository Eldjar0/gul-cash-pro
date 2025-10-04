import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Search,
  Package,
  FolderKanban,
  ScanBarcode,
  QrCode,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowLeft,
  Save,
  Camera,
  Boxes,
} from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useCategories, useCreateCategory } from '@/hooks/useCategories';
import { toast } from 'sonner';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

export default function MobileManagement() {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createCategory = useCreateCategory();

  const [view, setView] = useState<'menu' | 'products' | 'product-form' | 'category-form' | 'stock'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProductForStock, setSelectedProductForStock] = useState<any>(null);
  const [stockAdjustment, setStockAdjustment] = useState('');
  
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    description: '',
    price: '',
    cost_price: '',
    type: 'unit' as 'unit' | 'weight',
    unit: 'unité',
    category_id: '',
    vat_rate: '21',
    stock: '',
    min_stock: '',
    supplier: '',
    image: '',
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    color: '#22c55e',
    display_order: 0,
  });

  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    if (!searchTerm) return true;
    return product.name.toLowerCase().includes(searchLower) || 
           product.barcode?.toLowerCase().includes(searchLower);
  });

  const handleScanBarcode = async () => {
    try {
      const { camera } = await BarcodeScanner.requestPermissions();
      
      if (camera === 'granted' || camera === 'limited') {
        const result = await BarcodeScanner.scan();
        
        if (result.barcodes && result.barcodes.length > 0) {
          const scannedCode = result.barcodes[0].rawValue;
          if (scannedCode) {
            setFormData(prev => ({ ...prev, barcode: scannedCode }));
            toast.success(`Code-barres scanné: ${scannedCode}`);
          }
        }
      } else {
        toast.error('Permission caméra requise');
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Erreur lors du scan');
    }
  };

  const handleOpenProductForm = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        barcode: product.barcode || '',
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        cost_price: product.cost_price?.toString() || '',
        type: product.type,
        unit: product.unit || 'unité',
        category_id: product.category_id || '',
        vat_rate: product.vat_rate.toString(),
        stock: product.stock?.toString() || '',
        min_stock: product.min_stock?.toString() || '',
        supplier: product.supplier || '',
        image: product.image || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        barcode: '',
        name: '',
        description: '',
        price: '',
        cost_price: '',
        type: 'unit',
        unit: 'unité',
        category_id: '',
        vat_rate: '21',
        stock: '',
        min_stock: '',
        supplier: '',
        image: '',
      });
    }
    setView('product-form');
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast.error('Nom et prix requis');
      return;
    }

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
      vat_rate: parseFloat(formData.vat_rate),
      stock: formData.stock ? parseFloat(formData.stock) : 0,
      min_stock: formData.min_stock ? parseFloat(formData.min_stock) : 0,
      category_id: formData.category_id || undefined,
      is_active: true,
    };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
      } else {
        await createProduct.mutateAsync(productData);
      }
      setView('products');
      toast.success(editingProduct ? 'Produit modifié' : 'Produit créé');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryFormData.name) {
      toast.error('Nom de catégorie requis');
      return;
    }

    try {
      await createCategory.mutateAsync(categoryFormData);
      setView('menu');
      setCategoryFormData({ name: '', description: '', color: '#22c55e', display_order: 0 });
      toast.success('Catégorie créée');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const handleStockAdjust = async () => {
    if (!selectedProductForStock || !stockAdjustment) {
      toast.error('Quantité requise');
      return;
    }

    const newStock = (selectedProductForStock.stock || 0) + parseFloat(stockAdjustment);
    
    try {
      await updateProduct.mutateAsync({
        id: selectedProductForStock.id,
        stock: Math.max(0, newStock),
      });
      setView('menu');
      setSelectedProductForStock(null);
      setStockAdjustment('');
      toast.success('Stock ajusté');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Erreur lors de l\'ajustement');
    }
  };

  // Menu Principal
  if (view === 'menu') {
    const lowStock = products.filter(p => 
      p.stock !== undefined && p.min_stock !== undefined && p.stock > 0 && p.stock <= p.min_stock
    ).length;
    const outOfStock = products.filter(p => p.stock === 0).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4">
        <div className="max-w-md mx-auto space-y-6 pb-20">
          {/* Header */}
          <div className="text-center space-y-2 pt-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-4">
              <Package className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-foreground">Gestion Mobile</h1>
            <p className="text-muted-foreground">{products.length} produits</p>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-gradient-to-br from-category-orange to-category-orange/80 text-white border-0">
              <div className="space-y-1">
                <AlertTriangle className="h-6 w-6 mb-2" />
                <p className="text-2xl font-black">{lowStock}</p>
                <p className="text-xs text-white/80">Stock faible</p>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-destructive to-destructive/80 text-white border-0">
              <div className="space-y-1">
                <TrendingDown className="h-6 w-6 mb-2" />
                <p className="text-2xl font-black">{outOfStock}</p>
                <p className="text-xs text-white/80">Rupture</p>
              </div>
            </Card>
          </div>

          {/* Actions principales */}
          <div className="space-y-3">
            <Button
              onClick={handleScanBarcode}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-lg font-bold"
              size="lg"
            >
              <Camera className="h-6 w-6 mr-3" />
              Scanner Code-Barres
            </Button>

            <Button
              onClick={() => setView('products')}
              className="w-full h-16 bg-accent hover:bg-accent/90 text-lg font-bold"
              size="lg"
              variant="secondary"
            >
              <Package className="h-6 w-6 mr-3" />
              Gérer les Produits
            </Button>

            <Button
              onClick={() => setView('category-form')}
              className="w-full h-16 bg-secondary hover:bg-secondary/90 text-lg font-bold"
              size="lg"
              variant="outline"
            >
              <FolderKanban className="h-6 w-6 mr-3" />
              Créer une Catégorie
            </Button>

            <Button
              onClick={() => handleOpenProductForm()}
              className="w-full h-16 border-2 border-primary text-primary hover:bg-primary/10 text-lg font-bold"
              size="lg"
              variant="outline"
            >
              <Plus className="h-6 w-6 mr-3" />
              Nouveau Produit
            </Button>
          </div>

          {/* Liste rapide des alertes */}
          {(lowStock > 0 || outOfStock > 0) && (
            <Card className="p-4 bg-gradient-to-r from-category-orange/10 to-transparent border-l-4 border-category-orange">
              <div className="space-y-2">
                <p className="font-bold text-sm">⚠️ Actions requises</p>
                {lowStock > 0 && (
                  <p className="text-xs text-muted-foreground">
                    • {lowStock} produit(s) en stock faible
                  </p>
                )}
                {outOfStock > 0 && (
                  <p className="text-xs text-muted-foreground">
                    • {outOfStock} produit(s) en rupture
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Liste des produits
  if (view === 'products') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header fixe */}
        <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setView('menu')}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold flex-1">Produits</h2>
            <Button
              onClick={() => handleOpenProductForm()}
              size="icon"
              className="bg-primary"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Liste scrollable */}
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 space-y-2">
            {filteredProducts.map((product) => {
              const category = categories.find(c => c.id === product.category_id);
              const isLowStock = product.stock !== undefined && 
                                product.min_stock !== undefined && 
                                product.stock > 0 &&
                                product.stock <= product.min_stock;
              const isOutOfStock = product.stock === 0;
              
              return (
                <Card
                  key={product.id}
                  className={`p-4 ${
                    isOutOfStock ? 'border-destructive/50 bg-destructive/5' :
                    isLowStock ? 'border-category-orange/50 bg-category-orange/5' :
                    'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold truncate">{product.name}</h3>
                        {isOutOfStock && (
                          <Badge variant="destructive" className="text-xs">Rupture</Badge>
                        )}
                        {isLowStock && (
                          <Badge variant="secondary" className="text-xs bg-category-orange text-white">Faible</Badge>
                        )}
                      </div>
                      
                      {category && (
                        <Badge 
                          className="text-xs mb-2"
                          style={{ 
                            backgroundColor: category.color + '20',
                            color: category.color,
                            borderColor: category.color
                          }}
                        >
                          {category.name}
                        </Badge>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-bold text-primary">{product.price.toFixed(2)}€</span>
                        <span className="text-muted-foreground">
                          Stock: {product.stock || 0}
                        </span>
                      </div>
                      
                      {product.barcode && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {product.barcode}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleOpenProductForm(product)}
                        size="icon"
                        variant="outline"
                        className="h-9 w-9"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedProductForStock(product);
                          setView('stock');
                        }}
                        size="icon"
                        variant="outline"
                        className="h-9 w-9"
                      >
                        <Boxes className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Formulaire produit
  if (view === 'product-form') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setView('products')}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold">
              {editingProduct ? 'Modifier' : 'Nouveau'} Produit
            </h2>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <form onSubmit={handleSubmitProduct} className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Code-barres</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  placeholder="Code-barres"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleScanBarcode}
                  size="icon"
                  variant="outline"
                >
                  <ScanBarcode className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom du produit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prix de vente *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Prix d'achat</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Stock initial</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock minimum</Label>
                <Input
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>TVA (%)</Label>
              <Select
                value={formData.vat_rate}
                onValueChange={(value) => setFormData(prev => ({ ...prev, vat_rate: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5.5">5.5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="21">21%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full h-12 mt-6" size="lg">
              <Save className="h-5 w-5 mr-2" />
              {editingProduct ? 'Enregistrer' : 'Créer'}
            </Button>
          </form>
        </ScrollArea>
      </div>
    );
  }

  // Formulaire catégorie
  if (view === 'category-form') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setView('menu')}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold">Nouvelle Catégorie</h2>
          </div>
        </div>

        <form onSubmit={handleSubmitCategory} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nom de la catégorie"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={categoryFormData.description}
              onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
            />
          </div>

          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={categoryFormData.color}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-20 h-12"
              />
              <Input
                value={categoryFormData.color}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#22c55e"
                className="flex-1"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 mt-6" size="lg">
            <Save className="h-5 w-5 mr-2" />
            Créer la Catégorie
          </Button>
        </form>
      </div>
    );
  }

  // Ajustement de stock
  if (view === 'stock' && selectedProductForStock) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setView('products');
                setSelectedProductForStock(null);
              }}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold">Ajuster Stock</h2>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">{selectedProductForStock.name}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Stock actuel:</span>
                <span className="text-2xl font-bold">{selectedProductForStock.stock || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Stock minimum:</span>
                <span className="font-bold">{selectedProductForStock.min_stock || 0}</span>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Label>Ajustement (+ ou -)</Label>
            <Input
              type="number"
              value={stockAdjustment}
              onChange={(e) => setStockAdjustment(e.target.value)}
              placeholder="Ex: +10 ou -5"
              className="text-xl h-14 text-center font-bold"
            />

            {stockAdjustment && (
              <Card className="p-4 bg-primary/5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nouveau stock:</span>
                  <span className="text-2xl font-bold text-primary">
                    {Math.max(0, (selectedProductForStock.stock || 0) + parseFloat(stockAdjustment))}
                  </span>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStockAdjustment('-1')}
              >
                -1
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStockAdjustment('+1')}
              >
                +1
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStockAdjustment('+10')}
              >
                +10
              </Button>
            </div>

            <Button
              onClick={handleStockAdjust}
              className="w-full h-14 mt-6"
              size="lg"
              disabled={!stockAdjustment}
            >
              <Save className="h-5 w-5 mr-2" />
              Valider l'Ajustement
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
