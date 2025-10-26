import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Search, Package, FolderKanban, QrCode, TrendingUp, TrendingDown, AlertTriangle, ArrowLeft, RefreshCw, Save, Boxes, Tag, ShoppingCart, Download, Moon, Sun, Star, Filter, SortAsc, History, Grid3x3, List, Wallet, BarChart3, CheckSquare, Upload, LogOut, Calculator, Camera, Scan } from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/contexts/AuthContext';
import { PRODUCT_UNITS } from '@/data/units';
import { DialogDescription } from '@/components/ui/dialog';
import { MobilePhysicalScanDialog } from '@/components/pos/MobilePhysicalScanDialog';
import { ProductSearchDialog } from '@/components/pos/ProductSearchDialog';
import { MobileBarcodeScanner } from '@/components/mobile/MobileBarcodeScanner';
import { toast } from 'sonner';
import logoJlprod from '@/assets/logo-jlprod-new.png';
export default function MobileManagement() {
  const navigate = useNavigate();
  const {
    data: products = []
  } = useProducts();
  const {
    data: categories = []
  } = useCategories();
  const weather = useWeather();
  const {
    signOut
  } = useAuth();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [view, setView] = useState<'menu' | 'products' | 'product-form' | 'stock'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProductForStock, setSelectedProductForStock] = useState<any>(null);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState('');

  // Physical scan detection states
  const [physicalScanDialogOpen, setPhysicalScanDialogOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [scannedProduct, setScannedProduct] = useState<any>(null);

  // Manual product search dialog
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  // Mobile camera scanner
  const [mobileScannerOpen, setMobileScannerOpen] = useState(false);

  // New features states
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('mobile-dark-mode');
    return saved === 'true';
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('mobile-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    description: '',
    price: '',
    cost_price: '',
    type: 'unit' as 'unit' | 'weight',
    unit: 'pièce',
    category_id: '',
    vat_rate: '21',
    stock: '',
    min_stock: '',
    supplier: '',
    image: ''
  });

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mobile-dark-mode', darkMode.toString());
  }, [darkMode]);

  // Save favorites
  useEffect(() => {
    localStorage.setItem('mobile-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const toggleFavorite = (productId: string) => {
    setFavorites(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    toast.success(favorites.includes(productId) ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };
  const toggleSelection = (productId: string) => {
    setSelectedProducts(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };
  const exportToCSV = () => {
    const headers = ['Code-barres', 'Nom', 'Prix', 'Stock', 'Catégorie'];
    const rows = filteredProducts.map(p => {
      const category = categories.find(c => c.id === p.category_id);
      return [p.barcode || '', p.name, p.price.toFixed(2), p.stock || 0, category?.name || ''].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produits-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV réussi');
  };
  const importFromCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const lines = text.split('\n');
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const [barcode, name, price, stock, categoryName] = lines[i].split(',');
        if (name && price) {
          const category = categories.find(c => c.name.trim() === categoryName?.trim());
          try {
            await createProduct.mutateAsync({
              barcode: barcode?.trim() || undefined,
              name: name.trim(),
              price: parseFloat(price),
              stock: parseFloat(stock || '0'),
              category_id: category?.id,
              vat_rate: 21,
              type: 'unit',
              unit: 'unité',
              is_active: true
            });
            imported++;
          } catch (error) {
            console.error('Error importing product:', name, error);
          }
        }
      }
      toast.success(`${imported} produits importés`);
    };
    input.click();
  };
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie');
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchLower) || product.barcode?.toLowerCase().includes(searchLower);
    const matchesCategory = filterCategory === 'all' || product.category_id === filterCategory;
    const isLowStock = product.stock !== undefined && product.min_stock !== undefined && product.stock > 0 && product.stock <= product.min_stock;
    const isOutOfStock = product.stock === 0;
    const matchesStock = filterStock === 'all' || filterStock === 'low' && isLowStock || filterStock === 'out' && isOutOfStock;
    return matchesSearch && matchesCategory && matchesStock;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'stock') return (a.stock || 0) - (b.stock || 0);
    return 0;
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
        image: product.image || ''
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
        unit: 'pièce',
        category_id: '',
        vat_rate: '21',
        stock: '',
        min_stock: '',
        supplier: '',
        image: ''
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
    if (!formData.category_id) {
      toast.error('La catégorie est obligatoire');
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
      is_active: true
    };
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          ...productData
        });
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
        stock: Math.max(0, newStock)
      });

      // Log the adjustment with reason
      if (stockAdjustmentReason) {
        toast.success(`Stock ajusté: ${stockAdjustmentReason}`);
      } else {
        toast.success('Stock ajusté');
      }
      setView('menu');
      setSelectedProductForStock(null);
      setStockAdjustment('');
      setStockAdjustmentReason('');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Erreur lors de l\'ajustement');
    }
  };
  const handleBulkStockAdjust = async (adjustment: number) => {
    if (selectedProducts.length === 0) {
      toast.error('Aucun produit sélectionné');
      return;
    }
    try {
      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId);
        if (product) {
          const newStock = Math.max(0, (product.stock || 0) + adjustment);
          await updateProduct.mutateAsync({
            id: productId,
            stock: newStock
          });
        }
      }
      toast.success(`${selectedProducts.length} produits ajustés`);
      setSelectedProducts([]);
      setSelectionMode(false);
    } catch (error) {
      console.error('Error bulk adjusting:', error);
      toast.error('Erreur lors de l\'ajustement groupé');
    }
  };

  // Normalisation AZERTY → chiffres
  const normalizeBarcode = (raw: string): string => {
    const azertyMap: Record<string, string> = {
      '&': '1',
      '!': '1',
      'é': '2',
      '@': '2',
      '"': '3',
      '#': '3',
      "'": '4',
      '$': '4',
      '(': '5',
      '%': '5',
      '-': '6',
      '^': '6',
      'è': '7',
      '_': '8',
      '*': '8',
      'ç': '9',
      'à': '0',
      ')': '0',
      '§': '6'
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
    let found = products?.find(p => p.barcode && normalizeBarcode(p.barcode).toLowerCase() === normalized.toLowerCase());
    if (!found && normalizedDigits.length >= 3) {
      found = products?.find(p => p.barcode && p.barcode.replace(/\D+/g, '') === normalizedDigits);
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
      setFormData(prev => ({
        ...prev,
        barcode: scannedBarcode
      }));
      setView('product-form');
    }
  };
  const handlePhysicalScanViewProduct = () => {
    if (scannedProduct) {
      handleOpenProductForm(scannedProduct);
    }
  };
  const handlePhysicalScanCreateProduct = () => {
    setFormData(prev => ({
      ...prev,
      barcode: scannedBarcode,
      vat_rate: '6'
    }));
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
    let timeoutId: NodeJS.Timeout | null = null;
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
    const mapEventToDigit = (e: KeyboardEvent): string => {
      // Sur Android, e.key contient directement le chiffre
      if (/^[0-9]$/.test(e.key)) {
        return e.key;
      }
      const code = e.code;
      if (code && code.startsWith('Digit')) {
        const d = code.replace('Digit', '');
        return /^[0-9]$/.test(d) ? d : '';
      }
      if (code && code.startsWith('Numpad')) {
        const d = code.replace('Numpad', '');
        return /^[0-9]$/.test(d) ? d : '';
      }
      return '';
    };
    const processScan = () => {
      if (buffer.length >= 3) {
        console.log('[MOBILE SCAN] Processing:', buffer, `(${buffer.length} chars)`);
        handlePhysicalScan(buffer);
        toast.success(`Code scanné: ${buffer.substring(0, 4)}...`);
      }
      buffer = "";
    };
    const handler = (e: KeyboardEvent) => {
      const now = Date.now();
      const delta = now - lastKeyTime;
      lastKeyTime = now;

      // Enter termine le scan
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (buffer.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          if (timeoutId) clearTimeout(timeoutId);
          processScan();
        }
        return;
      }

      // Capture uniquement les chiffres
      const digit = mapEventToDigit(e);
      if (!digit) return;

      // Si on est dans un champ éditable, on ignore
      if (buffer.length === 0 && isEditableField(e.target)) {
        return;
      }

      // Reset si trop de temps entre les touches
      if (buffer.length > 0 && delta > 200) {
        buffer = "";
      }

      // Ajouter le chiffre au buffer
      buffer += digit;
      e.preventDefault();
      e.stopPropagation();
      console.log('[MOBILE SCAN] Buffer:', buffer);

      // Auto-traitement après délai ou si assez long
      if (timeoutId) clearTimeout(timeoutId);
      if (buffer.length >= 13) {
        // Code-barres EAN13 complet
        processScan();
      } else {
        timeoutId = setTimeout(() => {
          if (buffer.length >= 3) {
            processScan();
          } else {
            buffer = "";
          }
        }, 150);
      }
    };

    // Capturer en mode capture pour avoir priorité
    window.addEventListener('keydown', handler, true);
    return () => {
      window.removeEventListener('keydown', handler, true);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [products]);

  // Menu Principal
  if (view === 'menu') {
    const lowStock = products.filter(p => p.stock !== undefined && p.min_stock !== undefined && p.stock > 0 && p.stock <= p.min_stock).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalCategories = categories.length;
    const totalStockValue = products.reduce((sum, p) => sum + (p.cost_price || 0) * (p.stock || 0), 0);
    const favoriteProducts = products.filter(p => favorites.includes(p.id));
    return <>
        <MobilePhysicalScanDialog open={physicalScanDialogOpen} onOpenChange={setPhysicalScanDialogOpen} barcode={scannedBarcode} product={scannedProduct} onEditProduct={handlePhysicalScanAddToForm} onAdjustStock={handlePhysicalScanAdjustStock} onCreateProduct={handlePhysicalScanCreateProduct} onChangeCategory={handlePhysicalScanChangeCategory} onCreatePromotion={handlePhysicalScanCreatePromotion} onChangeBarcode={handlePhysicalScanChangeBarcode} />
        
        <MobileBarcodeScanner
          open={mobileScannerOpen}
          onClose={() => setMobileScannerOpen(false)}
        />
        
        <ProductSearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} onCreateProduct={barcode => {
        setFormData(prev => ({
          ...prev,
          barcode: barcode || '',
          vat_rate: '6'
        }));
        setView('product-form');
      }} onEditProduct={handleOpenProductForm} />
        
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4">
        <div className="max-w-md mx-auto space-y-6 pb-20">
          {/* Top actions */}
          <div className="flex justify-between items-center gap-3 pt-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="opacity-70 hover:opacity-100" title={darkMode ? 'Mode clair' : 'Mode sombre'}>
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={importFromCSV} className="opacity-70 hover:opacity-100" title="Importer CSV">
                <Upload className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={exportToCSV} className="opacity-70 hover:opacity-100" title="Exporter CSV">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Center: Time & Weather */}
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold font-mono tabular-nums">
                {currentTime.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
              {weather && <div className="text-xs text-muted-foreground">
                  {weather.temperature}°C
                </div>}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSearchDialogOpen(true)} className="opacity-70 hover:opacity-100" title="Rechercher un produit">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/mobile/calculator')} className="opacity-70 hover:opacity-100" title="Calculatrice">
                <Calculator className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="icon" onClick={handleLogout} className="opacity-70 hover:opacity-100" title="Déconnexion">
                <LogOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => {
                toast.success('Mise à jour en cours...', {
                  description: 'L\'application va se recharger avec la dernière version.'
                });
                setTimeout(() => window.location.reload(), 1000);
              }} className="opacity-70 hover:opacity-100" title="Mettre à jour">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Header */}
          <div className="text-center space-y-2">
            <img src={logoJlprod} alt="JL Prod" className="w-full h-auto max-w-[200px] mx-auto mb-4" />
            <h1 className="text-3xl font-black text-foreground">Gestion Mobile</h1>
            <p className="text-muted-foreground">{products.length} produits</p>
          </div>

          {/* Stats enrichies */}
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
            <Card className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
              <div className="space-y-1">
                <FolderKanban className="h-6 w-6 mb-2" />
                <p className="text-2xl font-black">{totalCategories}</p>
                <p className="text-xs text-white/80">Catégories</p>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
              <div className="space-y-1">
                <Wallet className="h-6 w-6 mb-2" />
                <p className="text-2xl font-black">{totalStockValue.toFixed(0)}€</p>
                <p className="text-xs text-white/80">Valeur stock</p>
              </div>
            </Card>
          </div>

          {/* Favoris rapides */}
          {favoriteProducts.length > 0 && <Card className="p-4 bg-gradient-to-r from-accent/20 to-transparent border-l-4 border-accent">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-accent fill-accent" />
                <h3 className="font-bold text-sm">Favoris</h3>
              </div>
              <div className="space-y-2">
                {favoriteProducts.slice(0, 3).map(p => <div key={p.id} onClick={() => handleOpenProductForm(p)} className="flex justify-between items-center text-sm hover:bg-accent/10 p-2 rounded cursor-pointer">
                    <span className="font-medium truncate">{p.name}</span>
                    <Badge variant="outline">{p.stock || 0}</Badge>
                  </div>)}
              </div>
            </Card>}

          {/* Actions principales */}
          <div className="space-y-3">
            <Button onClick={() => setView('products')} className="w-full h-16 bg-accent hover:bg-accent/90 text-lg font-bold" size="lg" variant="secondary">
              <Package className="h-6 w-6 mr-3" />
              Gérer les Produits
            </Button>

            <Button onClick={() => navigate('/mobile/categories')} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold border-0" size="lg">
              <FolderKanban className="h-6 w-6 mr-3" />
              Gérer les Catégories
            </Button>

            <Button onClick={() => navigate('/mobile/promotions')} className="w-full h-16 bg-accent hover:bg-accent/90 text-lg font-bold" size="lg" variant="outline">
              <Tag className="h-6 w-6 mr-3" />
              Gérer les Promotions
            </Button>

            <Button onClick={() => navigate('/mobile/orders')} className="w-full h-16 bg-primary hover:bg-primary/90 text-white text-lg font-bold border-0" size="lg">
              <ShoppingCart className="h-6 w-6 mr-3" />
              Gérer les Commandes
            </Button>

            <Button onClick={() => setMobileScannerOpen(true)} className="w-full h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg font-bold border-0" size="lg">
              <Scan className="h-6 w-6 mr-3" />
              Scan Mobile
            </Button>

            <Button onClick={() => handleOpenProductForm()} className="w-full h-16 border-2 border-primary text-primary hover:bg-primary/10 text-lg font-bold" size="lg" variant="outline">
              <Plus className="h-6 w-6 mr-3" />
              Nouveau Produit
            </Button>
          </div>

          {/* Liste rapide des alertes */}
          {(lowStock > 0 || outOfStock > 0) && <Card className="p-4 bg-gradient-to-r from-category-orange/10 to-transparent border-l-4 border-category-orange">
              <div className="space-y-2">
                <p className="font-bold text-sm">⚠️ Actions requises</p>
                {lowStock > 0 && <p className="text-xs text-muted-foreground">
                    • {lowStock} produit(s) en stock faible
                  </p>}
                {outOfStock > 0 && <p className="text-xs text-muted-foreground">
                    • {outOfStock} produit(s) en rupture
                  </p>}
              </div>
            </Card>}
        </div>
      </div>
      </>;
  }

  // Liste des produits
  if (view === 'products') {
    return <>
        <MobilePhysicalScanDialog open={physicalScanDialogOpen} onOpenChange={setPhysicalScanDialogOpen} barcode={scannedBarcode} product={scannedProduct} onEditProduct={handlePhysicalScanAddToForm} onAdjustStock={handlePhysicalScanAdjustStock} onCreateProduct={handlePhysicalScanCreateProduct} onChangeCategory={handlePhysicalScanChangeCategory} onCreatePromotion={handlePhysicalScanCreatePromotion} onChangeBarcode={handlePhysicalScanChangeBarcode} />
      <div className="min-h-screen bg-background">
        {/* Header fixe */}
        <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Button onClick={() => setView('menu')} variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold flex-1">Produits</h2>
            <Button onClick={() => setSelectionMode(!selectionMode)} variant="ghost" size="icon" title="Sélection multiple">
              <CheckSquare className="h-5 w-5" />
            </Button>
            <Button onClick={() => handleOpenProductForm()} size="icon" className="bg-primary">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          {/* Filtres et tri */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px] h-9">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterStock} onValueChange={(v: any) => setFilterStock(v)}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="out">Rupture</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[120px] h-9">
                <SortAsc className="h-3 w-3 mr-2" />
                <SelectValue placeholder="Trier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="price">Prix</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
              {viewMode === 'list' ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
          </div>

          {/* Actions groupées */}
          {selectionMode && selectedProducts.length > 0 && <div className="flex gap-2 bg-primary/10 p-2 rounded-lg">
              <Button size="sm" variant="outline" onClick={() => handleBulkStockAdjust(1)}>
                +1 ({selectedProducts.length})
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStockAdjust(10)}>
                +10
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStockAdjust(-1)}>
                -1
              </Button>
              <Button size="sm" variant="ghost" onClick={() => {
              setSelectedProducts([]);
              setSelectionMode(false);
            }}>
                Annuler
              </Button>
            </div>}
        </div>

        {/* Liste scrollable */}
        <ScrollArea className="h-[calc(100vh-240px)]">
          <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}`}>
            {filteredProducts.map(product => {
              const category = categories.find(c => c.id === product.category_id);
              const isLowStock = product.stock !== undefined && product.min_stock !== undefined && product.stock > 0 && product.stock <= product.min_stock;
              const isOutOfStock = product.stock === 0;
              const isFavorite = favorites.includes(product.id);
              const isSelected = selectedProducts.includes(product.id);
              return <Card key={product.id} className={`p-4 relative ${isOutOfStock ? 'border-destructive/50 bg-destructive/5' : isLowStock ? 'border-category-orange/50 bg-category-orange/5' : 'bg-white'} ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={() => selectionMode && toggleSelection(product.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {selectionMode && <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(product.id)} className="h-4 w-4" />}
                        <h3 className="font-bold truncate text-sm">{product.name}</h3>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={e => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}>
                          <Star className={`h-3 w-3 ${isFavorite ? 'fill-accent text-accent' : ''}`} />
                        </Button>
                      </div>

                      {!selectionMode && <>
                          <div className="flex items-center gap-1 mb-2 flex-wrap">
                            {isOutOfStock && <Badge variant="destructive" className="text-xs">Rupture</Badge>}
                            {isLowStock && <Badge variant="secondary" className="text-xs bg-category-orange text-white">Faible</Badge>}
                            {category && <Badge className="text-xs" style={{
                          backgroundColor: category.color + '20',
                          color: category.color,
                          borderColor: category.color
                        }}>
                                {category.name}
                              </Badge>}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-bold text-primary">{product.price.toFixed(2)}€</span>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Stock:</span>
                              <span className="font-bold">{product.stock || 0}</span>
                            </div>
                          </div>
                          
                          {product.barcode && <p className="text-xs text-muted-foreground mt-1 font-mono">
                              {product.barcode}
                            </p>}
                        </>}
                    </div>
                    
                    {!selectionMode && <div className="flex flex-col gap-2">
                        <Button onClick={() => handleOpenProductForm(product)} size="icon" variant="outline" className="h-9 w-9">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => {
                      setSelectedProductForStock(product);
                      setView('stock');
                    }} size="icon" variant="outline" className="h-9 w-9">
                          <Boxes className="h-4 w-4" />
                        </Button>
                      </div>}
                  </div>

                  {/* Barre de progression du stock */}
                  {!selectionMode && product.min_stock && product.min_stock > 0 && <div className="mt-3">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full transition-all ${isOutOfStock ? 'bg-destructive' : isLowStock ? 'bg-category-orange' : 'bg-green-600'}`} style={{
                      width: `${Math.min(100, (product.stock || 0) / (product.min_stock * 2) * 100)}%`
                    }} />
                      </div>
                    </div>}
                </Card>;
            })}
          </div>
        </ScrollArea>
      </div>
      </>;
  }

  // Formulaire produit
  if (view === 'product-form') {
    return <>
        <MobilePhysicalScanDialog open={physicalScanDialogOpen} onOpenChange={setPhysicalScanDialogOpen} barcode={scannedBarcode} product={scannedProduct} onEditProduct={handlePhysicalScanAddToForm} onAdjustStock={handlePhysicalScanAdjustStock} onCreateProduct={handlePhysicalScanCreateProduct} onChangeCategory={handlePhysicalScanChangeCategory} onCreatePromotion={handlePhysicalScanCreatePromotion} onChangeBarcode={handlePhysicalScanChangeBarcode} />
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => setView('products')} variant="ghost" size="icon">
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
              <Input value={formData.barcode} onChange={e => setFormData(prev => ({
                ...prev,
                barcode: e.target.value
              }))} placeholder="Scannez ou saisissez le code-barres" className="w-full" data-scan-ignore="true" />
              <p className="text-xs text-muted-foreground">
                Le scanner physique détectera automatiquement les codes-barres
              </p>
            </div>

            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={formData.name} onChange={e => setFormData(prev => ({
                ...prev,
                name: e.target.value
              }))} placeholder="Nom du produit" required />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={formData.description} onChange={e => setFormData(prev => ({
                ...prev,
                description: e.target.value
              }))} placeholder="Description" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prix de vente *</Label>
                <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData(prev => ({
                  ...prev,
                  price: e.target.value
                }))} placeholder="0.00" required />
              </div>
              <div className="space-y-2">
                <Label>Prix d'achat</Label>
                <Input type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData(prev => ({
                  ...prev,
                  cost_price: e.target.value
                }))} placeholder="0.00" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type de produit</Label>
              <Select value={formData.type} onValueChange={(value: 'unit' | 'weight') => setFormData(prev => ({
                ...prev,
                type: value
              }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Unité</SelectItem>
                  <SelectItem value="weight">Poids</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unité de mesure</Label>
              <Select value={formData.unit} onValueChange={value => setFormData(prev => ({
                ...prev,
                unit: value
              }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select value={formData.category_id} onValueChange={value => setFormData(prev => ({
                ...prev,
                category_id: value
              }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Stock initial</Label>
                <Input type="number" value={formData.stock} onChange={e => setFormData(prev => ({
                  ...prev,
                  stock: e.target.value
                }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Stock minimum</Label>
                <Input type="number" value={formData.min_stock} onChange={e => setFormData(prev => ({
                  ...prev,
                  min_stock: e.target.value
                }))} placeholder="0" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>TVA (%)</Label>
              <Select value={formData.vat_rate} onValueChange={value => setFormData(prev => ({
                ...prev,
                vat_rate: value
              }))}>
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
      </>;
  }

  // Ajustement de stock
  if (view === 'stock' && selectedProductForStock) {
    return <>
        <MobilePhysicalScanDialog open={physicalScanDialogOpen} onOpenChange={setPhysicalScanDialogOpen} barcode={scannedBarcode} product={scannedProduct} onEditProduct={handlePhysicalScanAddToForm} onAdjustStock={handlePhysicalScanAdjustStock} onCreateProduct={handlePhysicalScanCreateProduct} onChangeCategory={handlePhysicalScanChangeCategory} onCreatePromotion={handlePhysicalScanCreatePromotion} onChangeBarcode={handlePhysicalScanChangeBarcode} />
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => {
              setView('products');
              setSelectedProductForStock(null);
            }} variant="ghost" size="icon">
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
            <div className="space-y-2">
              <Label>Motif de l'ajustement</Label>
              <Select value={stockAdjustmentReason} onValueChange={setStockAdjustmentReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un motif..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reception">Réception</SelectItem>
                  <SelectItem value="inventaire">Inventaire</SelectItem>
                  <SelectItem value="casse">Casse</SelectItem>
                  <SelectItem value="vol">Vol</SelectItem>
                  <SelectItem value="retour">Retour</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ajustement (+ ou -)</Label>
              <Input type="number" value={stockAdjustment} onChange={e => setStockAdjustment(e.target.value)} placeholder="Ex: +10 ou -5" className="text-xl h-14 text-center font-bold" />
            </div>

            {stockAdjustment && <Card className="p-4 bg-primary/5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nouveau stock:</span>
                  <span className="text-2xl font-bold text-primary">
                    {Math.max(0, (selectedProductForStock.stock || 0) + parseFloat(stockAdjustment))}
                  </span>
                </div>
              </Card>}

            <div className="grid grid-cols-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setStockAdjustment('-10')}>
                -10
              </Button>
              <Button type="button" variant="outline" onClick={() => setStockAdjustment('-1')}>
                -1
              </Button>
              <Button type="button" variant="outline" onClick={() => setStockAdjustment('+1')}>
                +1
              </Button>
              <Button type="button" variant="outline" onClick={() => setStockAdjustment('+10')}>
                +10
              </Button>
              <Button type="button" variant="outline" className="col-span-2" onClick={() => setStockAdjustment('+20')}>
                +20
              </Button>
              <Button type="button" variant="outline" className="col-span-2" onClick={() => setStockAdjustment('+50')}>
                +50
              </Button>
            </div>

            <Button onClick={handleStockAdjust} className="w-full h-14 mt-6" size="lg" disabled={!stockAdjustment}>
              <Save className="h-5 w-5 mr-2" />
              Valider l'Ajustement
            </Button>
          </div>
        </div>
      </div>
      </>;
  }
  return null;
}