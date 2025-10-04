import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Truck, ClipboardList, Plus, Edit, Trash2, Phone, Mail, MapPin, User, TrendingUp, TrendingDown, ArrowUpDown, ShoppingCart, Undo2, AlertCircle } from 'lucide-react';
import { BatchesTab } from '@/components/inventory/BatchesTab';
import { PurchaseOrdersTab } from '@/components/inventory/PurchaseOrdersTab';
import { InventoryCountsTab } from '@/components/inventory/InventoryCountsTab';
import { ExpiringBatchesAlert } from '@/components/inventory/ExpiringBatchesAlert';
import { useSuppliers, useSaveSuppliers, Supplier } from '@/hooks/useSuppliers';
import { useStockMovements } from '@/hooks/useStockMovements';
import { toast } from 'sonner';
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

const StockManagement = () => {
  const [activeTab, setActiveTab] = useState('inventory');

  // Suppliers state
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const saveMutation = useSaveSuppliers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    notes: '',
    is_active: true,
  });

  // Stock movements state
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { data: movements = [], isLoading: movementsLoading } = useStockMovements();

  const filteredMovements = movements.filter(m => {
    const matchesSearch = m.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.product_barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || m.movement_type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Suppliers handlers
  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        postal_code: supplier.postal_code || '',
        notes: supplier.notes || '',
        is_active: supplier.is_active,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        notes: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Le nom du fournisseur est obligatoire');
      return;
    }

    const newSupplier: Supplier = {
      id: editingSupplier?.id || crypto.randomUUID(),
      name: formData.name,
      contact_name: formData.contact_name || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      postal_code: formData.postal_code || undefined,
      notes: formData.notes || undefined,
      is_active: formData.is_active,
      created_at: editingSupplier?.created_at || new Date().toISOString(),
    };

    let updatedSuppliers: Supplier[];
    if (editingSupplier) {
      updatedSuppliers = suppliers.map(s => s.id === editingSupplier.id ? newSupplier : s);
    } else {
      updatedSuppliers = [...suppliers, newSupplier];
    }

    await saveMutation.mutateAsync(updatedSuppliers);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) return;

    const updatedSuppliers = suppliers.filter(s => s.id !== id);
    await saveMutation.mutateAsync(updatedSuppliers);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-3 md:px-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion Stock & Fournisseurs</h1>
        <p className="text-muted-foreground">
          Inventaire, fournisseurs et historique des mouvements
        </p>
      </div>

      <ExpiringBatchesAlert />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            Inventaire
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" />
            Fournisseurs
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Tabs defaultValue="batches" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="batches" className="gap-2">
                <Package className="h-4 w-4" />
                Lots & Péremption
              </TabsTrigger>
              <TabsTrigger value="purchase-orders" className="gap-2">
                <Truck className="h-4 w-4" />
                Commandes Fournisseurs
              </TabsTrigger>
              <TabsTrigger value="counts" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Inventaires Physiques
              </TabsTrigger>
            </TabsList>

            <TabsContent value="batches" className="space-y-4">
              <BatchesTab />
            </TabsContent>

            <TabsContent value="purchase-orders" className="space-y-4">
              <PurchaseOrdersTab />
            </TabsContent>

            <TabsContent value="counts" className="space-y-4">
              <InventoryCountsTab />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-5 w-5 mr-2" />
              Nouveau Fournisseur
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rechercher</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Rechercher un fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSuppliers.length === 0 ? (
              <Card className="col-span-full p-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-4">
                  {searchTerm ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur enregistré'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un fournisseur
                  </Button>
                )}
              </Card>
            ) : (
              filteredSuppliers.map(supplier => (
                <Card key={supplier.id} className={supplier.is_active ? '' : 'opacity-60'}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {supplier.name}
                          {!supplier.is_active && (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </CardTitle>
                        {supplier.contact_name && (
                          <CardDescription className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {supplier.contact_name}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {supplier.email && (
                      <p className="text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {supplier.email}
                      </p>
                    )}
                    {supplier.phone && (
                      <p className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {supplier.phone}
                      </p>
                    )}
                    {supplier.address && (
                      <p className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {supplier.address}
                        {supplier.city && `, ${supplier.city}`}
                      </p>
                    )}
                    {supplier.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {supplier.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Supplier Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {editingSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du fournisseur *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom de l'entreprise"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_name">Nom du contact</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@fournisseur.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Rue Example"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Paris"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="75001"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informations supplémentaires..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Fournisseur actif
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1">
                    {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockManagement;
