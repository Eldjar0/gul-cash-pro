import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users } from 'lucide-react';
import Suppliers from './Suppliers';
import StockHistory from './StockHistory';

export default function StockManagement() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Gestion Stock & Fournisseurs</h1>
          <p className="text-muted-foreground mt-2">
            Fournisseurs et mouvements de stock
          </p>
        </div>

        <Tabs defaultValue="suppliers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Fournisseurs
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers">
            <Suppliers />
          </TabsContent>

          <TabsContent value="history">
            <StockHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
