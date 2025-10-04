import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Gift, Wallet } from 'lucide-react';
import { useState } from 'react';

const Payments = () => {
  const [activeTab, setActiveTab] = useState('gift-cards');

  return (
    <ProtectedLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Paiements Avancés</h1>
            <p className="text-muted-foreground">
              Cartes cadeaux, tickets restaurant et crédit client
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
              <Wallet className="h-4 w-4" />
              Crédit Client
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gift-cards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cartes Cadeaux</CardTitle>
                <CardDescription>
                  Émission et gestion des cartes cadeaux rechargeables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Fonctionnalité en cours d'implémentation
                </div>
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Crédit Client</CardTitle>
                <CardDescription>
                  Gestion des comptes crédit et paiements différés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Fonctionnalité en cours d'implémentation
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedLayout>
  );
};

export default Payments;
