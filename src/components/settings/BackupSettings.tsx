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

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Confirmation avant import
      const confirmed = window.confirm(
        '⚠️ ATTENTION: Cette action va remplacer TOUTES les données existantes par celles de la sauvegarde. Cette opération est IRRÉVERSIBLE. Voulez-vous continuer?'
      );

      if (!confirmed) {
        setIsImporting(false);
        return;
      }

      // Import des données (ordre important pour respecter les clés étrangères)
      if (data.categories) {
        await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('categories').insert(data.categories);
      }

      if (data.products) {
        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('products').insert(data.products);
      }

      if (data.customers) {
        await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('customers').insert(data.customers);
      }

      if (data.sales) {
        await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('sales').insert(data.sales);
      }

      if (data.sale_items) {
        await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('sale_items').insert(data.sale_items);
      }

      toast.success('Sauvegarde importée avec succès');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Erreur import:', error);
      toast.error('Erreur lors de l\'importation de la sauvegarde');
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