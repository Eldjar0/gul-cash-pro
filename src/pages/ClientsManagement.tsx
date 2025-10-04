import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Heart, CreditCard, Tag, Undo2, Users, Award, Gift, TrendingUp, Plus, Edit, Trash2, Calendar, Percent, TrendingDown, Search, Euro, FileText } from 'lucide-react';
import { useLoyaltyTiers } from '@/hooks/useLoyaltyTiers';
import { LoyaltyTransactionsHistory } from '@/components/loyalty/LoyaltyTransactionsHistory';
import { GiftCardsManagement } from '@/components/payments/GiftCardsManagement';
import { CustomerCreditManagement } from '@/components/payments/CustomerCreditManagement';
import { usePromotions, useSavePromotions, Promotion } from '@/hooks/usePromotions';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { RefundDialog } from '@/components/pos/RefundDialog';
import { useRefunds } from '@/hooks/useRefunds';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';

const ClientsManagement = () => {
  const [activeTab, setActiveTab] = useState('loyalty');

  // Loyalty data
  const { data: tiers, isLoading: tiersLoading } = useLoyaltyTiers();

  // Promotions state
  const { data: promotions = [], isLoading: promosLoading } = usePromotions();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const saveMutation = useSavePromotions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'buy_x_get_y',
    value: '',
    min_purchase: '',
    applicable_products: [] as string[],
    applicable_categories: [] as string[],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true,
  });

  // Refunds state
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: refunds = [], isLoading: refundsLoading } = useRefunds();

  const filteredRefunds = refunds.filter((refund) =>
    refund.refund_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayRefunds = refunds.filter((r) => {
    const refundDate = new Date(r.created_at);
    const today = new Date();
    return refundDate.toDateString() === today.toDateString();
  });

  const todayTotal = todayRefunds.reduce((sum, r) => sum + r.total, 0);

  // Promotions handlers
  const handleOpenDialog = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        name: promo.name,
        type: promo.type,
        value: promo.value.toString(),
        min_purchase: promo.min_purchase?.toString() || '',
        applicable_products: promo.applicable_products || [],
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
        applicable_products: [],
        applicable_categories: [],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSavePromo = async () => {
    if (!formData.name || !formData.value) {
      toast.error('Veuillez remplir tous les champs obligatoires');
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
      start_date: formData.start_date + 'T00:00:00Z',
      end_date: formData.end_date + 'T23:59:59Z',
      is_active: formData.is_active,
      created_at: editingPromo?.created_at || new Date().toISOString(),
    };

    let updatedPromos: Promotion[];
    if (editingPromo) {
      updatedPromos = promotions.map(p => p.id === editingPromo.id ? newPromo : p);
    } else {
      updatedPromos = [...promotions, newPromo];
    }

    await saveMutation.mutateAsync(updatedPromos);
    setDialogOpen(false);
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) return;
    const updatedPromos = promotions.filter(p => p.id !== id);
    await saveMutation.mutateAsync(updatedPromos);
  };

  const isActive = (promo: Promotion) => {
    const now = new Date();
    return promo.is_active &&
      new Date(promo.start_date) <= now &&
      new Date(promo.end_date) >= now;
  };

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-3 md:px-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion Clients & Fidélité</h1>
        <p className="text-muted-foreground">
          Fidélité, paiements, promotions et remboursements
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="loyalty" className="gap-2">
            <Heart className="h-4 w-4" />
            Fidélité
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="promotions" className="gap-2">
            <Tag className="h-4 w-4" />
            Promotions
          </TabsTrigger>
          <TabsTrigger value="refunds" className="gap-2">
            <Undo2 className="h-4 w-4" />
            Remboursements
          </TabsTrigger>
        </TabsList>

        {/* Loyalty Tab */}
        <TabsContent value="loyalty" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Membres Actifs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">clients inscrits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Distribués</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">ce mois</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Récompenses</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0 €</div>
                <p className="text-xs text-muted-foreground">valeur utilisée</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux Participation</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">clients actifs</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Niveaux de Fidélité</CardTitle>
              <CardDescription>
                Système de paliers avec avantages progressifs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tiersLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  Chargement...
                </div>
              ) : tiers && tiers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-4">
                  {tiers.map((tier) => (
                    <Card key={tier.id} className="border-2" style={{ borderColor: tier.color }}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{tier.name}</CardTitle>
                          <div 
                            className="h-8 w-8 rounded-full" 
                            style={{ backgroundColor: tier.color }}
                          />
                        </div>
                        <CardDescription>
                          À partir de {tier.min_spent.toFixed(0)} € dépensés
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Remise:</span>
                          <Badge>{tier.discount_percentage}%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Multiplicateur:</span>
                          <Badge variant="outline">x{tier.points_multiplier}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {tier.benefits}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Aucun niveau configuré
                </div>
              )}
            </CardContent>
          </Card>

          <LoyaltyTransactionsHistory />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Tabs defaultValue="gift-cards" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gift-cards" className="gap-2">
                <Gift className="h-4 w-4" />
                Cartes Cadeaux
              </TabsTrigger>
              <TabsTrigger value="restaurant-vouchers" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Tickets Restaurant
              </TabsTrigger>
              <TabsTrigger value="customer-credit" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Crédit Client
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gift-cards" className="space-y-4">
              <GiftCardsManagement />
            </TabsContent>

            <TabsContent value="restaurant-vouchers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tickets Restaurant</CardTitle>
                  <CardDescription>
                    Acceptation tickets restaurant avec plafond légal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Fonctionnalité en cours d'implémentation
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customer-credit" className="space-y-4">
              <CustomerCreditManagement />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle Promotion
            </Button>
          </div>

          <div className="grid gap-4">
            {promotions.length === 0 ? (
              <Card className="p-12 text-center">
                <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-4">Aucune promotion configurée</p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une promotion
                </Button>
              </Card>
            ) : (
              promotions.map(promo => (
                <Card key={promo.id} className={isActive(promo) ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle>{promo.name}</CardTitle>
                          {isActive(promo) && (
                            <Badge className="bg-green-500">Active</Badge>
                          )}
                          {!promo.is_active && (
                            <Badge variant="secondary">Désactivée</Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(promo.start_date).toLocaleDateString('fr-FR')} - {new Date(promo.end_date).toLocaleDateString('fr-FR')}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(promo)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePromo(promo.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Type de réduction</p>
                        <p className="font-semibold flex items-center gap-2">
                          {promo.type === 'percentage' && <><Percent className="h-4 w-4" /> {promo.value}% de réduction</>}
                          {promo.type === 'fixed' && <><TrendingDown className="h-4 w-4" /> {promo.value}€ de réduction</>}
                          {promo.type === 'buy_x_get_y' && <><Gift className="h-4 w-4" /> Offre spéciale</>}
                        </p>
                      </div>
                      {promo.min_purchase && (
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Achat minimum</p>
                          <p className="font-semibold">{promo.min_purchase}€</p>
                        </div>
                      )}
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Application</p>
                        <p className="font-semibold">
                          {promo.applicable_products?.length ? `${promo.applicable_products.length} produit(s)` :
                           promo.applicable_categories?.length ? `${promo.applicable_categories.length} catégorie(s)` :
                           'Tous les produits'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Promotion Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  {editingPromo ? 'Modifier la promotion' : 'Nouvelle promotion'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la promotion *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Soldes d'été"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type de réduction</Label>
                    <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Pourcentage</SelectItem>
                        <SelectItem value="fixed">Montant fixe</SelectItem>
                        <SelectItem value="buy_x_get_y">Offre spéciale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="value">
                      Valeur * {formData.type === 'percentage' ? '(%)' : '(€)'}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder={formData.type === 'percentage' ? '10' : '5'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_purchase">Achat minimum (€, optionnel)</Label>
                  <Input
                    id="min_purchase"
                    type="number"
                    step="0.01"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                    placeholder="50.00"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Date de début</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">Date de fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Promotion active
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button onClick={handleSavePromo} disabled={saveMutation.isPending} className="flex-1">
                    {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Refunds Tab */}
        <TabsContent value="refunds" className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <Button onClick={() => setRefundDialogOpen(true)} size="lg">
              <Undo2 className="h-5 w-5 mr-2" />
              Nouveau Remboursement
            </Button>
          </div>

          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3">
            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Remboursements aujourd'hui</p>
                  <h3 className="text-xl md:text-2xl font-bold mt-1">{todayRefunds.length}</h3>
                </div>
                <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total remboursé</p>
                  <h3 className="text-xl md:text-2xl font-bold mt-1">{todayTotal.toFixed(2)}€</h3>
                </div>
                <div className="p-2 md:p-3 bg-red-500/10 rounded-lg">
                  <Euro className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total remboursements</p>
                  <h3 className="text-xl md:text-2xl font-bold mt-1">{refunds.length}</h3>
                </div>
                <div className="p-2 md:p-3 bg-purple-500/10 rounded-lg">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un remboursement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          <Card>
            <ScrollArea className="h-[500px] md:h-[600px]">
              {refundsLoading ? (
                <div className="p-12 text-center text-muted-foreground">Chargement...</div>
              ) : filteredRefunds.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Undo2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun remboursement trouvé</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredRefunds.map((refund) => (
                    <div key={refund.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex flex-col md:flex-row items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold">{refund.refund_number}</h3>
                            <Badge variant={refund.refund_type === 'full' ? 'destructive' : 'secondary'}>
                              {refund.refund_type === 'full' ? 'Complet' : 'Partiel'}
                            </Badge>
                            <Badge variant="outline">{refund.payment_method}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {format(new Date(refund.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </p>
                          {refund.customers && (
                            <p className="text-sm text-muted-foreground">
                              Client: {refund.customers.name}
                            </p>
                          )}
                          <p className="text-sm mt-2">
                            <span className="font-medium">Raison:</span> {refund.reason}
                          </p>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {refund.refund_items?.length} article{refund.refund_items?.length > 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl md:text-2xl font-bold text-destructive">
                            -{refund.total.toFixed(2)}€
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            dont TVA: {refund.total_vat.toFixed(2)}€
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          <RefundDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientsManagement;
