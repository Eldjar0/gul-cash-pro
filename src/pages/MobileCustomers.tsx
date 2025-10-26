import { useState } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/useCustomers';
import { Search, Users, Phone, Mail, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function MobileCustomers() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: customers, isLoading } = useCustomers();

  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  ) || [];

  if (isLoading) {
    return (
      <MobileLayout title="Clients">
        <div className="p-3 sm:p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Clients"
      actions={
        <Button size="sm" className="h-8 sm:h-9">
          <Plus className="h-4 w-4 mr-1" />
          Nouveau
        </Button>
      }
    >
      <div className="p-3 sm:p-4">
        <div className="relative mb-3 sm:mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm sm:text-base"
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="px-3 sm:px-4 space-y-2 sm:space-y-3 pb-20">
          {filteredCustomers.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Aucun client trouvé' : 'Aucun client enregistré'}
              </p>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                      {customer.name}
                    </p>
                    {customer.loyalty_points !== undefined && customer.loyalty_points > 0 && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {customer.loyalty_points} pts fidélité
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <a href={`tel:${customer.phone}`} className="hover:text-foreground transition-colors">
                        {customer.phone}
                      </a>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <a href={`mailto:${customer.email}`} className="hover:text-foreground transition-colors truncate">
                        {customer.email}
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </MobileLayout>
  );
}
