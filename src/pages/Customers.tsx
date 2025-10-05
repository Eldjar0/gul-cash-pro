import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Search,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  FileText,
  Edit,
  Trash2,
  CreditCard,
  Building2,
  User,
  Briefcase,
} from 'lucide-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, Customer } from '@/hooks/useCustomers';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CustomerCreditManagementDialog } from '@/components/customers/CustomerCreditManagementDialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

type CustomerType = 'particulier' | 'professionnel';

export default function Customers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [customerType, setCustomerType] = useState<CustomerType>('particulier');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    vat_number: '',
    notes: '',
    is_active: true,
  });

  const handleOpenCreditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCreditDialogOpen(true);
  };

  const handleOpenEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerType(customer.vat_number ? 'professionnel' : 'particulier');
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      postal_code: customer.postal_code || '',
      vat_number: customer.vat_number || '',
      notes: customer.notes || '',
      is_active: customer.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleOpenDeleteDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      vat_number: '',
      notes: '',
      is_active: true,
    });
    setCustomerType('particulier');
    setSelectedCustomer(null);
  };

  const handleSaveCustomer = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    if (customerType === 'professionnel') {
      if (!formData.vat_number || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.postal_code) {
        toast.error('Tous les champs sont obligatoires pour un client professionnel');
        return;
      }
    }

    try {
      if (selectedCustomer) {
        await updateCustomer.mutateAsync({ id: selectedCustomer.id, ...formData });
      } else {
        await createCustomer.mutateAsync(formData);
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      await deleteCustomer.mutateAsync(selectedCustomer.id);
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.vat_number?.toLowerCase().includes(searchLower)
    );
  });

  const professionalCustomers = filteredCustomers.filter(c => c.vat_number);
  const particularCustomers = filteredCustomers.filter(c => !c.vat_number);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-gray-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Gestion des Clients
                </h1>
                <p className="text-sm text-muted-foreground">{customers.length} clients au total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Clients</p>
                <p className="text-3xl font-bold mt-1">{customers.length}</p>
              </div>
              <User className="w-8 h-8 text-blue-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Professionnels</p>
                <p className="text-3xl font-bold mt-1">{professionalCustomers.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-purple-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Particuliers</p>
                <p className="text-3xl font-bold mt-1">{particularCustomers.length}</p>
              </div>
              <User className="w-8 h-8 text-green-200" />
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, téléphone ou TVA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button 
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
              size="lg"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Nouveau Client
            </Button>
          </div>
        </Card>

        {/* Customers Grid */}
        <div className="space-y-6">
          {professionalCustomers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Clients Professionnels ({professionalCustomers.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {professionalCustomers.map((customer) => (
                  <Card key={customer.id} className="p-5 hover:shadow-lg transition-all">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Building2 className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{customer.name}</h3>
                            <Badge variant="outline" className="mt-1">Professionnel</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {customer.vat_number && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span className="font-mono">{customer.vat_number}</span>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">
                              {customer.address}
                              {customer.postal_code && `, ${customer.postal_code}`}
                              {customer.city && ` ${customer.city}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCreditDialog(customer)}
                          className="flex-1"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Crédit
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(customer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(customer)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {particularCustomers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Clients Particuliers ({particularCustomers.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {particularCustomers.map((customer) => (
                  <Card key={customer.id} className="p-5 hover:shadow-lg transition-all">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{customer.name}</h3>
                            <Badge variant="secondary" className="mt-1">Particulier</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">
                              {customer.address}
                              {customer.postal_code && `, ${customer.postal_code}`}
                              {customer.city && ` ${customer.city}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCreditDialog(customer)}
                          className="flex-1"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Crédit
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(customer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(customer)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filteredCustomers.length === 0 && (
            <Card className="p-12 text-center">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun client trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Aucun résultat pour votre recherche' : 'Commencez par créer votre premier client'}
              </p>
              {!searchTerm && (
                <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Créer un client
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedCustomer ? 'Modifier le client' : 'Créer un nouveau client'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Type Selection */}
            {!selectedCustomer && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Type de client</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={`p-4 cursor-pointer transition-all ${
                      customerType === 'particulier'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setCustomerType('particulier')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${
                        customerType === 'particulier' ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <User className={`h-6 w-6 ${
                          customerType === 'particulier' ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold">Particulier</p>
                        <p className="text-xs text-muted-foreground">Client privé</p>
                      </div>
                    </div>
                  </Card>

                  <Card
                    className={`p-4 cursor-pointer transition-all ${
                      customerType === 'professionnel'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setCustomerType('professionnel')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${
                        customerType === 'professionnel' ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <Briefcase className={`h-6 w-6 ${
                          customerType === 'professionnel' ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold">Professionnel</p>
                        <p className="text-xs text-muted-foreground">Entreprise/Société</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="required">
                  {customerType === 'professionnel' ? 'Nom de la société' : 'Nom et prénom'} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={customerType === 'professionnel' ? 'Ex: SARL Dupont' : 'Ex: Jean Dupont'}
                  className="h-11"
                />
              </div>

              {customerType === 'professionnel' && (
                <div>
                  <Label htmlFor="vat_number">N° TVA *</Label>
                  <Input
                    id="vat_number"
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                    placeholder="FR12345678901"
                    className="h-11"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">{customerType === 'professionnel' ? 'Email *' : 'Email'}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemple.com"
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{customerType === 'professionnel' ? 'Téléphone *' : 'Téléphone'}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="h-11"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">{customerType === 'professionnel' ? 'Adresse *' : 'Adresse'}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 rue de la République"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postal_code">{customerType === 'professionnel' ? 'Code postal *' : 'Code postal'}</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="75001"
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="city">{customerType === 'professionnel' ? 'Ville *' : 'Ville'}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Paris"
                    className="h-11"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes supplémentaires..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Client actif</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleSaveCustomer} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                {selectedCustomer ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le client "{selectedCustomer?.name}" ? 
              Cette action désactivera le client mais conservera son historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credit Management Dialog */}
      {selectedCustomer && creditDialogOpen && (
        <CustomerCreditManagementDialog
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          open={creditDialogOpen}
          onOpenChange={setCreditDialogOpen}
        />
      )}
    </div>
  );
}
