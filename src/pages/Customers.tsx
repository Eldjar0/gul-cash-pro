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
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { useCustomers, useCreateCustomer, Customer } from '@/hooks/useCustomers';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerCreditManagementDialog } from '@/components/customers/CustomerCreditManagementDialog';
import { Switch } from '@/components/ui/switch';

type CustomerType = 'particulier' | 'professionnel';

export default function Customers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();

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

  const handleOpenCreditDialog = (customerId: string, customerName: string) => {
    setSelectedCustomer({ id: customerId, name: customerName });
    setCreditDialogOpen(true);
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
  };

  const handleCreateCustomer = async () => {
    if (!formData.name.trim()) {
      return;
    }

    await createCustomer.mutateAsync(formData);
    setCreateDialogOpen(false);
    resetForm();
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b border-primary/20 px-4 md:px-6 py-4 shadow-lg">
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
            <h1 className="text-2xl font-bold text-white">Fichier Clients</h1>
            <p className="text-sm text-white/80">Gestion complète de votre portefeuille client</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Clients</p>
                <p className="text-3xl font-bold mt-2">{customers.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <User className="h-8 w-8" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Professionnels</p>
                <p className="text-3xl font-bold mt-2">{professionalCustomers.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <Briefcase className="h-8 w-8" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Particuliers</p>
                <p className="text-3xl font-bold mt-2">{particularCustomers.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <User className="h-8 w-8" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Clients Actifs</p>
                <p className="text-3xl font-bold mt-2">
                  {customers.filter(c => c.is_active).length}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <CreditCard className="h-8 w-8" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search & Actions */}
        <Card className="p-4 shadow-md">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, téléphone ou TVA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="h-12 px-6 bg-primary hover:bg-primary/90 shadow-md"
              size="lg"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Nouveau Client
            </Button>
          </div>
        </Card>

        {/* Customers Grid */}
        <div className="space-y-4">
          {professionalCustomers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Clients Professionnels ({professionalCustomers.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {professionalCustomers.map((customer) => (
                  <Card key={customer.id} className="p-5 hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer">
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
                          onClick={() => handleOpenCreditDialog(customer.id, customer.name)}
                          className="flex-1"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Crédit
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
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
                  <Card key={customer.id} className="p-5 hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer">
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
                          onClick={() => handleOpenCreditDialog(customer.id, customer.name)}
                          className="flex-1"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Crédit
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
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
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Créer un client
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Create Customer Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Créer un nouveau client</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Type Selection */}
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
                  required
                />
              </div>

              {customerType === 'professionnel' && (
                <div>
                  <Label htmlFor="vat_number" className="required">Numéro de TVA *</Label>
                  <Input
                    id="vat_number"
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                    placeholder="BE0123456789"
                    required={customerType === 'professionnel'}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email {customerType === 'professionnel' && '*'}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@exemple.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone {customerType === 'professionnel' && '*'}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+32 471 12 34 56"
                  />
                </div>
              </div>

              {customerType === 'professionnel' && (
                <>
                  <div>
                    <Label htmlFor="address">Adresse complète *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Rue Example"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postal_code">Code postal *</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        placeholder="6000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">Ville *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Charleroi"
                      />
                    </div>
                  </div>
                </>
              )}

              {customerType === 'particulier' && (
                <>
                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Rue Example"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postal_code">Code postal</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        placeholder="6000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Charleroi"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informations complémentaires..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}>
                Annuler
              </Button>
              <Button onClick={handleCreateCustomer} disabled={!formData.name.trim()}>
                <UserPlus className="h-4 w-4 mr-2" />
                Créer le client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Dialog */}
      {selectedCustomer && (
        <CustomerCreditManagementDialog
          open={creditDialogOpen}
          onOpenChange={setCreditDialogOpen}
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
        />
      )}
    </div>
  );
}
