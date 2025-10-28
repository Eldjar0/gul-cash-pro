import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFullExport } from '@/hooks/useFullExport';
import { Download, Database, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function BackupSettings() {
  const { exportFullData } = useFullExport();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleCreateBackup = async () => {
    setIsExporting(true);
    try {
      await exportFullData();
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input pour permettre de réimporter le même fichier
    event.target.value = '';

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Confirmation avant import
      const confirmed = window.confirm(
        '⚠️ ATTENTION: Cette action va ÉCRASER toutes les données existantes par celles de la sauvegarde.\n\n' +
        'Cette opération est IRRÉVERSIBLE.\n\n' +
        'Assurez-vous d\'avoir une sauvegarde récente avant de continuer.\n\n' +
        'Voulez-vous vraiment continuer?'
      );

      if (!confirmed) {
        setIsImporting(false);
        return;
      }

      toast.info('Import en cours... Veuillez patienter');

      // Import des données dans l'ordre correct (respecter les dépendances)
      let imported = 0;

      // 1. Catégories (pas de dépendances)
      if (data.categories?.length > 0) {
        const { error } = await supabase.from('categories').upsert(data.categories, { onConflict: 'id' });
        if (error) throw new Error(`Erreur catégories: ${error.message}`);
        imported += data.categories.length;
      }

      // 2. Clients (pas de dépendances)
      if (data.customers?.length > 0) {
        const { error } = await supabase.from('customers').upsert(data.customers, { onConflict: 'id' });
        if (error) throw new Error(`Erreur clients: ${error.message}`);
        imported += data.customers.length;
      }

      // 3. Produits (dépend des catégories)
      if (data.products?.length > 0) {
        const { error } = await supabase.from('products').upsert(data.products, { onConflict: 'id' });
        if (error) throw new Error(`Erreur produits: ${error.message}`);
        imported += data.products.length;
      }

      // 4. Ventes (dépend des clients)
      if (data.sales?.length > 0) {
        const { error } = await supabase.from('sales').upsert(data.sales, { onConflict: 'id' });
        if (error) throw new Error(`Erreur ventes: ${error.message}`);
        imported += data.sales.length;
      }

      // 5. Articles de vente (dépend des ventes et produits)
      if (data.sale_items?.length > 0) {
        const { error } = await supabase.from('sale_items').upsert(data.sale_items, { onConflict: 'id' });
        if (error) throw new Error(`Erreur articles: ${error.message}`);
        imported += data.sale_items.length;
      }

      // 6. Autres tables
      if (data.refunds?.length > 0) {
        const { error } = await supabase.from('refunds').upsert(data.refunds, { onConflict: 'id' });
        if (error) console.warn('Avertissement remboursements:', error.message);
      }

      if (data.customer_orders?.length > 0) {
        const { error } = await supabase.from('customer_orders').upsert(data.customer_orders, { onConflict: 'id' });
        if (error) console.warn('Avertissement commandes:', error.message);
      }

      if (data.quotes?.length > 0) {
        const { error } = await supabase.from('quotes').upsert(data.quotes, { onConflict: 'id' });
        if (error) console.warn('Avertissement devis:', error.message);
      }

      if (data.stock_movements?.length > 0) {
        const { error } = await supabase.from('stock_movements').upsert(data.stock_movements, { onConflict: 'id' });
        if (error) console.warn('Avertissement mouvements:', error.message);
      }

      toast.success(`✅ ${imported} enregistrements importés avec succès`);
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error('Erreur import:', error);
      toast.error(`❌ Erreur: ${error.message || 'Impossible d\'importer la sauvegarde'}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sauvegarde complète */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white">
              <Database className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Sauvegarde complète</CardTitle>
              <CardDescription>Téléchargez et réimportez toutes vos données</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 mb-6">
            <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500">Inclus</Badge>
                <span className="font-semibold">Données de vente</span>
              </div>
              <p className="text-sm text-muted-foreground ml-16">Tickets, factures, remboursements, historique complet</p>
            </div>
            
            <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500">Inclus</Badge>
                <span className="font-semibold">Inventaire & Stock</span>
              </div>
              <p className="text-sm text-muted-foreground ml-16">Produits, catégories, mouvements de stock, lots</p>
            </div>
            
            <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">Inclus</Badge>
                <span className="font-semibold">Clients & Commandes</span>
              </div>
              <p className="text-sm text-muted-foreground ml-16">Base clients, commandes, devis, crédits</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCreateBackup}
              disabled={isExporting}
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              {isExporting ? 'Création en cours...' : 'Télécharger la sauvegarde (.JSON)'}
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                disabled={isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="backup-import"
              />
              <Button
                variant="outline"
                disabled={isImporting}
                className="w-full h-14 text-lg border-2 border-purple-300 hover:bg-purple-50"
                size="lg"
                asChild
              >
                <label htmlFor="backup-import" className="cursor-pointer">
                  <Upload className="h-5 w-5 mr-2" />
                  {isImporting ? 'Importation en cours...' : 'Réimporter une sauvegarde'}
                </label>
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            💾 Format JSON avec horodatage pour une restauration complète
          </p>
        </CardContent>
      </Card>

      {/* Avertissement */}
      <Card className="border-orange-500/50 bg-orange-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-orange-500 mb-1">Important</p>
              <p className="text-muted-foreground">
                Les sauvegardes sont essentielles pour protéger vos données. Conservez toujours
                une copie en lieu sûr (disque externe, cloud). L'import d'une sauvegarde remplace
                TOUTES les données existantes de manière IRRÉVERSIBLE.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}