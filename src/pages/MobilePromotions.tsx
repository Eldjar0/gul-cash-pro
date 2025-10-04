import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Plus,
  Edit,
  RefreshCw,
  Trash2,
  Tag,
  Percent,
  Gift,
  TrendingDown,
  Search,
  Calendar,
} from 'lucide-react';
import { usePromotions, useSavePromotions, Promotion } from '@/hooks/usePromotions';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { toast } from 'sonner';

type PromotionType = 
  | 'percentage' // % de réduction
  | 'fixed' // Montant fixe de réduction
  | 'buy_x_get_y' // Acheter X, obtenir Y
  | 'buy_x_percent_y' // Acheter X, Y% sur autres produits
  | 'product_gift'; // Acheter A = B offert

export default function MobilePromotions() {
  const { data: promotions = [] } = usePromotions();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const saveMutation = useSavePromotions();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [currentFieldType, setCurrentFieldType] = useState<'main' | 'free'>('main');
  
  // Physical scan detection states
  const [physicalScanDialogOpen, setPhysicalScanDialogOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage' as PromotionType,
    value: '',
    min_purchase: '',
    buy_quantity: '1',
    get_quantity: '1',
    applicable_products: [] as string[],
    free_products: [] as string[],
    applicable_categories: [] as string[],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true,
  });

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
    if (!normalized || normalized.length < 3) return;

    const found = products?.find(
      (p) => p.barcode && normalizeBarcode(p.barcode).toLowerCase() === normalized.toLowerCase()
    );

    if (found) {
      // Ajouter le produit selon le champ actif
      if (currentFieldType === 'main') {
        if (!formData.applicable_products.includes(found.id)) {
          setFormData(prev => ({
            ...prev,
            applicable_products: [...prev.applicable_products, found.id]
          }));
          toast.success(`Produit ajouté: ${found.name}`);
        } else {
          toast.info('Produit déjà ajouté');
        }
      } else {
        if (!formData.free_products.includes(found.id)) {
          setFormData(prev => ({
            ...prev,
            free_products: [...prev.free_products, found.id]
          }));
          toast.success(`Produit offert ajouté: ${found.name}`);
        } else {
          toast.info('Produit déjà ajouté');
        }
      }
    } else {
      toast.error(`Produit non trouvé: ${normalized}`);
    }
  };

  // Détection du scanner physique
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = 0;
    let isScanning = false;
    let timeoutId: NodeJS.Timeout | null = null;
    let scanStartTime = 0;

    const isEditableField = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const hasOpenDialog = document.querySelector('[role="dialog"]') !== null;
      if (hasOpenDialog) return true;
      
      let element: HTMLElement | null = target;
      while (element) {
        if (element.hasAttribute('data-scan-ignore')) return true;
        element = element.parentElement;
      }
      
      const tagName = target.tagName.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    };

    const mapEventToDigit = (e: KeyboardEvent): string | null => {
      const code = e.code;
      if (code && code.startsWith('Digit')) return code.replace('Digit', '');
      if (code && code.startsWith('Numpad')) return code.replace('Numpad', '');
      if (!code && /^[0-9]$/.test(e.key)) return e.key;
      return null;
    };

    const processScan = () => {
      if (buffer.length >= 3 && view === 'form') {
        handlePhysicalScan(buffer);
      }
      buffer = "";
      isScanning = false;
      scanStartTime = 0;
    };

    const handler = (e: KeyboardEvent) => {
      if (document.hidden || view !== 'form') return;

      const now = Date.now();
      const delta = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === 'Enter' || e.key === 'Tab') {
        if (isScanning && buffer.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          if (timeoutId) clearTimeout(timeoutId);
          processScan();
        }
        return;
      }

      if (e.key.length === 1) {
        const digit = mapEventToDigit(e);

        if (buffer.length === 0) {
          if (isEditableField(e.target)) return;
          if (digit !== null) {
            scanStartTime = now;
            isScanning = true;
            e.preventDefault();
            e.stopPropagation();
            buffer += digit;
          }
        } else {
          if (digit !== null) {
            buffer += digit;
            e.preventDefault();
            e.stopPropagation();
          }
        }

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(processScan, 500);
      }
    };

    document.addEventListener('keydown', handler, true);
    return () => {
      document.removeEventListener('keydown', handler, true);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [products, view, formData, currentFieldType]);

  const handleOpenForm = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        name: promo.name,
        type: promo.type as PromotionType,
        value: promo.value.toString(),
        min_purchase: promo.min_purchase?.toString() || '',
        buy_quantity: (promo as any).buy_quantity?.toString() || '1',
        get_quantity: (promo as any).get_quantity?.toString() || '1',
        applicable_products: promo.applicable_products || [],
        free_products: (promo as any).free_products || [],
        applicable_categories: promo.applicable_categories || [],
        start_date: promo.start_date.split('T')[0],
        end_date: promo.end_date.split('T')[0],
        is_active: promo.is_active,
      });
    } else {
      setEditingPromo(null);
      setFormData({
        name: '',
        type: 'percentage',
        value: '',
        min_purchase: '',
        buy_quantity: '1',
        get_quantity: '1',
        applicable_products: [],
        free_products: [],
        applicable_categories: [],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true,
      });
    }
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.value) {
      toast.error('Nom et valeur requis');
      return;
    }

    const newPromo: Promotion = {
      id: editingPromo?.id || crypto.randomUUID(),
      name: formData.name,
      type: formData.type,
      value: parseFloat(formData.value),
      min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : undefined,
      applicable_products: formData.applicable_products.length > 0 ? formData.applicable_products : undefined,
      applicable_categories: formData.applicable_categories.length > 0 ? formData.applicable_categories : undefined,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      is_active: formData.is_active,
      created_at: editingPromo?.created_at || new Date().toISOString(),
      ...(formData.type === 'buy_x_get_y' || formData.type === 'buy_x_percent_y' ? {
        buy_quantity: parseInt(formData.buy_quantity),
        get_quantity: parseInt(formData.get_quantity),
      } : {}),
      ...(formData.type === 'product_gift' ? {
        free_products: formData.free_products,
      } : {}),
    } as any;

    const updatedPromos = editingPromo
      ? promotions.map(p => p.id === editingPromo.id ? newPromo : p)
      : [...promotions, newPromo];

    try {
      await saveMutation.mutateAsync(updatedPromos);
      setView('list');
      toast.success(editingPromo ? 'Promotion modifiée' : 'Promotion créée');
    } catch (error) {
      console.error('Error saving promotion:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const updatedPromos = promotions.filter(p => p.id !== id);
    try {
      await saveMutation.mutateAsync(updatedPromos);
      toast.success('Promotion supprimée');
    } catch (error) {
      console.error('Error deleting promotion:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage': return '% Réduction';
      case 'fixed': return 'Montant fixe';
      case 'buy_x_get_y': return 'Achetez X = Y offerts';
      case 'buy_x_percent_y': return 'Achetez X = % sur Y';
      case 'product_gift': return 'Produit offert';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'fixed': return <TrendingDown className="h-4 w-4" />;
      case 'buy_x_get_y': return <Gift className="h-4 w-4" />;
      case 'buy_x_percent_y': return <Tag className="h-4 w-4" />;
      case 'product_gift': return <Gift className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const filteredProducts = products.filter(p => 
    !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProduct = (productId: string) => {
    if (currentFieldType === 'main') {
      setFormData(prev => ({
        ...prev,
        applicable_products: prev.applicable_products.includes(productId)
          ? prev.applicable_products.filter(id => id !== productId)
          : [...prev.applicable_products, productId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        free_products: prev.free_products.includes(productId)
          ? prev.free_products.filter(id => id !== productId)
          : [...prev.free_products, productId]
      }));
    }
  };

  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4">
        <div className="max-w-md mx-auto space-y-6 pb-20">
          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-black">Promotions</h1>
              <p className="text-sm text-muted-foreground">{promotions.length} promotions</p>
            </div>
            <Button
              onClick={() => handleOpenForm()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.reload()}
              className="opacity-50 hover:opacity-100"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3">
              {promotions.length === 0 ? (
                <Card className="p-8 text-center">
                  <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucune promotion</p>
                  <Button
                    onClick={() => handleOpenForm()}
                    className="mt-4 gap-2"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Créer une promotion
                  </Button>
                </Card>
              ) : (
                promotions.map((promo) => (
                  <Card key={promo.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{promo.name}</h3>
                          <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                            {promo.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getTypeIcon(promo.type)}
                          <span>{getTypeLabel(promo.type)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenForm(promo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(promo.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {promo.type === 'percentage' ? `${promo.value}%` : `${promo.value}€`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4">
      <div className="max-w-md mx-auto pb-20">
        <div className="flex items-center gap-3 pt-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView('list')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-black">
            {editingPromo ? 'Modifier' : 'Nouvelle'} Promotion
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Nom de la promotion *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Soldes d'été"
                data-scan-ignore="true"
              />
            </div>

            <div className="space-y-2">
              <Label>Type de promotion *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: PromotionType) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger data-scan-ignore="true">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Pourcentage de réduction
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Montant fixe de réduction
                    </div>
                  </SelectItem>
                  <SelectItem value="buy_x_get_y">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Achetez X = Y offerts
                    </div>
                  </SelectItem>
                  <SelectItem value="buy_x_percent_y">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Achetez X = % sur Y
                    </div>
                  </SelectItem>
                  <SelectItem value="product_gift">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Produit offert
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.type === 'buy_x_get_y' || formData.type === 'buy_x_percent_y') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Quantité à acheter</Label>
                  <Input
                    type="number"
                    value={formData.buy_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, buy_quantity: e.target.value }))}
                    placeholder="1"
                    data-scan-ignore="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{formData.type === 'buy_x_get_y' ? 'Quantité offerte' : '% de réduction'}</Label>
                  <Input
                    type="number"
                    value={formData.type === 'buy_x_get_y' ? formData.get_quantity : formData.value}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      [formData.type === 'buy_x_get_y' ? 'get_quantity' : 'value']: e.target.value 
                    }))}
                    placeholder={formData.type === 'buy_x_get_y' ? '1' : '10'}
                    data-scan-ignore="true"
                  />
                </div>
              </div>
            )}

            {formData.type !== 'buy_x_get_y' && formData.type !== 'buy_x_percent_y' && (
              <div className="space-y-2">
                <Label>
                  {formData.type === 'percentage' ? 'Pourcentage' : 'Montant'} *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={formData.type === 'percentage' ? '10' : '5.00'}
                  data-scan-ignore="true"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Achat minimum (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.min_purchase}
                onChange={(e) => setFormData(prev => ({ ...prev, min_purchase: e.target.value }))}
                placeholder="0"
                data-scan-ignore="true"
              />
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  {formData.type === 'product_gift' ? 'Produits concernés' : 'Produits applicables'}
                  {formData.type === 'product_gift' && ' (à acheter)'}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentFieldType('main');
                    setProductSearchOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Scannez ou sélectionnez les produits
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.applicable_products.map(id => {
                  const product = products.find(p => p.id === id);
                  return product ? (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {product.name}
                      <button
                        type="button"
                        onClick={() => toggleProduct(id)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>

            {formData.type === 'product_gift' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Produits offerts</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentFieldType('free');
                      setProductSearchOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Produits qui seront offerts
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.free_products.map(id => {
                    const product = products.find(p => p.id === id);
                    return product ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        🎁 {product.name}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              free_products: prev.free_products.filter(pid => pid !== id)
                            }));
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Catégories applicables</Label>
              <Select
                value={formData.applicable_categories[0] || undefined}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  applicable_categories: value ? [value] : [] 
                }))}
              >
                <SelectTrigger data-scan-ignore="true">
                  <SelectValue placeholder="Toutes les catégories" />
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
          </Card>

          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  data-scan-ignore="true"
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  data-scan-ignore="true"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Promotion active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setView('list')}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={saveMutation.isPending}
            >
              {editingPromo ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>

        <Dialog open={productSearchOpen} onOpenChange={setProductSearchOpen}>
          <DialogContent className="max-w-md max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                {currentFieldType === 'main' ? 'Sélectionner produits' : 'Sélectionner produits offerts'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-scan-ignore="true"
                />
              </div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredProducts.map((product) => {
                    const isSelected = currentFieldType === 'main'
                      ? formData.applicable_products.includes(product.id)
                      : formData.free_products.includes(product.id);
                    
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => toggleProduct(product.id)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.barcode} - {product.price.toFixed(2)}€
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
              <Button
                type="button"
                onClick={() => setProductSearchOpen(false)}
                className="w-full"
              >
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
