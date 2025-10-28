import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from './MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Scan, Plus, TrendingUp, TrendingDown, Camera, X, Image as ImageIcon } from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useSuppliers } from '@/hooks/useSuppliers';
import { MobileBarcodeScanner } from './MobileBarcodeScanner';
import { SupplierQuickCreateDialog } from './SupplierQuickCreateDialog';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { PRODUCT_UNITS } from '@/data/units';
import { supabase } from '@/integrations/supabase/client';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export const MobileProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: suppliers = [] } = useSuppliers();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const isEditing = id !== 'new';
  const product = isEditing ? products.find(p => p.id === id) : null;
  const barcodeParam = searchParams.get('barcode');

  const [formData, setFormData] = useState({
    barcode: barcodeParam || '',
    name: '',
    description: '',
    price: '',
    cost_price: '',
    type: 'unit' as 'unit' | 'weight',
    unit: 'pièce',
    category_id: '',
    vat_rate: '6',
    stock: '',
    min_stock: '',
    supplier_id: '',
  });

  // Calcul de la marge
  const margin = useMemo(() => {
    const price = parseFloat(formData.price);
    const cost = parseFloat(formData.cost_price);
    
    if (!price || !cost || price === 0) return null;
    
    const marginAmount = price - cost;
    const marginPercent = (marginAmount / price) * 100;
    
    return {
      amount: marginAmount,
      percent: marginPercent,
      isProfit: marginAmount > 0,
    };
  }, [formData.price, formData.cost_price]);

  useEffect(() => {
    if (product) {
      // Trouver le supplier_id si le produit a un supplier (texte)
      const matchingSupplier = suppliers.find(s => s.name === product.supplier);
      
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
        supplier_id: matchingSupplier?.id || '',
      });
      
      // Charger l'image existante
      if (product.image) {
        setImageUrl(product.image);
      }
    }
  }, [product, suppliers]);

  const takePhoto = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Sur web, utiliser input file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
              setImageUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      // Sur native, utiliser Capacitor Camera
      const photo = await CapacitorCamera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (photo.dataUrl) {
        setImageUrl(photo.dataUrl);
        const response = await fetch(photo.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'product-photo.jpg', { type: 'image/jpeg' });
        setImageFile(file);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      toast.error('Impossible de prendre la photo');
    }
  };

  const pickFromGallery = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Sur web, utiliser input file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
              setImageUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      // Sur native, choisir depuis la galerie
      const photo = await CapacitorCamera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (photo.dataUrl) {
        setImageUrl(photo.dataUrl);
        const response = await fetch(photo.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'product-photo.jpg', { type: 'image/jpeg' });
        setImageFile(file);
      }
    } catch (error) {
      console.error('Erreur lors du choix de photo:', error);
      toast.error('Impossible de choisir la photo');
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl; // Retourner l'URL existante si pas de nouveau fichier

    try {
      setIsUploadingImage(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erreur upload image:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageUrl(null);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast.error('Nom et prix obligatoires');
      return;
    }

    // Upload de l'image si nécessaire
    const uploadedImageUrl = await uploadImage();

    // Trouver le nom du fournisseur
    const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id);
    
    const productData = {
      barcode: formData.barcode || null,
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      vat_rate: parseFloat(formData.vat_rate),
      stock: formData.stock ? parseFloat(formData.stock) : 0,
      min_stock: formData.min_stock ? parseFloat(formData.min_stock) : 0,
      category_id: formData.category_id || null,
      type: formData.type,
      unit: formData.unit,
      supplier: selectedSupplier?.name || null,
      is_active: true,
      image: uploadedImageUrl,
    };

    try {
      if (isEditing && product) {
        await updateProduct.mutateAsync({ id: product.id, ...productData });
        toast.success('Produit modifié');
      } else {
        await createProduct.mutateAsync(productData);
        toast.success('Produit créé');
      }
      navigate('/mobile/products');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <MobileLayout
      title={isEditing ? 'Modifier Produit' : 'Nouveau Produit'}
      actions={
        <Button
          size="icon"
          variant="outline"
          onClick={() => setScannerOpen(true)}
        >
          <Scan className="h-5 w-5" />
        </Button>
      }
    >
      <ScrollArea className="h-[calc(100vh-80px)]">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Photo du produit */}
          <Card className="p-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Photo du produit</Label>
              
              {imageUrl ? (
                <div className="relative">
                  <img 
                    src={imageUrl} 
                    alt="Produit" 
                    className="w-full h-48 object-cover rounded-lg border-2 border-primary/20"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 rounded-full shadow-lg"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-32 flex flex-col gap-2 border-dashed border-2 hover:bg-primary/10 hover:border-primary"
                    onClick={takePhoto}
                  >
                    <Camera className="h-8 w-8 text-primary" />
                    <span className="text-sm font-medium">Prendre photo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-32 flex flex-col gap-2 border-dashed border-2 hover:bg-primary/10 hover:border-primary"
                    onClick={pickFromGallery}
                  >
                    <ImageIcon className="h-8 w-8 text-primary" />
                    <span className="text-sm font-medium">Galerie</span>
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Code-barres */}
          <Card className="p-4">
            <div className="space-y-2">
              <Label>Code-barres</Label>
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Scannez ou saisissez"
              />
            </div>
          </Card>

          {/* Informations de base */}
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom du produit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
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
                      <div className="flex items-center gap-2">
                        {cat.icon && <DynamicIcon name={cat.icon} className="h-4 w-4" />}
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Prix */}
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix de vente * (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Prix d'achat (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Affichage de la marge */}
            {margin && (
              <Card className={`p-3 ${margin.isProfit ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {margin.isProfit ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {margin.isProfit ? 'Gain' : 'Perte'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${margin.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                      {margin.percent > 0 ? '+' : ''}{margin.percent.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {margin.amount > 0 ? '+' : ''}{margin.amount.toFixed(2)}€
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              <Label>TVA (%)</Label>
              <Select
                value={formData.vat_rate}
                onValueChange={(value) => setFormData({ ...formData, vat_rate: value })}
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
            </div>
          </Card>

          {/* Type et unité */}
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Type de produit</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'unit' | 'weight') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">À l'unité</SelectItem>
                  <SelectItem value="weight">Au poids</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unité</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Stock */}
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock minimum</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fournisseur</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter(s => s.is_active).map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setSupplierDialogOpen(true)}
                  title="Créer un fournisseur"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Button
            type="submit"
            className="w-full h-14 text-lg"
            disabled={createProduct.isPending || updateProduct.isPending || isUploadingImage}
          >
            <Save className="h-5 w-5 mr-2" />
            {isUploadingImage ? 'Upload en cours...' : isEditing ? 'Enregistrer' : 'Créer le produit'}
          </Button>
        </form>
      </ScrollArea>

      {/* Scanner pour code-barres */}
      <MobileBarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onProductFound={(foundProduct) => {
          setFormData({ ...formData, barcode: foundProduct.barcode || '' });
          setScannerOpen(false);
          toast.info('Code-barres déjà utilisé par ' + foundProduct.name);
        }}
        onProductNotFound={(barcode) => {
          setFormData({ ...formData, barcode });
          setScannerOpen(false);
        }}
      />

      {/* Dialog création fournisseur rapide */}
      <SupplierQuickCreateDialog
        open={supplierDialogOpen}
        onClose={() => setSupplierDialogOpen(false)}
        onCreated={(supplierId) => {
          setFormData({ ...formData, supplier_id: supplierId });
        }}
      />
    </MobileLayout>
  );
};

export default MobileProductForm;
