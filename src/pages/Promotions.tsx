import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit, Gift, TrendingUp, Calendar, Clock, Users, Eye, EyeOff, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  type Promotion,
  type PromotionConditions,
  type PromotionSchedule,
} from '@/hooks/usePromotions';
import { useProducts } from '@/hooks/useProducts';

const Promotions = () => {
  const navigate = useNavigate();
  const { data: promotions = [], isLoading } = usePromotions();
  const { data: products = [] } = useProducts();
  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();
  const deleteMutation = useDeletePromotion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: '',
    description: '',
    type: 'cart_percentage',
    is_active: true,
    show_on_display: true,
    customer_type: 'all',
    schedule_type: 'always',
    priority: 0,
    conditions: {},
    schedule_config: {},
  });

  const handleOpenDialog = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData(promo);
    } else {
      setEditingPromo(null);
      setFormData({
        name: '',
        description: '',
        type: 'cart_percentage',
        is_active: true,
        show_on_display: true,
        customer_type: 'all',
        schedule_type: 'always',
        priority: 0,
        conditions: {},
        schedule_config: {},
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (editingPromo) {
        await updateMutation.mutateAsync({ id: editingPromo.id, ...formData });
      } else {
        await createMutation.mutateAsync(formData as Omit<Promotion, 'id' | 'created_at' | 'updated_at'>);
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving promotion:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      buy_x_get_y: 'Achetez X, Obtenez Y',
      spend_amount_get_discount: 'Dépensez X, Économisez Y',
      cart_percentage: 'Réduction % sur le panier',
      cart_fixed: 'Réduction fixe sur le panier',
      product_discount: 'Réduction sur produit',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      buy_x_get_y: Gift,
      spend_amount_get_discount: TrendingUp,
      cart_percentage: TrendingUp,
      cart_fixed: TrendingUp,
      product_discount: Gift,
    };
    const Icon = icons[type] || Gift;
    return <Icon className="w-4 h-4" />;
  };

  if (isLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Gestion des Promotions
                </h1>
                <p className="text-sm text-muted-foreground">Créez et gérez vos offres promotionnelles</p>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Promotion
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm font-medium">Total</p>
                  <p className="text-3xl font-bold mt-1">{promotions.length}</p>
                </div>
                <Gift className="w-8 h-8 text-pink-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Actives</p>
                  <p className="text-3xl font-bold mt-1">{promotions.filter(p => p.is_active).length}</p>
                </div>
                <Power className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Sur écran client</p>
                  <p className="text-3xl font-bold mt-1">{promotions.filter(p => p.show_on_display).length}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Planifiées</p>
                  <p className="text-3xl font-bold mt-1">{promotions.filter(p => p.schedule_type !== 'always').length}</p>
                </div>
                <Calendar className="w-8 h-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Promotions List */}
        {promotions.length === 0 ? (
          <Card className="p-12 text-center">
            <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune promotion</h3>
            <p className="text-muted-foreground mb-6">Commencez par créer votre première promotion</p>
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-pink-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Créer une promotion
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {promotions.map((promo) => (
              <Card key={promo.id} className="hover:shadow-lg transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={promo.is_active ? 'default' : 'secondary'} className={promo.is_active ? 'bg-green-500' : ''}>
                          {promo.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getTypeIcon(promo.type)}
                          {getTypeLabel(promo.type)}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{promo.name}</CardTitle>
                      {promo.description && (
                        <CardDescription className="mt-1">{promo.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(promo)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(promo.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        {promo.customer_type === 'all' && 'Tous les clients'}
                        {promo.customer_type === 'professional' && 'Clients professionnels uniquement'}
                        {promo.customer_type === 'individual' && 'Clients particuliers uniquement'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {promo.show_on_display ? (
                        <>
                          <Eye className="w-4 h-4 text-green-500" />
                          <span>Visible sur l'écran client</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span>Masqué de l'écran client</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      {promo.schedule_type === 'always' ? (
                        <>
                          <Calendar className="w-4 h-4" />
                          <span>Toujours active</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span>
                            {promo.schedule_type === 'specific_dates' && 'Dates spécifiques'}
                            {promo.schedule_type === 'recurring_days' && 'Jours récurrents'}
                            {promo.schedule_type === 'date_range' && 'Période spécifique'}
                          </span>
                        </>
                      )}
                    </div>

                    {promo.priority > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Priorité: {promo.priority}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog - même contenu que dans le fichier précédent, tronqué ici pour la longueur */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Modifier la Promotion' : 'Créer une Promotion'}</DialogTitle>
            <DialogDescription>
              {editingPromo ? 'Modifiez les détails de la promotion.' : 'Créez une nouvelle promotion pour attirer vos clients.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="schedule">Planification</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom de la promotion</Label>
                    <Input
                      type="text"
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Priorité</Label>
                    <Input
                      type="number"
                      id="priority"
                      value={formData.priority?.toString() || '0'}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type de promotion</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy_x_get_y">Achetez X, Obtenez Y</SelectItem>
                        <SelectItem value="spend_amount_get_discount">Dépensez X, Économisez Y</SelectItem>
                        <SelectItem value="cart_percentage">Réduction % sur le panier</SelectItem>
                        <SelectItem value="cart_fixed">Réduction fixe sur le panier</SelectItem>
                        <SelectItem value="product_discount">Réduction sur produit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="customer_type">Type de client</Label>
                    <Select value={formData.customer_type} onValueChange={(value) => setFormData({ ...formData, customer_type: value as any })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tous les clients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les clients</SelectItem>
                        <SelectItem value="professional">Professionnel</SelectItem>
                        <SelectItem value="individual">Individuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="show_on_display">Afficher sur l'écran client</Label>
                  <Switch
                    id="show_on_display"
                    checked={formData.show_on_display}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_on_display: checked })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conditions">
              {formData.type === 'buy_x_get_y' && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buy_product_id">Produit à acheter</Label>
                      <Select
                        value={formData.conditions?.buy_product_id || ''}
                        onValueChange={(value) =>
                          setFormData({ ...formData, conditions: { ...formData.conditions, buy_product_id: value } })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionnez un produit" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="buy_quantity">Quantité à acheter</Label>
                      <Input
                        type="number"
                        id="buy_quantity"
                        value={formData.conditions?.buy_quantity?.toString() || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            conditions: { ...formData.conditions, buy_quantity: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="get_product_id">Produit offert</Label>
                      <Select
                        value={formData.conditions?.get_product_id || ''}
                        onValueChange={(value) =>
                          setFormData({ ...formData, conditions: { ...formData.conditions, get_product_id: value } })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionnez un produit" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="get_quantity">Quantité offerte</Label>
                      <Input
                        type="number"
                        id="get_quantity"
                        value={formData.conditions?.get_quantity?.toString() || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            conditions: { ...formData.conditions, get_quantity: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.type === 'spend_amount_get_discount' && (
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="min_amount">Montant minimum d'achat</Label>
                    <Input
                      type="number"
                      id="min_amount"
                      value={formData.conditions?.min_amount?.toString() || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, min_amount: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_value">Valeur de la réduction</Label>
                    <Input
                      type="number"
                      id="discount_value"
                      value={formData.conditions?.discount_value?.toString() || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, discount_value: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_type">Type de réduction</Label>
                    <Select
                      value={formData.conditions?.discount_type || 'percentage'}
                      onValueChange={(value) =>
                        setFormData({ ...formData, conditions: { ...formData.conditions, discount_type: value as any } })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Pourcentage</SelectItem>
                        <SelectItem value="fixed">Montant Fixe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {(formData.type === 'cart_percentage' || formData.type === 'cart_fixed') && (
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="discount_value">Valeur de la réduction</Label>
                    <Input
                      type="number"
                      id="discount_value"
                      value={formData.conditions?.discount_value?.toString() || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, discount_value: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_amount">Montant minimum d'achat (facultatif)</Label>
                    <Input
                      type="number"
                      id="min_amount"
                      value={formData.conditions?.min_amount?.toString() || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, min_amount: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {formData.type === 'product_discount' && (
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="buy_product_id">Produit concerné</Label>
                    <Select
                      value={formData.conditions?.buy_product_id || ''}
                      onValueChange={(value) =>
                        setFormData({ ...formData, conditions: { ...formData.conditions, buy_product_id: value } })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez un produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discount_value">Valeur de la réduction</Label>
                    <Input
                      type="number"
                      id="discount_value"
                      value={formData.conditions?.discount_value?.toString() || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, discount_value: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_type">Type de réduction</Label>
                    <Select
                      value={formData.conditions?.discount_type || 'percentage'}
                      onValueChange={(value) =>
                        setFormData({ ...formData, conditions: { ...formData.conditions, discount_type: value as any } })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Pourcentage</SelectItem>
                        <SelectItem value="fixed">Montant Fixe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule">
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="schedule_type">Type de planification</Label>
                  <Select
                    value={formData.schedule_type || 'always'}
                    onValueChange={(value) => setFormData({ ...formData, schedule_type: value as any })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Toujours active" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Toujours active</SelectItem>
                      <SelectItem value="specific_dates">Dates spécifiques</SelectItem>
                      <SelectItem value="recurring_days">Jours récurrents</SelectItem>
                      <SelectItem value="date_range">Période spécifique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.schedule_type === 'specific_dates' && (
                  <div>
                    <Label htmlFor="dates">Dates spécifiques (YYYY-MM-DD)</Label>
                    <Input
                      type="text"
                      id="dates"
                      placeholder="Séparées par des virgules"
                      value={formData.schedule_config?.dates?.join(',') || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          schedule_config: { ...formData.schedule_config, dates: e.target.value.split(',') },
                        })
                      }
                    />
                  </div>
                )}

                {formData.schedule_type === 'recurring_days' && (
                  <div>
                    <Label htmlFor="days">Jours récurrents (0-6, 0 pour Dimanche)</Label>
                    <Input
                      type="text"
                      id="days"
                      placeholder="Séparés par des virgules"
                      value={formData.schedule_config?.days?.join(',') || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          schedule_config: { ...formData.schedule_config, days: e.target.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d)) },
                        })
                      }
                    />
                  </div>
                )}

                {formData.schedule_type === 'date_range' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date_start">Date de début</Label>
                      <Input
                        type="date"
                        id="date_start"
                        value={formData.schedule_config?.date_start || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, schedule_config: { ...formData.schedule_config, date_start: e.target.value } })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_end">Date de fin</Label>
                      <Input
                        type="date"
                        id="date_end"
                        value={formData.schedule_config?.date_end || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, schedule_config: { ...formData.schedule_config, date_end: e.target.value } })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="time_start">Heure de début (HH:MM)</Label>
                    <Input
                      type="time"
                      id="time_start"
                      value={formData.schedule_config?.time_start || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, schedule_config: { ...formData.schedule_config, time_start: e.target.value } })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="time_end">Heure de fin (HH:MM)</Label>
                    <Input
                      type="time"
                      id="time_end"
                      value={formData.schedule_config?.time_end || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, schedule_config: { ...formData.schedule_config, time_end: e.target.value } })
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingPromo ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Promotions;
