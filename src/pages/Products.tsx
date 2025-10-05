import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Trash2,
  Search,
  Package,
  AlertTriangle,
  FolderKanban,
  TrendingDown,
  TrendingUp,
  BarChart3,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  Upload,
  Tag,
  Settings,
} from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { toast } from 'sonner';
import { CategoryDialog } from '@/components/products/CategoryDialog';
import { ImportProductsDialog } from '@/components/products/ImportProductsDialog';
import { BarcodeLabelDialog } from '@/components/products/BarcodeLabelDialog';
import { QuickStockAdjustDialog } from '@/components/products/QuickStockAdjustDialog';
import { PRODUCT_UNITS } from '@/data/units';
import { DialogDescription } from '@/components/ui/dialog';

export default function Products() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [barcodeLabelDialogOpen, setBarcodeLabelDialogOpen] = useState(false);
  const [stockAdjustDialogOpen, setStockAdjustDialogOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
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
    image: '',
  });

  useEffect(() => {
    if (dialogOpen && barcodeInputRef.current) {
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [dialogOpen]);

  const filteredProducts = products.filter((product) => {
    const trimmedSearch = searchTerm.trim();
    const searchLower = trimmedSearch.toLowerCase();
    
    // Stock filter
    if (stockFilter === 'low') {
      const hasLowStock = product.stock !== undefined && 
                         product.min_stock !== undefined && 
                         product.stock > 0 &&
                         product.stock <= product.min_stock;
      if (!hasLowStock) return false;
    } else if (stockFilter === 'out') {
      if (product.stock === undefined || product.stock > 0) return false;
    }
    
    // Search filter
    if (!trimmedSearch) return true;
    
    const isNumber = !isNaN(Number(trimmedSearch)) && trimmedSearch !== '';
    
    if (product.name.toLowerCase().includes(searchLower)) return true;
    if (product.barcode?.toLowerCase().includes(searchLower)) return true;
    if (product.description?.toLowerCase().includes(searchLower)) return true;
    if (isNumber && Math.abs(product.price - Number(trimmedSearch)) < 0.01) return true;
    
    return false;
  });

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        barcode: product.barcode || '',
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        cost_price: product.cost_price?.toString() || '',
        type: product.type,
        unit: product.unit || 'pièce',
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
        unit: 'pièce',
        category_id: '',
        vat_rate: '21',
        stock: '',
        min_stock: '',
        supplier: '',
        image: '',
      });
    }
    setDialogOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpen = params.get('new');
    const bc = params.get('barcode');
    if (shouldOpen && bc) {
      const digitsOnly = bc.replace(/\D+/g, '');
      handleOpenDialog();
      setFormData((prev) => ({ ...prev, barcode: digitsOnly }));
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
      navigate('/products', { replace: true });
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      barcode: formData.barcode || undefined,
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
      type: formData.type,
      unit: formData.unit,
      vat_rate: parseFloat(formData.vat_rate),
      stock: formData.stock ? parseFloat(formData.stock) : 0,
      min_stock: formData.min_stock ? parseFloat(formData.min_stock) : 0,
      category_id: formData.category_id || undefined,
      supplier: formData.supplier || undefined,
      image: formData.image || undefined,
      is_active: true,
    };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
        toast.success('Produit modifié avec succès');
      } else {
        await createProduct.mutateAsync(productData);
        toast.success('Produit créé avec succès');
      }
      setDialogOpen(false);
      setEditingProduct(null);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await deleteProduct.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const getStats = () => {
    const lowStock = products.filter(p => 
      p.stock !== undefined && p.min_stock !== undefined && p.stock > 0 && p.stock <= p.min_stock
    ).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
    const totalCostValue = products.reduce((sum, p) => sum + ((p.cost_price || 0) * (p.stock || 0)), 0);
    const profit = totalValue - totalCostValue;
    
    return { lowStock, outOfStock, totalValue, totalCostValue, profit };
  };

  const { lowStock, outOfStock, totalValue, totalCostValue, profit } = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground font-medium">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Title & Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-foreground">Gestion Produits</h1>
                <p className="text-muted-foreground text-lg">{products.length} produits au catalogue</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setImportDialogOpen(true)}
              variant="outline"
              size="lg"
              className="h-12"
            >
              <Upload className="h-5 w-5 mr-2" />
              Importer CSV
            </Button>
            {selectedProducts.length > 0 && (
              <Button
                onClick={() => setBarcodeLabelDialogOpen(true)}
                variant="outline"
                size="lg"
                className="h-12"
              >
                <Tag className="h-5 w-5 mr-2" />
                Étiquettes ({selectedProducts.length})
              </Button>
            )}
            <Button
              onClick={() => setCategoryDialogOpen(true)}
              variant="outline"
              size="lg"
              className="h-12"
            >
              <FolderKanban className="h-5 w-5 mr-2" />
              Catégories
            </Button>
            <Button
              onClick={() => handleOpenDialog()}
              size="lg"
              className="h-12 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouveau Produit
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-primary to-primary-glow text-white border-0 shadow-lg hover:shadow-xl transition-all duration-100">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Valeur Stock</p>
                <p className="text-3xl font-black">{totalValue.toFixed(2)}€</p>
                <div className="flex items-center gap-1 text-white/60 text-xs">
                  <ShoppingBag className="h-3 w-3" />
                  <span>Prix de vente</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-accent to-accent/80 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-100">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Marge Potentielle</p>
                <p className="text-3xl font-black">{profit.toFixed(2)}€</p>
                <div className="flex items-center gap-1 text-white/60 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  <span>{((profit / totalCostValue) * 100 || 0).toFixed(1)}% de marge</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 bg-gradient-to-br from-category-orange to-category-orange/80 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-100 cursor-pointer"
            onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Stock Faible</p>
                <p className="text-3xl font-black">{lowStock}</p>
                <p className="text-white/60 text-xs">Produits à commander</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 bg-gradient-to-br from-destructive to-destructive/80 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-100 cursor-pointer"
            onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Rupture de Stock</p>
                <p className="text-3xl font-black">{outOfStock}</p>
                <p className="text-white/60 text-xs">Produits épuisés</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Alert Banners */}
        {lowStock > 0 && (
          <Card className="p-5 bg-gradient-to-r from-category-orange/10 to-category-orange/5 border-2 border-category-orange/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-category-orange/20 rounded-lg shrink-0">
                <AlertTriangle className="h-6 w-6 text-category-orange" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-lg text-foreground">Alerte Stock Faible</p>
                <p className="text-muted-foreground">
                  {lowStock} produit{lowStock > 1 ? 's sont' : ' est'} en dessous du stock minimum et nécessite{lowStock > 1 ? 'nt' : ''} une commande urgente
                </p>
              </div>
            </div>
          </Card>
        )}

        {outOfStock > 0 && (
          <Card className="p-5 bg-gradient-to-r from-destructive/10 to-destructive/5 border-2 border-destructive/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/20 rounded-lg shrink-0">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-lg text-foreground">Rupture de Stock</p>
                <p className="text-muted-foreground">
                  {outOfStock} produit{outOfStock > 1 ? 's sont' : ' est'} totalement épuisé{outOfStock > 1 ? 's' : ''} et indisponible{outOfStock > 1 ? 's' : ''} à la vente
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Search & Filter */}
        <Card className="p-4 bg-white border-0 shadow-lg">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, code-barres, description ou prix..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 text-base"
              />
            </div>
            <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
              <SelectTrigger className="w-[200px] h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les produits</SelectItem>
                <SelectItem value="low">Stock faible</SelectItem>
                <SelectItem value="out">Rupture de stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Products Grid */}
        <ScrollArea className="h-[calc(100vh-620px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
            {filteredProducts.map((product) => {
              const category = categories.find(c => c.id === product.category_id);
              const isLowStock = product.stock !== undefined && 
                                product.min_stock !== undefined && 
                                product.stock > 0 &&
                                product.stock <= product.min_stock;
              const isOutOfStock = product.stock === 0;
              const margin = product.cost_price ? ((product.price - product.cost_price) / product.cost_price * 100) : 0;
              
              return (
                <Card
                  key={product.id}
                  className={`p-5 border-2 hover:shadow-lg transition-all duration-100 ${
                    isOutOfStock 
                      ? 'border-destructive/30 bg-destructive/5' 
                      : isLowStock 
                      ? 'border-category-orange/30 bg-category-orange/5'
                      : 'hover:border-primary/30 bg-white'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, product.id]);
                            } else {
                              setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                            }
                          }}
                          className="mt-1 h-4 w-4 rounded border-gray-300"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-2 flex-wrap">
                          {product.barcode && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {product.barcode}
                            </Badge>
                          )}
                          {category && (
                            <Badge style={{ backgroundColor: category.color + '20', color: category.color }}>
                              {category.name}
                            </Badge>
                          )}
                          </div>
                          <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(product)}
                          className="h-10 w-10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          className="h-10 w-10 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Pricing & Stock Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Prix de Vente</p>
                        <p className="text-2xl font-black text-primary">{product.price.toFixed(2)}€</p>
                        <p className="text-xs text-muted-foreground">/ {product.unit || 'u'}</p>
                      </div>

                      {product.cost_price && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Prix d'Achat</p>
                          <p className="text-lg font-bold">{product.cost_price.toFixed(2)}€</p>
                          <p className={`text-xs font-semibold ${margin >= 0 ? 'text-accent' : 'text-destructive'}`}>
                            {margin >= 0 ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}
                            {margin.toFixed(1)}% marge
                          </p>
                        </div>
                      )}

                      <div className={`p-3 rounded-lg ${
                        isOutOfStock 
                          ? 'bg-destructive/10' 
                          : isLowStock 
                          ? 'bg-category-orange/10'
                          : 'bg-accent/10'
                      }`}>
                        <p className="text-xs text-muted-foreground mb-1">Stock Actuel</p>
                        <div className="flex items-center gap-2">
                          <p className={`text-2xl font-black ${
                            isOutOfStock ? 'text-destructive' : isLowStock ? 'text-category-orange' : 'text-accent'
                          }`}>
                            {product.stock !== undefined ? product.stock : '-'}
                          </p>
                          {(isLowStock || isOutOfStock) && (
                            <AlertTriangle className={`h-5 w-5 ${isOutOfStock ? 'text-destructive' : 'text-category-orange'}`} />
                          )}
                        </div>
                        {product.min_stock !== undefined && (
                          <p className="text-xs text-muted-foreground">Min: {product.min_stock}</p>
                        )}
                      </div>

                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">TVA</p>
                        <p className="text-lg font-bold">{product.vat_rate}%</p>
                        {product.supplier && (
                          <p className="text-xs text-muted-foreground truncate">{product.supplier}</p>
                        )}
                      </div>
                    </div>

                    {/* Stock Status Badge */}
                    {isOutOfStock && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm font-bold text-destructive text-center">
                          ⚠️ RUPTURE DE STOCK - Commande urgente requise
                        </p>
                      </div>
                    )}
                    {isLowStock && !isOutOfStock && (
                      <div className="p-3 bg-category-orange/10 border border-category-orange/20 rounded-lg">
                        <p className="text-sm font-bold text-category-orange text-center">
                          ⚠️ Stock faible - Réapprovisionnement recommandé
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="inline-flex p-6 bg-muted/30 rounded-full mb-4">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-xl font-semibold text-muted-foreground">Aucun produit trouvé</p>
                <p className="text-sm text-muted-foreground mt-2">Essayez de modifier vos critères de recherche</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du produit. Les champs marqués d'un * sont obligatoires.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="barcode">Code-barres</Label>
                <Input
                  ref={barcodeInputRef}
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value.replace(/\D+/g, '') })}
                  placeholder="Ex: 3760123456789"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom du produit"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du produit"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="price">Prix de vente *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="cost_price">Prix d'achat</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie..." />
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
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="type">Type de produit</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'unit' | 'weight') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Unité</SelectItem>
                    <SelectItem value="weight">Poids</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="unit">Unité de mesure</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="vat_rate">TVA (%)</Label>
                <Input
                  id="vat_rate"
                  type="number"
                  step="0.01"
                  value={formData.vat_rate}
                  onChange={(e) => setFormData({ ...formData, vat_rate: e.target.value })}
                  placeholder="21"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="stock">Stock actuel</Label>
                <Input
                  id="stock"
                  type="number"
                  step="0.01"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="min_stock">Stock minimum</Label>
                <Input
                  id="min_stock"
                  type="number"
                  step="0.01"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="supplier">Fournisseur</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Nom du fournisseur"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="min-w-[120px]">
                {editingProduct ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <CategoryDialog 
        open={categoryDialogOpen} 
        onOpenChange={setCategoryDialogOpen}
      />

      {/* Import Products Dialog */}
      <ImportProductsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      {/* Barcode Label Dialog */}
      <BarcodeLabelDialog
        open={barcodeLabelDialogOpen}
        onOpenChange={setBarcodeLabelDialogOpen}
        products={selectedProducts.map(id => {
          const p = products.find(prod => prod.id === id);
          return {
            id: p?.id || '',
            name: p?.name || '',
            barcode: p?.barcode,
            price: p?.price || 0,
          };
        })}
      />

      {/* Quick Stock Adjust Dialog */}
      {selectedProductForStock && (
        <QuickStockAdjustDialog
          open={stockAdjustDialogOpen}
          onOpenChange={setStockAdjustDialogOpen}
          product={selectedProductForStock}
        />
      )}
    </div>
  );
}
