import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoyaltyTiers } from '@/hooks/useLoyaltyTiers';
import { Badge } from '@/components/ui/badge';
import { Gift, Users, TrendingUp, Award } from 'lucide-react';
import { LoyaltyTransactionsHistory } from '@/components/loyalty/LoyaltyTransactionsHistory';

const Loyalty = () => {
  const { data: tiers, isLoading } = useLoyaltyTiers();

  return (
    <ProtectedLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Programme de Fidélité</h1>
            <p className="text-muted-foreground">Multi-niveaux avec points et récompenses</p>
          </div>
        </div>

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
            {isLoading ? (
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
      </div>
    </ProtectedLayout>
  );
};

export default Loyalty;
