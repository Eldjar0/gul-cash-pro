import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Package, Upload, Tag, Trash2, Plus, FileText, Printer, Pencil, Save, Edit } from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { CategoryDialog } from '@/components/products/CategoryDialog';
import { ImportProductsDialog } from '@/components/products/ImportProductsDialog';
import { ProductBarcodesManager } from '@/components/products/ProductBarcodesManager';
import { usePhysicalScanner } from '@/hooks/usePhysicalScanner';
import { PRODUCT_UNITS } from '@/data/units';
import { useToast } from '@/hooks/use-toast';
import { DialogDescription } from '@/components/ui/dialog';
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
import { A4LabelLayout, PREDEFINED_FORMATS, type LabelSlot, type StickerFormat } from '@/components/inventory/A4LabelLayout';
import { LabelProductSelector } from '@/components/inventory/LabelProductSelector';
import { LabelDesignEditor } from '@/components/inventory/LabelDesignEditor';
import { generateA4LabelsPDF } from '@/utils/generateA4LabelsPDF';
import { useLabelConfigs } from '@/hooks/useLabelConfigs';

const normalizeBarcodeInput = (raw: string) => {
  const map: Record<string, string> = {
    '&': '1', '!': '1', 'é': '2', '@': '2', '"': '3', '#': '3',
    "'": '4', '$': '4', '(': '5', '%': '5', '-': '6', '^': '6',
    'è': '7', '&amp;': '7', '_': '8', '*': '8', 'ç': '9', 'à': '0', ')': '0',
    '§': '6', '²': '2', '³': '3', '°': '0', '+': '1', '=': '0',
    '~': '2', '{': '4', '}': '0', '[': '5', ']': '6', '|': '6',
    '`': '7', '\\': '8', '/': '9'
  };
  return raw
    .split('')
    .map((ch) => (/[0-9]/.test(ch) ? ch : (map[ch] || ch)))
    .join('')
    .replace(/\D+/g, ''); // Supprimer tous les caractères non-numériques à la fin
};

