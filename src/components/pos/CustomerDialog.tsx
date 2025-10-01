import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useSearchCustomers, useCreateCustomer, Customer } from '@/hooks/useCustomers';
import { Search, Plus, User, Building2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export function CustomerDialog({ open, onOpenChange, onSelectCustomer }: CustomerDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: searchResults = [] } = useSearchCustomers(searchTerm);
  const createCustomer = useCreateCustomer();

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    vat_number: '',
  });

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    onOpenChange(false);
    setSearchTerm('');
    setShowCreateForm(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      return;
    }

    try {
      const customer = await createCustomer.mutateAsync({
        ...newCustomer,
        is_active: true,
      });
      handleSelectCustomer(customer);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        vat_number: '',
      });
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Sélectionner un client
          </DialogTitle>
        </DialogHeader>

        {!showCreateForm ? (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, TVA ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Results */}
            <ScrollArea className="flex-1">
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((customer) => (
                    <Card
                      key={customer.id}
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{customer.name}</h3>
                            {customer.vat_number && (
                              <p className="text-sm text-muted-foreground">
                                TVA: {customer.vat_number}
                              </p>
                            )}
                            {customer.email && (
                              <p className="text-sm text-muted-foreground">{customer.email}</p>
                            )}
                            {customer.address && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {customer.address}
                                {customer.postal_code && `, ${customer.postal_code}`}
                                {customer.city && ` ${customer.city}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : searchTerm.trim() ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun client trouvé</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Recherchez un client</p>
                </div>
              )}
            </ScrollArea>

            <Separator />

            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un nouveau client
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                <div>
                  <Label htmlFor="name">Nom du client *</Label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Nom complet ou raison sociale"
                  />
                </div>

                <div>
                  <Label htmlFor="vat_number">Numéro de TVA</Label>
                  <Input
                    id="vat_number"
                    value={newCustomer.vat_number}
                    onChange={(e) => setNewCustomer({ ...newCustomer, vat_number: e.target.value })}
                    placeholder="BE0123456789"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      placeholder="email@exemple.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      placeholder="+32 123 45 67 89"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    placeholder="Rue et numéro"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={newCustomer.postal_code}
                      onChange={(e) => setNewCustomer({ ...newCustomer, postal_code: e.target.value })}
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                      placeholder="Bruxelles"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewCustomer({
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    postal_code: '',
                    vat_number: '',
                  });
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateCustomer}
                disabled={!newCustomer.name.trim() || createCustomer.isPending}
                className="flex-1"
              >
                {createCustomer.isPending ? 'Création...' : 'Créer le client'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
