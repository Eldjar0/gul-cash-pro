import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Package, Upload, Tag, Edit, Trash2, Plus, FileText, Printer } from 'lucide-react';
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

  // État pour l'onglet étiquettes
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [labelCount, setLabelCount] = useState<Record<string, number>>({});
  const [showPrice, setShowPrice] = useState(true);
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');

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

  // Gestion des étiquettes
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
        const newCount = { ...labelCount };
        delete newCount[productId];
        setLabelCount(newCount);
      } else {
        newSet.add(productId);
        setLabelCount(prev => ({ ...prev, [productId]: 1 }));
      }
      return newSet;
    });
  };

  const updateLabelCount = (productId: string, count: number) => {
    setLabelCount(prev => ({ ...prev, [productId]: Math.max(1, count) }));
  };

  const generateLabels = () => {
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
    if (selectedProductsList.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelSizes = {
      small: { width: '50mm', height: '30mm', fontSize: '9px', barcodeHeight: '18mm', nameSize: '11px', priceSize: '10px' },
      medium: { width: '70mm', height: '45mm', fontSize: '11px', barcodeHeight: '25mm', nameSize: '14px', priceSize: '13px' },
      large: { width: '90mm', height: '55mm', fontSize: '13px', barcodeHeight: '30mm', nameSize: '16px', priceSize: '15px' }
    };

    const size = labelSizes[labelSize];

    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Étiquettes Produits</title>
          <style>
            @page { margin: 5mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              display: flex;
              flex-wrap: wrap;
              gap: 5mm;
              padding: 5mm;
              background: white;
            }
            .label {
              width: ${size.width};
              height: ${size.height};
              border: 2px solid #000;
              padding: 3mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-inside: avoid;
              background: white;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 2mm;
              gap: 2mm;
            }
            .product-name {
              font-size: ${size.nameSize};
              font-weight: bold;
              text-align: left;
              flex: 1;
              line-height: 1.2;
              max-height: 3em;
              overflow: hidden;
              word-wrap: break-word;
            }
            .price-container {
              text-align: right;
              min-width: 30%;
            }
            .price {
              font-size: ${size.priceSize};
              font-weight: bold;
              white-space: nowrap;
            }
            .unit {
              font-size: calc(${size.fontSize} - 1px);
              color: #666;
              margin-top: 1px;
            }
            .barcode-section {
              text-align: center;
              margin-top: auto;
            }
            .barcode {
              font-family: "Libre Barcode 128", monospace;
              font-size: ${size.barcodeHeight};
              line-height: ${size.barcodeHeight};
              margin: 2mm 0;
            }
            .barcode-text {
              font-size: ${size.fontSize};
              font-family: monospace;
              letter-spacing: 1px;
              margin-top: 1mm;
            }
            @media print {
              body { padding: 0; gap: 3mm; }
              .label { border: 1.5px solid #000; }
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
        </head>
        <body>
    `;

    selectedProductsList.forEach(product => {
      const copies = labelCount[product.id] || 1;
      const unitText = product.unit || 'unité';
      const pricePerUnit = product.type === 'weight' ? 'le kg' : unitText === 'carton' ? 'le carton' : 'la pièce';
      
      for (let i = 0; i < copies; i++) {
        htmlContent += `
          <div class="label">
            <div class="header-row">
              <div class="product-name">${product.name}</div>
              ${showPrice ? `
                <div class="price-container">
                  <div class="price">${product.price.toFixed(2)} €</div>
                  <div class="unit">${pricePerUnit}</div>
                </div>
              ` : ''}
            </div>
            <div class="barcode-section">
              ${product.barcode ? `
                <div class="barcode">*${product.barcode}*</div>
                <div class="barcode-text">${product.barcode}</div>
              ` : '<div style="font-size: 9px; color: #999;">Aucun code-barres</div>'}
            </div>
          </div>
        `;
      }
    });

    htmlContent += `
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => printWindow.close(), 100);
    }, 500);
  };

  return (
    <Tabs defaultValue="products" className="space-y-6">
      <TabsList>
        <TabsTrigger value="products">
          <Package className="h-4 w-4 mr-2" />
          Produits
        </TabsTrigger>
        <TabsTrigger value="labels">
          <Printer className="h-4 w-4 mr-2" />
          Étiquettes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="products" className="space-y-6">
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
      </TabsContent>

      <TabsContent value="labels" className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Configuration des étiquettes</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Taille d'étiquette</Label>
                <Select value={labelSize} onValueChange={(v: any) => setLabelSize(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Petite (40×25mm)</SelectItem>
                    <SelectItem value="medium">Moyenne (60×40mm)</SelectItem>
                    <SelectItem value="large">Grande (80×50mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox 
                  id="show-price" 
                  checked={showPrice} 
                  onCheckedChange={(checked) => setShowPrice(checked as boolean)} 
                />
                <Label htmlFor="show-price" className="cursor-pointer">Afficher le prix</Label>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={generateLabels} 
                  disabled={selectedProducts.size === 0}
                  className="w-full"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer ({selectedProducts.size} produit{selectedProducts.size > 1 ? 's' : ''})
                </Button>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des produits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                      
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {product.barcode && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {product.barcode}
                            </Badge>
                          )}
                          <span>{product.price.toFixed(2)} €</span>
                        </div>
                      </div>

                      {selectedProducts.has(product.id) && (
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Copies:</Label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={labelCount[product.id] || 1}
                            onChange={(e) => updateLabelCount(product.id, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

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
    </Tabs>
  );
};
