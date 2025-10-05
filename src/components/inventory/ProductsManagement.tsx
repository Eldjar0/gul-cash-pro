import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Upload, Tag, Edit, Trash2, Plus, FileText } from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { CategoryDialog } from '@/components/products/CategoryDialog';
import { ImportProductsDialog } from '@/components/products/ImportProductsDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { generateStockPDF } from '@/utils/generateStockPDF';

const normalizeBarcodeInput = (raw: string) => {
  const map: Record<string, string> = {
    '&': '1', 'é': '2', '"': '3', "'": '4', '(': '5', '-': '6', 'è': '7', '_': '8', 'ç': '9', 'à': '0', '!': '8'
  };
  return raw
    .split('')
    .map((ch) => (/[0-9]/.test(ch) ? ch : (map[ch] ?? '')))
    .join('');
};

export const ProductsManagement = () => {
  const { data: products = [] } = useProducts();
  const { mutate: createProduct } = useCreateProduct();
  const { mutate: updateProduct } = useUpdateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();

  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '',
    barcode: '',
    price: '',
    stock: '',
    vat_rate: '21',
    min_stock: '0',
    unit: 'unité',
  });

  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (stockFilter === 'out') return matchesSearch && p.stock === 0;
    if (stockFilter === 'low') return matchesSearch && p.stock > 0 && p.stock <= (p.min_stock || 0);
    return matchesSearch;
  });

  const openNewProduct = () => {
    setEditingProduct(null);
    setForm({ name: '', barcode: '', price: '', stock: '', vat_rate: '21', min_stock: '0', unit: 'unité' });
    setProductDialogOpen(true);
  };

  const openEditProduct = (p: any) => {
    setEditingProduct(p);
    setForm({
      name: p.name || '',
      barcode: p.barcode || '',
      price: (p.price ?? '').toString(),
      stock: (p.stock ?? '').toString(),
      vat_rate: (p.vat_rate ?? '21').toString(),
      min_stock: (p.min_stock ?? '0').toString(),
      unit: p.unit || 'unité',
    });
    setProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    const name = form.name.trim();
    const price = parseFloat(form.price);
    const stock = parseFloat(form.stock || '0');
    const vat_rate = parseFloat(form.vat_rate || '21');
    const min_stock = parseFloat(form.min_stock || '0');
    if (!name || isNaN(price)) return;

    const barcodeNormalized = normalizeBarcodeInput((form.barcode || '').trim());

    const payload: any = {
      name,
      barcode: barcodeNormalized || null,
      price,
      stock,
      vat_rate,
      min_stock,
      unit: form.unit || 'unité',
      is_active: true,
    };

    if (editingProduct) {
      updateProduct({ id: editingProduct.id, ...payload });
    } else {
      createProduct(payload);
    }
    setProductDialogOpen(false);
  };

  const confirmDelete = (p: any) => {
    setProductToDelete(p);
    setDeleteOpen(true);
  };

  const handleDeleteConfirmed = () => {
    if (productToDelete?.id) {
      deleteProduct(productToDelete.id);
    }
    setDeleteOpen(false);
    setProductToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou code-barres..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="low">Stock faible</SelectItem>
            <SelectItem value="out">Rupture</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
          <Tag className="h-4 w-4 mr-2" />
          Catégories
        </Button>
        <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Importer
        </Button>
        <Button 
          variant="outline" 
          onClick={() => generateStockPDF(products)}
          disabled={products.length === 0}
        >
          <FileText className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        <Button onClick={openNewProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau
        </Button>
      </div>

      {filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun produit trouvé</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    {product.barcode && (
                      <Badge variant="outline" className="mt-1 font-mono text-xs">
                        {product.barcode}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditProduct(product)} title="Modifier">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(product)} title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix</span>
                    <span className="font-semibold">{product.price.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock</span>
                    <Badge variant={product.stock === 0 ? 'destructive' : product.stock <= (product.min_stock || 0) ? 'secondary' : 'default'}>
                      {product.stock} {product.unit}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="barcode">Code-barres</Label>
              <Input id="barcode" value={form.barcode}
                inputMode="numeric" pattern="[0-9]*" autoComplete="off" maxLength={32}
                onChange={(e) => setForm({ ...form, barcode: normalizeBarcodeInput(e.target.value) })}
                onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData('text'); setForm({ ...form, barcode: normalizeBarcodeInput(text) }); }}
                onKeyDown={(e) => {
                  const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
                  if (allowed.includes(e.key)) return;
                  const isDigit = /[0-9]/.test(e.key);
                  const map: Record<string,string> = { '&':'1','é':'2','"':'3','\'':'4','(':'5','-':'6','è':'7','_':'8','ç':'9','à':'0','!':'8' };
                  const mapped = map[e.key];
                  if (!isDigit && !mapped) { e.preventDefault(); }
                  if (mapped) {
                    e.preventDefault();
                    setForm((f) => ({ ...f, barcode: (f.barcode || '') + mapped }));
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price">Prix</Label>
              <Input id="price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" step="0.01" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vat_rate">TVA %</Label>
              <Input id="vat_rate" type="number" step="0.01" value={form.vat_rate} onChange={(e) => setForm({ ...form, vat_rate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="min_stock">Stock min.</Label>
              <Input id="min_stock" type="number" step="0.01" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="unit">Unité</Label>
              <Input id="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setProductDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveProduct}>{editingProduct ? 'Enregistrer' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action désactivera le produit. Vous pourrez l'activer plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
      <ImportProductsDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
    </div>
  );
};
