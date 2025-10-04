import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scan, CheckCircle2, AlertCircle, Edit, Plus, Barcode, DollarSign, Calculator, Calendar, Clock, Cloud, Home } from 'lucide-react';
import { useScanSession, useAddScannedItem } from '@/hooks/useRemoteScan';
import { useProducts, useCreateProduct, useUpdateProduct, Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useWeather } from '@/hooks/useWeather';
import { toast } from 'sonner';
import logo from '@/assets/logo-gul-reyhan-new.png';
import { QuickCalculator } from '@/components/pos/QuickCalculator';

export default function RemoteScanner() {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState('');
  const [scannedItems, setScannedItems] = useState<Array<{ barcode: string; time: string; success: boolean }>>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false);
  const [changeBarcodeDialogOpen, setChangeBarcodeDialogOpen] = useState(false);
  const [editPriceDialogOpen, setEditPriceDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editQuantity, setEditQuantity] = useState('1');
  const [editPrice, setEditPrice] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: session, isLoading, error } = useScanSession(sessionCode);
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const addScannedItem = useAddScannedItem();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const weather = useWeather();
  
  const successSound = useRef<HTMLAudioElement | null>(null);
  const errorSound = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    successSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTQIGWi77eeeTRAMUKfj8LZjHAY4ktfx');
    errorSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgH9+fn5+fX19fHx8e3t7enp6eXl5eHh4d3d3dnZ2dXV1dHR0c3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nz');
  }, []);

  useEffect(() => {
    const keepFocused = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };
    keepFocused();
    const interval = setInterval(keepFocused, 100);
    document.addEventListener('click', keepFocused);
    document.addEventListener('touchstart', keepFocused);
    return () => {
      clearInterval(interval);
      document.removeEventListener('click', keepFocused);
      document.removeEventListener('touchstart', keepFocused);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (error) {
      toast.error('Session invalide ou expirée');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [error, navigate]);

  const handleScan = async (scannedBarcode: string) => {
    if (!session || !scannedBarcode.trim()) return;
    const product = products?.find(p => p.barcode === scannedBarcode.trim());
    
    if (!product) {
      setScannedItems(prev => [
        { barcode: scannedBarcode, time: new Date().toLocaleTimeString(), success: false },
        ...prev.slice(0, 19)
      ]);
      errorSound.current?.play().catch(() => {});
      toast.error('Produit inconnu', {
        description: 'Code-barres non trouvé',
        action: {
          label: 'Créer',
          onClick: () => {
            setBarcode(scannedBarcode);
            setNewProductDialogOpen(true);
          }
        }
      });
      return;
    }

    try {
      await addScannedItem.mutateAsync({
        sessionId: session.id,
        barcode: scannedBarcode.trim(),
        quantity: 1,
      });
      setScannedItems(prev => [
        { barcode: scannedBarcode, time: new Date().toLocaleTimeString(), success: true },
        ...prev.slice(0, 19)
      ]);
      setBarcode('');
      successSound.current?.play().catch(() => {});
      toast.success('Produit scanné', { description: product.name });
    } catch (error) {
      console.error('Error scanning item:', error);
      errorSound.current?.play().catch(() => {});
      toast.error('Erreur de scan');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(barcode);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Connexion...</p>
        </div>
      </div>
    );
  }

  if (error || !session || !session.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/20 to-destructive/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Session Invalide</CardTitle>
            </div>
            <CardDescription>Cette session n'existe pas ou a expiré.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">Retour à la caisse</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lastScannedProduct = scannedItems.length > 0 && scannedItems[0].success
    ? products?.find(p => p.barcode === scannedItems[0].barcode)
    : null;

  const formatTime = (date: Date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (date: Date) => date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      {/* Header Compact Mobile */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl">
        <div className="px-3 py-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur px-2 py-1 rounded-lg text-xs">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-bold tabular-nums">{formatTime(currentTime)}</span>
            </div>
            <Badge className="bg-green-500 text-white border-0 px-2 py-0.5 text-xs font-bold">
              <div className="h-2 w-2 rounded-full bg-white mr-1 animate-pulse"></div>
              Connecté
            </Badge>
            {!weather.loading && !weather.error && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur px-2 py-1 rounded-lg text-xs">
                <Cloud className="h-3.5 w-3.5" />
                <span className="font-bold">{weather.temperature}°C</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-white/10 backdrop-blur px-2 py-1 rounded-lg">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium text-xs">{formatDate(currentTime)}</span>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowCalculator(!showCalculator)}
              size="sm"
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-8 text-xs"
            >
              <Calculator className="h-3.5 w-3.5 mr-1" />
              Calculatrice
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              size="sm"
              className="flex-1 bg-white hover:bg-gray-100 text-black font-bold h-8 text-xs"
            >
              <Home className="h-3.5 w-3.5 mr-1" />
              Caisse
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-140px)] overflow-y-auto">
        <div className="p-3 space-y-3">
          <Card className="border-2 border-white/40 shadow-xl bg-white/95 backdrop-blur">
            <CardHeader className="text-center pb-3 pt-4">
              <div className="flex justify-center mb-2">
                <img src={logo} alt="Logo" className="h-16 w-auto drop-shadow-lg" />
              </div>
              <CardTitle className="text-xl font-black flex items-center justify-center gap-2 text-primary">
                <Scan className="h-6 w-6" />
                Scanner un produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <form onSubmit={handleSubmit} className="space-y-2">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Code-barres..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="text-xl h-14 text-center font-mono font-bold border-2 focus-visible:ring-2"
                  autoFocus
                />
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full h-12 text-base font-bold"
                  disabled={!barcode.trim()}
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Valider
                </Button>
              </form>

              {lastScannedProduct && (
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 border-2 border-green-700 rounded-xl shadow-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-white drop-shadow flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/90 font-bold mb-1">✓ Dernier scan</div>
                      <h3 className="text-lg font-black mb-2 text-white drop-shadow truncate">{lastScannedProduct.name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/20 backdrop-blur p-2 rounded">
                          <span className="text-white/80 block mb-0.5">Code</span>
                          <div className="font-mono font-bold text-white truncate">{lastScannedProduct.barcode}</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur p-2 rounded">
                          <span className="text-white/80 block mb-0.5">Prix</span>
                          <div className="font-bold text-white">{lastScannedProduct.price.toFixed(2)} €</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur p-2 rounded">
                          <span className="text-white/80 block mb-0.5">Stock</span>
                          <div className="font-bold text-white">{lastScannedProduct.stock}</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur p-2 rounded">
                          <span className="text-white/80 block mb-0.5">Type</span>
                          <div className="font-bold text-white">{lastScannedProduct.type === 'weight' ? 'Poids' : 'Unité'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                if (lastScannedProduct) {
                  setSelectedProduct(lastScannedProduct);
                  setEditQuantity('1');
                  setEditDialogOpen(true);
                }
              }}
              disabled={!lastScannedProduct}
              className="h-32 flex flex-col items-center justify-center gap-2 text-base font-black shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-2 border-blue-700 disabled:opacity-50"
            >
              <Edit className="h-10 w-10 drop-shadow" />
              <span className="drop-shadow text-sm leading-tight">Modifier<br/>Quantité</span>
            </Button>

            <Button
              onClick={() => {
                if (lastScannedProduct) {
                  setSelectedProduct(lastScannedProduct);
                  setEditPrice(lastScannedProduct.price.toString());
                  setEditPriceDialogOpen(true);
                }
              }}
              disabled={!lastScannedProduct}
              className="h-32 flex flex-col items-center justify-center gap-2 text-base font-black shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-2 border-green-700 disabled:opacity-50"
            >
              <DollarSign className="h-10 w-10 drop-shadow" />
              <span className="drop-shadow text-sm leading-tight">Modifier<br/>Prix</span>
            </Button>

            <Button
              onClick={() => {
                if (lastScannedProduct) {
                  setSelectedProduct(lastScannedProduct);
                  setNewBarcode('');
                  setChangeBarcodeDialogOpen(true);
                }
              }}
              disabled={!lastScannedProduct}
              className="h-32 flex flex-col items-center justify-center gap-2 text-base font-black shadow-lg bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-2 border-orange-700 disabled:opacity-50"
            >
              <Barcode className="h-10 w-10 drop-shadow" />
              <span className="drop-shadow text-sm leading-tight">Changer<br/>Code</span>
            </Button>

            <Button
              onClick={() => {
                setBarcode('');
                setNewProductDialogOpen(true);
              }}
              className="h-32 flex flex-col items-center justify-center gap-2 text-base font-black shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-2 border-purple-700"
            >
              <Plus className="h-10 w-10 drop-shadow" />
              <span className="drop-shadow text-sm leading-tight">Nouveau<br/>Produit</span>
            </Button>
          </div>

          {/* Historique */}
          {scannedItems.length > 0 && (
            <Card className="bg-white/95 backdrop-blur border-2 border-indigo-300 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg py-3">
                <CardTitle className="text-base font-black">📋 Historique</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 pb-3">
                <div className="space-y-2">
                  {scannedItems.slice(0, 3).map((item, index) => {
                    const product = products?.find(p => p.barcode === item.barcode);
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-2 rounded-lg border ${
                          item.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        {item.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{product?.name || item.barcode}</div>
                          <div className="text-xs text-muted-foreground">{item.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Calculatrice</DialogTitle>
          </DialogHeader>
          <QuickCalculator 
            onProductCode={(code) => {
              setBarcode(code);
              handleScan(code);
              setShowCalculator(false);
            }}
            onCreateProduct={() => {
              setNewProductDialogOpen(true);
              setShowCalculator(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifier la quantité</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Produit</Label>
              <div className="font-bold mt-1">{selectedProduct?.name}</div>
            </div>
            <div>
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                min="1"
                step="1"
                className="text-lg h-12 font-bold"
              />
            </div>
            <Button
              onClick={async () => {
                if (!selectedProduct || !session) return;
                try {
                  await addScannedItem.mutateAsync({
                    sessionId: session.id,
                    barcode: selectedProduct.barcode,
                    quantity: parseInt(editQuantity) || 1,
                  });
                  setEditDialogOpen(false);
                  toast.success('Quantité modifiée');
                } catch (error) {
                  toast.error('Erreur');
                }
              }}
              className="w-full h-12 text-base font-bold"
            >
              Valider
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editPriceDialogOpen} onOpenChange={setEditPriceDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifier le prix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Produit</Label>
              <div className="font-bold mt-1">{selectedProduct?.name}</div>
            </div>
            <div>
              <Label htmlFor="price">Nouveau prix (€)</Label>
              <Input
                id="price"
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                min="0"
                step="0.01"
                className="text-lg h-12 font-bold"
              />
            </div>
            <Button
              onClick={async () => {
                if (!selectedProduct) return;
                try {
                  await updateProduct.mutateAsync({
                    id: selectedProduct.id,
                    price: parseFloat(editPrice),
                  });
                  setEditPriceDialogOpen(false);
                  toast.success('Prix modifié');
                } catch (error) {
                  toast.error('Erreur');
                }
              }}
              className="w-full h-12 text-base font-bold"
            >
              Valider
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={changeBarcodeDialogOpen} onOpenChange={setChangeBarcodeDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Changer le code-barres</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Produit</Label>
              <div className="font-bold mt-1">{selectedProduct?.name}</div>
            </div>
            <div>
              <Label>Code actuel</Label>
              <div className="font-mono mt-1">{selectedProduct?.barcode}</div>
            </div>
            <div>
              <Label htmlFor="newBarcode">Nouveau code-barres</Label>
              <Input
                id="newBarcode"
                type="text"
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                className="text-lg h-12 font-mono font-bold"
              />
            </div>
            <Button
              onClick={async () => {
                if (!selectedProduct || !newBarcode.trim()) return;
                try {
                  await updateProduct.mutateAsync({
                    id: selectedProduct.id,
                    barcode: newBarcode.trim(),
                  });
                  setChangeBarcodeDialogOpen(false);
                  toast.success('Code-barres modifié');
                } catch (error) {
                  toast.error('Erreur');
                }
              }}
              className="w-full h-12 text-base font-bold"
            >
              Valider
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={newProductDialogOpen} onOpenChange={setNewProductDialogOpen}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un produit</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              try {
                await createProduct.mutateAsync({
                  name: formData.get('name') as string,
                  barcode: formData.get('barcode') as string,
                  price: parseFloat(formData.get('price') as string),
                  stock: parseInt(formData.get('stock') as string),
                  min_stock: parseInt(formData.get('min_stock') as string) || 5,
                  category_id: (formData.get('category_id') as string) || null,
                  type: (formData.get('type') as 'unit' | 'weight') || 'unit',
                  vat_rate: 21,
                  is_active: true,
                });
                setNewProductDialogOpen(false);
                toast.success('Produit créé');
              } catch (error) {
                toast.error('Erreur lors de la création');
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" name="name" required className="h-10" />
            </div>
            <div>
              <Label htmlFor="barcode">Code-barres *</Label>
              <Input
                id="barcode"
                name="barcode"
                defaultValue={barcode}
                required
                className="font-mono h-10"
              />
            </div>
            <div>
              <Label htmlFor="price">Prix (€) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                className="h-10"
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                required
                className="h-10"
              />
            </div>
            <div>
              <Label htmlFor="min_stock">Stock minimum</Label>
              <Input
                id="min_stock"
                name="min_stock"
                type="number"
                min="0"
                defaultValue="5"
                className="h-10"
              />
            </div>
            <div>
              <Label htmlFor="category_id">Catégorie</Label>
              <Select name="category_id">
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="unit">
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Unité</SelectItem>
                  <SelectItem value="weight">Poids (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-10 font-bold">
              Créer le produit
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
