import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Plus, Trash2, Package, Calendar, ArrowLeft } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useStockMovements } from '@/hooks/useStockMovements';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface LossEntry {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  reason: string;
  notes: string;
  created_at: string;
  value: number;
}

const LOSS_REASONS = [
  { value: 'expired', label: 'Périmé' },
  { value: 'damaged', label: 'Endommagé' },
  { value: 'stolen', label: 'Vol' },
  { value: 'broken', label: 'Cassé' },
  { value: 'defective', label: 'Défectueux' },
  { value: 'other', label: 'Autre' },
];

export default function Losses() {
  const navigate = useNavigate();
  const { data: products } = useProducts();
  const { data: movements, refetch: refetchMovements } = useStockMovements();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter loss movements (damage type is used for losses)
  const lossMovements = movements?.filter(m => m.movement_type === 'damage') || [];

  // Calculate total loss value
  const totalLossValue = lossMovements.reduce((sum, m) => {
    const product = products?.find(p => p.id === m.product_id);
    return sum + (Math.abs(m.quantity) * (product?.cost_price || product?.price || 0));
  }, 0);

  const handleAddLoss = async () => {
    if (!selectedProduct || !quantity || !reason) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const product = products?.find(p => p.id === selectedProduct);
    if (!product) {
      toast.error('Produit non trouvé');
      return;
    }

    const qty = parseFloat(quantity);
    if (qty <= 0) {
      toast.error('La quantité doit être positive');
      return;
    }

    if (product.stock !== null && qty > product.stock) {
      toast.error('Quantité supérieure au stock disponible');
      return;
    }

    try {
      // Create stock movement for loss (using 'damage' type which is in the allowed enum)
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: product.id,
          product_name: product.name,
          product_barcode: product.barcode,
          quantity: -qty,
          previous_stock: product.stock || 0,
          new_stock: (product.stock || 0) - qty,
          movement_type: 'damage',
          reason: LOSS_REASONS.find(r => r.value === reason)?.label || reason,
          notes: notes || null,
        });

      if (movementError) throw movementError;

      // Update product stock
      const { error: productError } = await supabase
        .from('products')
        .update({ stock: (product.stock || 0) - qty })
        .eq('id', product.id);

      if (productError) throw productError;

      toast.success('Perte enregistrée avec succès');
      
      // Reset form
      setDialogOpen(false);
      setSelectedProduct('');
      setQuantity('1');
      setReason('');
      setNotes('');
      
      // Refresh data
      refetchMovements();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Error recording loss:', error);
      toast.error('Erreur lors de l\'enregistrement de la perte');
    }
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                Gestion des Pertes
              </h1>
              <p className="text-muted-foreground">Enregistrez les pertes de stock (périmés, endommagés, vols...)</p>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-destructive hover:bg-destructive/90">
            <Plus className="h-4 w-4 mr-2" />
            Déclarer une perte
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pertes (Mois)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {lossMovements.filter(m => {
                  const date = new Date(m.created_at || '');
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">articles perdus ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valeur des Pertes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {totalLossValue.toFixed(2)} €
              </div>
              <p className="text-xs text-muted-foreground">valeur totale perdue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Raison Principale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const reasons = lossMovements.map(m => m.reason).filter(Boolean);
                  if (reasons.length === 0) return '-';
                  const counts = reasons.reduce((acc, r) => {
                    acc[r || 'Autre'] = (acc[r || 'Autre'] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
                })()}
              </div>
              <p className="text-xs text-muted-foreground">cause la plus fréquente</p>
            </CardContent>
          </Card>
        </div>

        {/* Loss History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historique des Pertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lossMovements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune perte enregistrée</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Valeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lossMovements.slice(0, 50).map((movement) => {
                    const product = products?.find(p => p.id === movement.product_id);
                    const costPrice = product?.cost_price ?? product?.price ?? 0;
                    const value = Math.abs(movement.quantity) * costPrice;
                    
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {movement.created_at 
                            ? format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="font-medium">{movement.product_name}</TableCell>
                        <TableCell className="text-destructive font-medium">
                          -{Math.abs(movement.quantity)}
                        </TableCell>
                        <TableCell>{movement.reason || '-'}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {movement.notes || '-'}
                        </TableCell>
                        <TableCell className="text-right text-destructive font-medium">
                          {value.toFixed(2)} €
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Loss Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Déclarer une perte
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product Search */}
            <div className="space-y-2">
              <Label>Produit *</Label>
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {filteredProducts.slice(0, 10).map((product) => (
                    <button
                      key={product.id}
                      className={`w-full text-left px-3 py-2 hover:bg-muted flex justify-between ${
                        selectedProduct === product.id ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => {
                        setSelectedProduct(product.id);
                        setSearchTerm(product.name);
                      }}
                    >
                      <span>{product.name}</span>
                      <span className="text-muted-foreground text-sm">Stock: {product.stock ?? 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantité *</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Raison *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une raison" />
                </SelectTrigger>
                <SelectContent>
                  {LOSS_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                placeholder="Détails supplémentaires..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddLoss}
              className="bg-destructive hover:bg-destructive/90"
            >
              Enregistrer la perte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