export const ProductsManagement = () => {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { mutate: createProduct } = useCreateProduct();
  const { mutate: updateProduct } = useUpdateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();
  const { toast } = useToast();

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
    unit: 'pièce',
    type: 'unit' as 'unit' | 'weight',
    category_id: '',
  });

  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // État pour l'onglet étiquettes A4
  const [selectedFormat, setSelectedFormat] = useState<StickerFormat>(PREDEFINED_FORMATS[0]);
  const [labelSlots, setLabelSlots] = useState<LabelSlot[]>([]);
  const [labelTemplate, setLabelTemplate] = useState<any>(null);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [saveConfigDialogOpen, setSaveConfigDialogOpen] = useState(false);
  const [configName, setConfigName] = useState('');
  
  const { configs, createConfig } = useLabelConfigs();

  // Scanner physique pour remplir automatiquement le code-barres
  // Désactivé par défaut pour permettre la saisie normale
  usePhysicalScanner({
    onScan: (barcode) => {
      if (productDialogOpen) {
        console.log('[ProductsManagement] Scanner physique - code-barres détecté:', barcode);
        setForm((prev) => ({ ...prev, barcode }));
      }
    },
    enabled: productDialogOpen, // Actif uniquement quand le dialogue est ouvert
    minLength: 8,
    timeout: 350,
    captureInInputs: false, // Ne pas intercepter - laisser la saisie normale fonctionner
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (stockFilter === 'out') return matchesSearch && p.stock === 0;
    if (stockFilter === 'low') return matchesSearch && p.stock > 0 && p.stock <= (p.min_stock || 0);
    return matchesSearch;
  });

  const openNewProduct = () => {
    setEditingProduct(null);
    setForm({ 
      name: '', 
      barcode: '', 
      price: '', 
      stock: '', 
      vat_rate: '21', 
      min_stock: '0', 
      unit: 'pièce',
      type: 'unit',
      category_id: '',
    });
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
      unit: p.unit || 'pièce',
      type: p.type || 'unit',
      category_id: p.category_id || '',
    });
    setProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    const name = form.name.trim();
    const price = parseFloat(form.price);
    const stock = parseFloat(form.stock || '0');
    const vat_rate = parseFloat(form.vat_rate || '21');
    const min_stock = parseFloat(form.min_stock || '0');
    
    if (!name || isNaN(price)) {
      toast({
        title: 'Erreur',
        description: 'Le nom et le prix sont requis',
        variant: 'destructive',
      });
      return;
    }

    if (!form.category_id) {
      toast({
        title: 'Erreur',
        description: 'La catégorie est obligatoire',
        variant: 'destructive',
      });
      return;
    }

    const barcodeNormalized = normalizeBarcodeInput((form.barcode || '').trim());

    const payload: any = {
      name,
      barcode: barcodeNormalized || null,
      price,
      stock,
      vat_rate,
      min_stock,
      unit: form.unit || 'pièce',
      type: form.type,
      category_id: form.category_id,
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

  // Gestion du système d'étiquettes A4
  const handleAutoAssign = (selectedProducts: { product: any; copies: number }[]) => {
    const newSlots: LabelSlot[] = [];
    let position = 1;
    
    selectedProducts.forEach(({ product, copies }) => {
      for (let i = 0; i < copies; i++) {
        newSlots.push({
          position: position++,
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          price: product.price,
        });
      }
    });
    
    setLabelSlots(newSlots);
    toast({
      title: 'Produits assignés',
      description: `${newSlots.length} étiquette(s) ont été assignées automatiquement.`,
    });
  };

  const handlePrintA4Labels = () => {
    if (labelSlots.length === 0) {
      toast({
        title: 'Aucune étiquette',
        description: 'Veuillez d\'abord assigner des produits.',
        variant: 'destructive',
      });
      return;
    }

    const doc = generateA4LabelsPDF({
      format: selectedFormat,
      slots: labelSlots,
      template: labelTemplate,
      showCutLines: true,
    });

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
    
    toast({
      title: 'Impression lancée',
      description: 'Le document PDF a été généré et envoyé à l\'imprimante.',
    });
  };

  const handleSaveConfiguration = () => {
    if (!configName.trim()) {
      toast({
        title: 'Nom requis',
        description: 'Veuillez entrer un nom pour la configuration.',
        variant: 'destructive',
      });
      return;
    }

    createConfig({
      name: configName,
      format: selectedFormat,
      template: labelTemplate,
    });

    setSaveConfigDialogOpen(false);
    setConfigName('');
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
                <div className="flex gap-3 mb-3">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center bg-muted rounded">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{product.name}</h3>
                        {product.barcode && (
                          <Badge variant="outline" className="mt-1 font-mono text-xs">
                            {product.barcode}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditProduct(product)} title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(product)} title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
            <DialogDescription>
              Remplissez les informations du produit. Les champs marqués d'un * sont obligatoires.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name">Nom *</Label>
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
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="type">Type de produit</Label>
              <Select value={form.type} onValueChange={(v: 'unit' | 'weight') => setForm({ ...form, type: v })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Unité</SelectItem>
                  <SelectItem value="weight">Poids</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="unit">Unité de mesure</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="price">Prix *</Label>
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
          </div>
          
          {editingProduct && (
            <div className="mt-4">
              <ProductBarcodesManager productId={editingProduct.id} />
            </div>
          )}
          
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Impression d'étiquettes sur feuille A4</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setTemplateEditorOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier le design
                </Button>
                <Button variant="outline" onClick={() => setSaveConfigDialogOpen(true)} disabled={labelSlots.length === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauver la config
                </Button>
                <Button onClick={handlePrintA4Labels} disabled={labelSlots.length === 0}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer A4
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne gauche : Sélection des produits */}
              <div className="lg:col-span-1">
                <LabelProductSelector
                  products={filteredProducts}
                  onAutoAssign={handleAutoAssign}
                />
              </div>

              {/* Colonne droite : Layout A4 */}
              <div className="lg:col-span-2">
                <A4LabelLayout
                  format={selectedFormat}
                  onFormatChange={setSelectedFormat}
                  slots={labelSlots}
                  onSlotsChange={setLabelSlots}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Dialogs */}
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

      <LabelDesignEditor
        open={templateEditorOpen}
        onOpenChange={setTemplateEditorOpen}
        labelSize="custom"
        customWidth={selectedFormat.width}
        customHeight={selectedFormat.height}
        onSaveTemplate={setLabelTemplate}
        currentTemplate={labelTemplate}
      />

      <Dialog open={saveConfigDialogOpen} onOpenChange={setSaveConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder la configuration</DialogTitle>
            <DialogDescription>
              Enregistrez votre disposition d'étiquettes pour la réutiliser plus tard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom de la configuration</Label>
              <Input
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="Ex: Étiquettes promotionnelles"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSaveConfigDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveConfiguration}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};
