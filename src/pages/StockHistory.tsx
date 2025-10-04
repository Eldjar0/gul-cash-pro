import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, Package, AlertCircle, ArrowUpDown, ShoppingCart, Undo2 } from 'lucide-react';
import { useStockMovements } from '@/hooks/useStockMovements';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const movementTypeColors = {
  in: 'bg-green-500',
  out: 'bg-red-500',
  adjustment: 'bg-blue-500',
  sale: 'bg-purple-500',
  refund: 'bg-orange-500',
  damage: 'bg-gray-500',
  transfer: 'bg-cyan-500',
};

const movementTypeLabels = {
  in: 'Entrée',
  out: 'Sortie',
  adjustment: 'Ajustement',
  sale: 'Vente',
  refund: 'Remboursement',
  damage: 'Casse/Perte',
  transfer: 'Transfert',
};

const movementTypeIcons = {
  in: TrendingUp,
  out: TrendingDown,
  adjustment: ArrowUpDown,
  sale: ShoppingCart,
  refund: Undo2,
  damage: AlertCircle,
  transfer: Package,
};

export default function StockHistory() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { data: movements = [], isLoading } = useStockMovements();

  const filteredMovements = movements.filter(m => {
    const matchesSearch = m.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.product_barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || m.movement_type === typeFilter;

    return matchesSearch && matchesType;
  });

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
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b border-primary/20 px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/products')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Historique des Stocks</h1>
              <p className="text-sm text-white/80">{movements.length} mouvement(s) enregistré(s)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type de mouvement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="in">Entrée</SelectItem>
                    <SelectItem value="out">Sortie</SelectItem>
                    <SelectItem value="adjustment">Ajustement</SelectItem>
                    <SelectItem value="sale">Vente</SelectItem>
                    <SelectItem value="refund">Remboursement</SelectItem>
                    <SelectItem value="damage">Casse/Perte</SelectItem>
                    <SelectItem value="transfer">Transfert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredMovements.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              {searchTerm || typeFilter !== 'all' ? 'Aucun mouvement trouvé' : 'Aucun mouvement de stock enregistré'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMovements.map(movement => {
              const Icon = movementTypeIcons[movement.movement_type];
              const isPositive = movement.quantity > 0;

              return (
                <Card key={movement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-lg ${movementTypeColors[movement.movement_type]} text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{movement.product_name}</h3>
                            {movement.product_barcode && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {movement.product_barcode}
                              </Badge>
                            )}
                            <Badge className={movementTypeColors[movement.movement_type]}>
                              {movementTypeLabels[movement.movement_type]}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Quantité</p>
                              <p className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '+' : ''}{movement.quantity}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Stock précédent</p>
                              <p className="font-semibold">{movement.previous_stock}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Nouveau stock</p>
                              <p className="font-semibold">{movement.new_stock}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Date</p>
                              <p className="font-semibold">
                                {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </p>
                            </div>
                          </div>

                          {movement.reason && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Raison:</span> {movement.reason}
                            </p>
                          )}

                          {movement.notes && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Notes:</span> {movement.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
