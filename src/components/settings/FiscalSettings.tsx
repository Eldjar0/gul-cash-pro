import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Calculator, FileBarChart, Coins, Save } from 'lucide-react';

interface FiscalConfig {
  standard_vat_rate: number;
  reduced_vat_rate: number;
  accounting_plan_code: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  auto_numbering: boolean;
  auto_export: boolean;
}

export function FiscalSettings() {
  const [config, setConfig] = useState<FiscalConfig>({
    standard_vat_rate: 21,
    reduced_vat_rate: 6,
    accounting_plan_code: '',
    fiscal_year_start: '',
    fiscal_year_end: '',
    auto_numbering: true,
    auto_export: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'fiscal_config')
        .maybeSingle();
      
      if (data?.value) {
        setConfig(data.value as unknown as FiscalConfig);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert([{
          key: 'fiscal_config',
          value: config as any
        }]);

      if (error) throw error;
      
      toast.success('Paramètres fiscaux sauvegardés', {
        description: 'Les modifications ont été appliquées'
      });
    } catch (err) {
      toast.error('Erreur', {
        description: err instanceof Error ? err.message : 'Impossible de sauvegarder'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Paramètres TVA */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl text-white">
              <Calculator className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Paramètres TVA</CardTitle>
              <CardDescription>Configuration des taux de TVA applicables</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg">
              <Label className="text-base font-medium mb-3 block">Taux TVA standard (%)</Label>
              <Input 
                type="number" 
                value={config.standard_vat_rate}
                onChange={(e) => setConfig({ ...config, standard_vat_rate: parseFloat(e.target.value) || 0 })}
                className="h-12"
                placeholder="21"
              />
            </div>
            <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg">
              <Label className="text-base font-medium mb-3 block">Taux TVA réduit (%)</Label>
              <Input 
                type="number" 
                value={config.reduced_vat_rate}
                onChange={(e) => setConfig({ ...config, reduced_vat_rate: parseFloat(e.target.value) || 0 })}
                className="h-12"
                placeholder="6"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comptabilité */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white">
              <FileBarChart className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Comptabilité</CardTitle>
              <CardDescription>Gestion des comptes et exports comptables</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">Plan comptable</Label>
            <Input 
              value={config.accounting_plan_code}
              onChange={(e) => setConfig({ ...config, accounting_plan_code: e.target.value })}
              placeholder="Code plan comptable (optionnel)"
              className="h-12"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-base font-medium">Exercice fiscal</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                type="date"
                value={config.fiscal_year_start}
                onChange={(e) => setConfig({ ...config, fiscal_year_start: e.target.value })}
                placeholder="Date de début"
                className="h-12"
              />
              <Input 
                type="date"
                value={config.fiscal_year_end}
                onChange={(e) => setConfig({ ...config, fiscal_year_end: e.target.value })}
                placeholder="Date de fin"
                className="h-12"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal de caisse */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
              <Coins className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Journal de caisse</CardTitle>
              <CardDescription>Configuration du journal de caisse officiel</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-lg">
            <div>
              <p className="font-medium">Numérotation automatique</p>
              <p className="text-sm text-muted-foreground">Génération automatique des numéros de journaux</p>
            </div>
            <Checkbox 
              checked={config.auto_numbering}
              onCheckedChange={(checked) => setConfig({ ...config, auto_numbering: checked as boolean })}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-lg">
            <div>
              <p className="font-medium">Export automatique</p>
              <p className="text-sm text-muted-foreground">Export mensuel des journaux comptables</p>
            </div>
            <Checkbox 
              checked={config.auto_export}
              onCheckedChange={(checked) => setConfig({ ...config, auto_export: checked as boolean })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <Card className="p-6 bg-gradient-to-r from-green-500 to-emerald-500 border-0 shadow-lg">
        <Button 
          onClick={handleSave} 
          disabled={isLoading} 
          className="w-full h-14 text-lg bg-white text-green-600 hover:bg-white/90" 
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Enregistrer les paramètres fiscaux
            </>
          )}
        </Button>
      </Card>
    </div>
  );
}
