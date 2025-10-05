import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tags, RotateCcw } from 'lucide-react';
import Promotions from './Promotions';
import Refunds from './Refunds';

export default function ClientsManagement() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Gestion Clients</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les promotions et les remboursements
          </p>
        </div>

        <Tabs defaultValue="promotions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Promotions
            </TabsTrigger>
            <TabsTrigger value="refunds" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Remboursements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="promotions">
            <Promotions />
          </TabsContent>

          <TabsContent value="refunds">
            <Refunds />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
