import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CustomerCreditManagementDialog } from '@/components/customers/CustomerCreditManagementDialog';

export default function Customers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const { data: customers = [], isLoading } = useCustomers();

  const handleOpenCreditDialog = (customerId: string, customerName: string) => {
    setSelectedCustomer({ id: customerId, name: customerName });
    setCreditDialogOpen(true);
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    );
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
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b border-primary/20 px-4 md:px-6 py-3">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-white truncate">Gestion des Clients</h1>
            <p className="text-xs md:text-sm text-white/80">Fichier client et factures</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card className="p-3 md:p-4 bg-white">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-primary/10 rounded-lg shrink-0">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Total Clients</p>
                <p className="text-sm md:text-xl font-bold text-primary truncate">{customers.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 bg-white">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-accent/10 rounded-lg shrink-0">
                <UserPlus className="h-4 w-4 md:h-5 md:w-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">Clients Actifs</p>
                <p className="text-sm md:text-xl font-bold truncate">
                  {customers.filter(c => c.is_active).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search & Add */}
        <div className="flex gap-3 mb-4">
          <Card className="flex-1 p-4 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>
          <Button className="bg-accent hover:bg-accent/90 text-white">
            <UserPlus className="h-5 w-5 mr-2" />
            Nouveau Client
          </Button>
        </div>

        {/* Customers Table */}
        <Card className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Nom</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="min-w-[120px]">Téléphone</TableHead>
                    <TableHead className="min-w-[150px]">Adresse</TableHead>
                    <TableHead className="min-w-[120px]">TVA</TableHead>
                    <TableHead className="min-w-[100px]">Statut</TableHead>
                    <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-semibold">{customer.name}</TableCell>
                      <TableCell>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {customer.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {customer.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.address && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[150px]">{customer.address}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {customer.vat_number || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                          {customer.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => handleOpenCreditDialog(customer.id, customer.name)}
                            title="Gérer le crédit"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucun client trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </Card>
      </div>

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
