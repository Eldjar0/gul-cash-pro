import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scan, CheckCircle2, AlertCircle, Edit, Plus, Barcode, DollarSign, Package, Calculator, Calendar, Clock, Cloud, Home } from 'lucide-react';
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
  
  // Sons optimisés
  const successSound = useRef<HTMLAudioElement | null>(null);
  const errorSound = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Sons de notification plus agréables
    successSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTQIGWi77eeeTRAMUKfj8LZjHAY4ktfx');
    errorSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgH9+fn5+fX19fHx8e3t7enp6eXl5eHh4d3d3dnZ2dXV1dHR0c3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nz');
  }, []);

  useEffect(() => {
    // Auto-focus input for barcode scanner and keep it focused
    const keepFocused = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Focus immediately
    keepFocused();

    // Keep checking every 100ms to maintain focus
    const interval = setInterval(keepFocused, 100);

    // Also refocus on any click
    document.addEventListener('click', keepFocused);
    document.addEventListener('touchstart', keepFocused);

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', keepFocused);
      document.removeEventListener('touchstart', keepFocused);
    };
  }, []);

  useEffect(() => {
    // Update time every second
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

    // Vérifier si le produit existe
    const product = products?.find(p => p.barcode === scannedBarcode.trim());
    
    if (!product) {
      setScannedItems(prev => [
        { barcode: scannedBarcode, time: new Date().toLocaleTimeString(), success: false },
        ...prev.slice(0, 19)
      ]);
      errorSound.current?.play().catch(() => {});
      toast.error('Produit inconnu', {
        description: 'Code-barres non trouvé dans le système',
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
          <p className="text-muted-foreground">Connexion à la session...</p>
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
            <CardDescription>
              Cette session de scan n'existe pas ou a expiré.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Retour à la caisse
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lastScannedProduct = scannedItems.length > 0 && scannedItems[0].success
    ? products?.find(p => p.barcode === scannedItems[0].barcode)
    : null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500">
      {/* Header avec infos */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Info gauche: Date et Heure */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold text-sm">{formatDate(currentTime)}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl">
                <Clock className="h-6 w-6" />
                <span className="font-bold text-2xl tabular-nums">{formatTime(currentTime)}</span>
              </div>
            </div>

            {/* Centre: Status */}
            <Badge className="bg-green-500 text-white border-0 px-4 py-2 text-base font-bold">
              <div className="h-3 w-3 rounded-full bg-white mr-2 animate-pulse"></div>
              Connecté
            </Badge>

            {/* Info droite: Météo et Actions */}
            <div className="flex items-center gap-3">
              {!weather.loading && !weather.error && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl">
                  <Cloud className="h-5 w-5" />
                  <span className="font-bold text-xl">{weather.temperature}°C</span>
                </div>
              )}
              <Button 
                onClick={() => setShowCalculator(!showCalculator)}
                variant="secondary"
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
              >
                <Calculator className="h-5 w-5 mr-2" />
                Calculatrice
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="secondary" 
                size="lg"
                className="bg-white hover:bg-gray-100 text-black font-bold"
              >
                <Home className="h-5 w-5 mr-2" />
                Retour Caisse
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Fixed height, no scroll */}
      <div className="h-[calc(100vh-88px)] overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          
          {/* Logo + Zone de Scan */}
          <Card className="border-4 border-white/30 shadow-2xl bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur">
            <CardHeader className="text-center pb-4">
              {/* Logo centré */}
              <div className="flex justify-center mb-4">
                <img src={logo} alt="Logo" className="h-24 w-auto drop-shadow-2xl" />
              </div>
              <CardTitle className="text-4xl font-black flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <Scan className="h-12 w-12 text-blue-600" />
                Scanner un produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Scannez ou saisissez le code-barres..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="text-3xl h-24 text-center font-mono font-bold border-4 focus-visible:ring-4"
                  autoFocus
                />
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full h-20 text-2xl"
                  disabled={!barcode.trim()}
                >
                  <CheckCircle2 className="h-8 w-8 mr-3" />
                  Valider le scan
                </Button>
              </form>

              {/* Dernier produit scanné */}
              {lastScannedProduct && (
                <div className="p-6 bg-gradient-to-r from-green-400 to-emerald-500 border-4 border-green-600 rounded-2xl shadow-2xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-8 w-8 text-white drop-shadow-lg" />
                        <span className="text-lg text-white font-bold drop-shadow">✓ Dernier scan réussi</span>
                      </div>
                      <h3 className="text-3xl font-black mb-4 text-white drop-shadow-lg">{lastScannedProduct.name}</h3>
                      <div className="grid grid-cols-2 gap-4 text-base">
                        <div className="bg-white/20 backdrop-blur p-3 rounded-lg">
                          <span className="text-white/80 text-sm">Code:</span>
                          <div className="font-mono font-bold text-white text-lg">{lastScannedProduct.barcode}</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur p-3 rounded-lg">
                          <span className="text-white/80 text-sm">Prix:</span>
                          <div className="font-bold text-white text-lg">{lastScannedProduct.price.toFixed(2)} €</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur p-3 rounded-lg">
                          <span className="text-white/80 text-sm">Stock:</span>
                          <div className="font-bold text-white text-lg">{lastScannedProduct.stock}</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur p-3 rounded-lg">
                          <span className="text-white/80 text-sm">Type:</span>
                          <div className="font-bold text-white text-lg">{lastScannedProduct.type === 'weight' ? 'Poids' : 'Unité'}</div>
                        </div>
                      </div>
                    </div>
                    <Package className="h-20 w-20 text-white/30 drop-shadow-2xl" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hub Actions - Très Gros Carrés Colorés */}
          <div className="grid grid-cols-2 gap-6">
            <Button
              onClick={() => {
                if (lastScannedProduct) {
                  setSelectedProduct(lastScannedProduct);
                  setEditQuantity('1');
                  setEditDialogOpen(true);
                }
              }}
              disabled={!lastScannedProduct}
              className="h-56 flex flex-col items-center justify-center gap-4 text-2xl font-black shadow-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-4 border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
            >
              <Edit className="h-20 w-20 drop-shadow-lg" />
              <span className="drop-shadow">Modifier Quantité</span>
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
              className="h-56 flex flex-col items-center justify-center gap-4 text-2xl font-black shadow-2xl bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-4 border-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
            >
              <DollarSign className="h-20 w-20 drop-shadow-lg" />
              <span className="drop-shadow">Modifier Prix</span>
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
              className="h-56 flex flex-col items-center justify-center gap-4 text-2xl font-black shadow-2xl bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-4 border-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
            >
              <Barcode className="h-20 w-20 drop-shadow-lg" />
              <span className="drop-shadow">Changer Code</span>
            </Button>

            <Button
              onClick={() => {
                setBarcode('');
                setNewProductDialogOpen(true);
              }}
              className="h-56 flex flex-col items-center justify-center gap-4 text-2xl font-black shadow-2xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-4 border-purple-700 transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-20 w-20 drop-shadow-lg" />
              <span className="drop-shadow">Nouveau Produit</span>
            </Button>
          </div>

          {/* Historique des scans */}
          {scannedItems.length > 0 && (
            <Card className="bg-white/90 backdrop-blur border-4 border-indigo-300 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
                <CardTitle className="text-2xl font-black">📋 Historique des scans</CardTitle>
                <CardDescription className="text-white/80 font-semibold">Derniers produits scannés</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-3">
                  {scannedItems.slice(0, 5).map((item, index) => {
                    const product = products?.find(p => p.barcode === item.barcode);
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border-3 flex items-center justify-between shadow-lg transition-all ${
                          item.success 
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-400' 
                            : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.success ? (
                            <CheckCircle2 className="h-7 w-7 text-green-600" />
                          ) : (
                            <AlertCircle className="h-7 w-7 text-red-600" />
                          )}
                          <div>
                            <p className="font-mono font-bold text-lg">{item.barcode}</p>
                            {product && <p className="text-sm font-semibold text-gray-600">{product.name}</p>}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-500">{item.time}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Calculatrice flottante */}
      {showCalculator && (
        <div className="fixed bottom-6 right-6 z-50 animate-scale-in">
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
        </div>
      )}
      
      {/* Dialog Modifier Quantité */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la quantité</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct && (
              <div className="p-3 bg-accent rounded-lg">
                <p className="font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">{selectedProduct.barcode}</p>
              </div>
            )}
            <div>
              <Label>Quantité</Label>
              <Input
                type="number"
                step="0.01"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="text-xl h-14 text-center"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={async () => {
                if (selectedProduct && session) {
                  await addScannedItem.mutateAsync({
                    sessionId: session.id,
                    barcode: selectedProduct.barcode || '',
                    quantity: parseFloat(editQuantity),
                  });
                  toast.success('Quantité ajoutée');
                  setEditDialogOpen(false);
                }
              }}
            >
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouveau Produit */}
      <Dialog open={newProductDialogOpen} onOpenChange={setNewProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau produit</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await createProduct.mutateAsync({
              name: formData.get('name') as string,
              barcode: barcode || formData.get('barcode') as string,
              price: parseFloat(formData.get('price') as string),
              cost_price: parseFloat(formData.get('cost_price') as string) || undefined,
              vat_rate: parseFloat(formData.get('vat_rate') as string),
              type: formData.get('type') as 'unit' | 'weight',
              category_id: formData.get('category_id') as string || undefined,
              stock: parseFloat(formData.get('stock') as string) || 0,
              is_active: true,
            });
            setNewProductDialogOpen(false);
            setBarcode('');
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code-barres</Label>
                <Input name="barcode" defaultValue={barcode} required />
              </div>
              <div>
                <Label>Nom du produit</Label>
                <Input name="name" required />
              </div>
              <div>
                <Label>Prix de vente (€)</Label>
                <Input name="price" type="number" step="0.01" required />
              </div>
              <div>
                <Label>Prix d'achat (€)</Label>
                <Input name="cost_price" type="number" step="0.01" />
              </div>
              <div>
                <Label>TVA (%)</Label>
                <Input name="vat_rate" type="number" step="0.01" defaultValue="21" required />
              </div>
              <div>
                <Label>Type</Label>
                <Select name="type" defaultValue="unit">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Unité</SelectItem>
                    <SelectItem value="weight">Poids</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select name="category_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stock initial</Label>
                <Input name="stock" type="number" step="0.01" defaultValue="0" />
              </div>
            </div>
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Créer le produit
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Changer Code-barres */}
      <Dialog open={changeBarcodeDialogOpen} onOpenChange={setChangeBarcodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le code-barres</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct && (
              <div className="p-3 bg-accent rounded-lg">
                <p className="font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">Actuel: {selectedProduct.barcode}</p>
              </div>
            )}
            <div>
              <Label>Nouveau code-barres</Label>
              <Input
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                placeholder="Scannez ou saisissez"
                className="text-xl h-14 text-center font-mono"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={async () => {
                if (selectedProduct && newBarcode.trim()) {
                  await updateProduct.mutateAsync({
                    id: selectedProduct.id,
                    barcode: newBarcode.trim(),
                  });
                  setChangeBarcodeDialogOpen(false);
                  setNewBarcode('');
                }
              }}
            >
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier Prix */}
      <Dialog open={editPriceDialogOpen} onOpenChange={setEditPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le prix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct && (
              <div className="p-3 bg-accent rounded-lg">
                <p className="font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">Prix actuel: {selectedProduct.price.toFixed(2)} €</p>
              </div>
            )}
            <div>
              <Label>Nouveau prix (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="text-xl h-14 text-center"
                placeholder={selectedProduct?.price.toFixed(2)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={async () => {
                if (selectedProduct && editPrice) {
                  await updateProduct.mutateAsync({
                    id: selectedProduct.id,
                    price: parseFloat(editPrice),
                  });
                  setEditPriceDialogOpen(false);
                  setEditPrice('');
                }
              }}
            >
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
