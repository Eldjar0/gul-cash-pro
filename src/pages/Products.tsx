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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  AlertTriangle,
  FolderKanban,
} from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { toast } from 'sonner';
import { CategoryDialog } from '@/components/products/CategoryDialog';

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
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
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

  // Auto-focus sur le champ code-barres quand le dialogue s'ouvre
  useEffect(() => {
    if (dialogOpen && barcodeInputRef.current) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [dialogOpen]);

  const filteredProducts = products.filter((product) => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) return true;
    
    const searchLower = trimmedSearch.toLowerCase();
    const isNumber = !isNaN(Number(trimmedSearch)) && trimmedSearch !== '';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedSearch);
    
    // Recherche dans le nom
    if (product.name.toLowerCase().includes(searchLower)) return true;
    
    // Recherche dans le code-barres (normalisé)
    if (product.barcode) {
      const normalizedBarcode = product.barcode.replace(/[^0-9]/g, '');
      const normalizedSearch = trimmedSearch.replace(/[^0-9]/g, '');
      if (normalizedBarcode.toLowerCase().includes(searchLower)) return true;
      if (normalizedBarcode.includes(normalizedSearch)) return true;
    }
    
    // Recherche dans la description
    if (product.description?.toLowerCase().includes(searchLower)) return true;
    
    // Recherche par ID
    if (isUUID && product.id === trimmedSearch) return true;
    if (product.id.toLowerCase().includes(searchLower)) return true;
    
    // Recherche par prix
    if (isNumber) {
      const numValue = Number(trimmedSearch);
      if (Math.abs(product.price - numValue) < 0.01) return true;
      if (product.price.toString().includes(trimmedSearch)) return true;
    }
    
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
    setDialogOpen(true);
  };

  // Ouvrir automatiquement le formulaire si on arrive avec ?new=1&barcode=XXX
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpen = params.get('new');
    const bc = params.get('barcode');
    if (shouldOpen && bc) {
      const digitsOnly = bc.replace(/\D+/g, '');
      handleOpenDialog();
      setFormData((prev) => ({ ...prev, barcode: digitsOnly }));
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
      // Nettoyer l'URL pour éviter les réouvertures
      navigate('/products', { replace: true });
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
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

  const getLowStockProducts = () => {
    return products.filter(p => 
      p.stock !== undefined && 
      p.min_stock !== undefined && 
      p.stock <= p.min_stock
    );
  };

  const lowStockCount = getLowStockProducts().length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b border-primary/20 px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-white">Gestion des Produits</h1>
              <p className="text-xs md:text-sm text-white/80">{products.length} produits</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCategoryDialogOpen(true)}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <FolderKanban className="h-4 w-4 mr-2" />
              Catégories
            </Button>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-white text-primary hover:bg-white/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Alert Stock */}
        {lowStockCount > 0 && (
          <Card className="p-4 mb-4 bg-destructive/10 border-destructive/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Stock faible</p>
                <p className="text-sm text-muted-foreground">
                  {lowStockCount} produit{lowStockCount > 1 ? 's' : ''} en dessous du stock minimum
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Search */}
        <Card className="p-4 bg-white mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, code-barres, ID ou prix..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Products Table */}
        <Card className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <ScrollArea className="h-[calc(100vh-350px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code-barres</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>TVA</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const category = categories.find(c => c.id === product.category_id);
                    const isLowStock = product.stock !== undefined && 
                                      product.min_stock !== undefined && 
                                      product.stock <= product.min_stock;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">
                          {product.barcode || '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {category ? (
                            <Badge 
                              style={{ backgroundColor: category.color + '20', color: category.color }}
                            >
                              {category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {product.price.toFixed(2)}€ / {product.unit || 'u'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={isLowStock ? 'text-destructive font-semibold' : ''}>
                              {product.stock !== undefined ? product.stock : '-'}
                            </span>
                            {isLowStock && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.vat_rate}%</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucun produit trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </Card>
      </div>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="barcode">Code-barres</Label>
                <Input
                  ref={barcodeInputRef}
                  id="barcode"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={formData.barcode}
                  onChange={(e) => {
                    // Fallback: copier-coller → ne garder que les chiffres
                    const digitsOnly = e.target.value.replace(/\D+/g, '');
                    setFormData({ ...formData, barcode: digitsOnly });
                  }}
                  onKeyDown={(e) => {
                    // Empêcher le système de scan global et capturer les vrais chiffres via code physique
                    e.stopPropagation();
                    const code = e.code;
                    let digit = '';
                    if (code.startsWith('Digit')) {
                      digit = code.replace('Digit', '');
                    } else if (code.startsWith('Numpad')) {
                      digit = code.replace('Numpad', '');
                    }
                    if (digit && /^[0-9]$/.test(digit)) {
                      e.preventDefault();
                      setFormData({ ...formData, barcode: (formData.barcode || '') + digit });
                    } else if (e.key === 'Backspace') {
                      e.preventDefault();
                      setFormData({ ...formData, barcode: (formData.barcode || '').slice(0, -1) });
                    } else if (e.key === 'Enter' || e.key === 'Tab') {
                      return; // laisser passer
                    } else if (e.key.length === 1 && !/[0-9]/.test(e.key)) {
                      e.preventDefault(); // bloquer symboles
                    }
                  }}
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
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'unit' | 'weight') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Unité</SelectItem>
                    <SelectItem value="weight">Poids (kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="unit">Unité de vente</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unité">Unité (u)</SelectItem>
                    <SelectItem value="carton">Carton</SelectItem>
                    <SelectItem value="lot">Lot</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="kg">Kilogramme (kg)</SelectItem>
                    <SelectItem value="g">Gramme (g)</SelectItem>
                    <SelectItem value="litre">Litre (L)</SelectItem>
                    <SelectItem value="ml">Millilitre (ml)</SelectItem>
                    <SelectItem value="m">Mètre (m)</SelectItem>
                    <SelectItem value="m2">Mètre carré (m²)</SelectItem>
                    <SelectItem value="m3">Mètre cube (m³)</SelectItem>
                    <SelectItem value="pièce">Pièce</SelectItem>
                    <SelectItem value="boîte">Boîte</SelectItem>
                    <SelectItem value="sachet">Sachet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
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
              <div className="col-span-2 md:col-span-1">
                <Label htmlFor="supplier">Fournisseur</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Nom du fournisseur"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
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
    </div>
  );
}
