import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  QrCode,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Save,
  Boxes,
  Tag,
} from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { MobilePhysicalScanDialog } from '@/components/pos/MobilePhysicalScanDialog';
import { toast } from 'sonner';
import logoJlprod from '@/assets/logo-jlprod-new.png';

export default function MobileManagement() {
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [view, setView] = useState<'menu' | 'products' | 'product-form' | 'stock'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProductForStock, setSelectedProductForStock] = useState<any>(null);
  const [stockAdjustment, setStockAdjustment] = useState('');
  
  // Physical scan detection states
  const [physicalScanDialogOpen, setPhysicalScanDialogOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  
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

  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    if (!searchTerm) return true;
    return product.name.toLowerCase().includes(searchLower) || 
           product.barcode?.toLowerCase().includes(searchLower);
  });

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
        vat_rate: '6',
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

  // Normalisation AZERTY → chiffres
  const normalizeBarcode = (raw: string): string => {
    const azertyMap: Record<string, string> = {
      '&': '1', '!': '1', 'é': '2', '@': '2', '"': '3', '#': '3', 
      "'": '4', '$': '4', '(': '5', '%': '5', '-': '6', '^': '6',
      'è': '7', '_': '8', '*': '8', 'ç': '9', 
      'à': '0', ')': '0', '§': '6'
    };
    const normalized = raw.split('').map(c => azertyMap[c] ?? c).join('');
    return normalized.replace(/\D+/g, '');
  };

  // Gestion du scan physique
  const handlePhysicalScan = (raw: string) => {
    const normalized = normalizeBarcode(raw.trim());
    const normalizedDigits = normalized.replace(/\D+/g, '');
    
    if (!normalized || normalized.length < 3) return;

    // Recherche du produit
    let found = products?.find(
      (p) => p.barcode && normalizeBarcode(p.barcode).toLowerCase() === normalized.toLowerCase()
    );

    if (!found && normalizedDigits.length >= 3) {
      found = products?.find(
        (p) => p.barcode && p.barcode.replace(/\D+/g, '') === normalizedDigits
      );
    }

    const barcodeToUse = normalizedDigits.length >= 3 ? normalizedDigits : normalized;
    
    // Ouvrir le dialog avec le résultat
    setScannedBarcode(barcodeToUse);
    setScannedProduct(found || null);
    setPhysicalScanDialogOpen(true);
  };

  // Gestionnaires du dialog de scan physique
  const handlePhysicalScanAddToForm = () => {
    if (scannedProduct) {
      handleOpenProductForm(scannedProduct);
    } else {
      // Nouveau produit avec code-barres pré-rempli
      setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
      setView('product-form');
    }
  };

  const handlePhysicalScanViewProduct = () => {
    if (scannedProduct) {
      handleOpenProductForm(scannedProduct);
    }
  };

  const handlePhysicalScanCreateProduct = () => {
    setFormData(prev => ({ ...prev, barcode: scannedBarcode, vat_rate: '6' }));
    setView('product-form');
    setPhysicalScanDialogOpen(false);
  };

  const handlePhysicalScanAdjustStock = () => {
    if (scannedProduct) {
      setSelectedProductForStock(scannedProduct);
      setView('stock');
      setPhysicalScanDialogOpen(false);
    }
  };

  const handlePhysicalScanChangeCategory = () => {
    if (scannedProduct) {
      handleOpenProductForm(scannedProduct);
      setPhysicalScanDialogOpen(false);
    }
  };

  const handlePhysicalScanCreatePromotion = () => {
    if (scannedProduct) {
      navigate('/mobile/promotions');
      setPhysicalScanDialogOpen(false);
    }
  };

  const handlePhysicalScanChangeBarcode = () => {
    if (scannedProduct) {
      handleOpenProductForm(scannedProduct);
      setPhysicalScanDialogOpen(false);
    }
  };

  // Détection ultra-robuste des scans de lecteur code-barres (HID)
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = 0;
    let isScanning = false;
    let timeoutId: NodeJS.Timeout | null = null;
    let scanStartTime = 0;

    const isEditableField = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      
      // Check if the target element itself is an input field
      let element: HTMLElement | null = target;
      while (element) {
        if (element.hasAttribute('data-scan-ignore')) {
          return true;
        }
        element = element.parentElement;
      }
      
      const tagName = target.tagName.toLowerCase();
      const isContentEditable = target.isContentEditable;
      const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
      
      return isInput || isContentEditable;
    };

    const mapEventToDigit = (e: KeyboardEvent): string | null => {
      const code = e.code;

      if (code && code.startsWith('Digit')) {
        const d = code.replace('Digit', '');
        return /^[0-9]$/.test(d) ? d : null;
      }

      if (code && code.startsWith('Numpad')) {
        const d = code.replace('Numpad', '');
        return /^[0-9]$/.test(d) ? d : null;
      }

      if (!code && /^[0-9]$/.test(e.key)) {
        return e.key;
      }

      return null;
    };

    const processScan = () => {
      if (buffer.length >= 3) {
        const duration = Date.now() - scanStartTime;
        console.log('[MOBILE SCAN] Processing:', buffer, `(${duration}ms, ${buffer.length} chars)`);
        handlePhysicalScan(buffer);
      }
      buffer = "";
      isScanning = false;
      scanStartTime = 0;
    };

    const handler = (e: KeyboardEvent) => {
      if (document.hidden) return;

      const now = Date.now();
      const delta = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'NumpadEnter') {
        if (isScanning && buffer.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          if (timeoutId) clearTimeout(timeoutId);
          processScan();
        }
        return;
      }

      if (e.key.length === 1) {
        if (!isScanning && delta > 400 && buffer.length > 0) {
          buffer = "";
          isScanning = false;
          scanStartTime = 0;
        }

        const digit = mapEventToDigit(e);

        if (buffer.length === 0) {
          if (isEditableField(e.target)) {
            return;
          }
          if (digit !== null) {
            scanStartTime = now;
            isScanning = true;
            e.preventDefault();
            e.stopPropagation();
            console.log('[MOBILE SCAN] Start detected, code:', e.code, '→ digit:', digit);
            buffer += digit;
          } else {
            return;
          }
        } else {
          if (digit !== null) {
            if (buffer.length === 1 && delta < 50) {
              isScanning = true;
            }
            buffer += digit;
            e.preventDefault();
            e.stopPropagation();
          } else {
            e.preventDefault();
            e.stopPropagation();
          }
        }

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (buffer.length >= 8) {
            processScan();
          }
        }, 500);
      }
    };

    document.addEventListener('keydown', handler, true);
    return () => {
      document.removeEventListener('keydown', handler, true);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [products]);

  // Menu Principal
  if (view === 'menu') {
    const lowStock = products.filter(p => 
      p.stock !== undefined && p.min_stock !== undefined && p.stock > 0 && p.stock <= p.min_stock
    ).length;
    const outOfStock = products.filter(p => p.stock === 0).length;

    return (
      <>
        <MobilePhysicalScanDialog
          open={physicalScanDialogOpen}
          onOpenChange={setPhysicalScanDialogOpen}
          barcode={scannedBarcode}
          product={scannedProduct}
          onEditProduct={handlePhysicalScanAddToForm}
          onAdjustStock={handlePhysicalScanAdjustStock}
          onCreateProduct={handlePhysicalScanCreateProduct}
          onChangeCategory={handlePhysicalScanChangeCategory}
          onCreatePromotion={handlePhysicalScanCreatePromotion}
          onChangeBarcode={handlePhysicalScanChangeBarcode}
        />
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4">
        <div className="max-w-md mx-auto space-y-6 pb-20">
          {/* Reload button */}
          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.reload()}
              className="opacity-50 hover:opacity-100"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Header */}
          <div className="text-center space-y-2">
            <img 
              src={logoJlprod} 
              alt="JL Prod" 
              className="w-full h-auto max-w-[200px] mx-auto mb-4" 
            />
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
              onClick={() => setView('products')}
              className="w-full h-16 bg-accent hover:bg-accent/90 text-lg font-bold"
              size="lg"
              variant="secondary"
            >
              <Package className="h-6 w-6 mr-3" />
              Gérer les Produits
            </Button>

            <Button
              onClick={() => navigate('/mobile/categories')}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold border-0"
              size="lg"
            >
              <FolderKanban className="h-6 w-6 mr-3" />
              Gérer les Catégories
            </Button>

            <Button
              onClick={() => navigate('/mobile/promotions')}
              className="w-full h-16 bg-accent hover:bg-accent/90 text-lg font-bold"
              size="lg"
              variant="outline"
            >
              <Tag className="h-6 w-6 mr-3" />
              Gérer les Promotions
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
      </>
    );
  }

  // Liste des produits
  if (view === 'products') {
    return (
      <>
        <MobilePhysicalScanDialog
          open={physicalScanDialogOpen}
          onOpenChange={setPhysicalScanDialogOpen}
          barcode={scannedBarcode}
          product={scannedProduct}
          onEditProduct={handlePhysicalScanAddToForm}
          onAdjustStock={handlePhysicalScanAdjustStock}
          onCreateProduct={handlePhysicalScanCreateProduct}
          onChangeCategory={handlePhysicalScanChangeCategory}
          onCreatePromotion={handlePhysicalScanCreatePromotion}
          onChangeBarcode={handlePhysicalScanChangeBarcode}
        />
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
      </>
    );
  }

  // Formulaire produit
  if (view === 'product-form') {
    return (
      <>
        <MobilePhysicalScanDialog
          open={physicalScanDialogOpen}
          onOpenChange={setPhysicalScanDialogOpen}
          barcode={scannedBarcode}
          product={scannedProduct}
          onEditProduct={handlePhysicalScanAddToForm}
          onAdjustStock={handlePhysicalScanAdjustStock}
          onCreateProduct={handlePhysicalScanCreateProduct}
          onChangeCategory={handlePhysicalScanChangeCategory}
          onCreatePromotion={handlePhysicalScanCreatePromotion}
          onChangeBarcode={handlePhysicalScanChangeBarcode}
        />
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
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="Scannez ou saisissez le code-barres"
                className="w-full"
                data-scan-ignore="true"
              />
              <p className="text-xs text-muted-foreground">
                Le scanner physique détectera automatiquement les codes-barres
              </p>
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
                  <SelectItem value="6">6%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="21">21%</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Par défaut: 6%
              </p>
            </div>

            <Button type="submit" className="w-full h-12 mt-6" size="lg">
              <Save className="h-5 w-5 mr-2" />
              {editingProduct ? 'Enregistrer' : 'Créer'}
            </Button>
          </form>
        </ScrollArea>
      </div>
      </>
    );
  }

  // Ajustement de stock
  if (view === 'stock' && selectedProductForStock) {
    return (
      <>
        <MobilePhysicalScanDialog
          open={physicalScanDialogOpen}
          onOpenChange={setPhysicalScanDialogOpen}
          barcode={scannedBarcode}
          product={scannedProduct}
          onEditProduct={handlePhysicalScanAddToForm}
          onAdjustStock={handlePhysicalScanAdjustStock}
          onCreateProduct={handlePhysicalScanCreateProduct}
          onChangeCategory={handlePhysicalScanChangeCategory}
          onCreatePromotion={handlePhysicalScanCreatePromotion}
          onChangeBarcode={handlePhysicalScanChangeBarcode}
        />
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
      </>
    );
  }

  return null;
}
