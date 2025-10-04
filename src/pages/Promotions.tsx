import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, Trash2, Tag, Calendar, TrendingDown, Percent, Gift } from 'lucide-react';
import { usePromotions, useSavePromotions, Promotion } from '@/hooks/usePromotions';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { toast } from 'sonner';

export default function Promotions() {
  const navigate = useNavigate();
  const { data: promotions = [], isLoading } = usePromotions();
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

  const handleSave = async () => {
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

  const handleDelete = async (id: string) => {
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
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Promotions</h1>
              <p className="text-sm text-white/80">Gestion des offres et réductions</p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-white text-primary hover:bg-white/90">
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle Promotion
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
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
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(promo.id)}>
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
      </div>

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
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1">
                {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
