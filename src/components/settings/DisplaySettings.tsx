import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DisplayConfig {
  showWeather: boolean;
  showClock: boolean;
  showProductImages: boolean;
  welcomeText: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
}

export function DisplaySettings() {
  const [config, setConfig] = useState<DisplayConfig>({
    showWeather: true,
    showClock: true,
    showProductImages: true,
    welcomeText: 'Bienvenue',
    primaryColor: '#000000',
    secondaryColor: '#666666',
    fontFamily: 'system-ui',
    fontSize: 24
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
        .eq('key', 'customer_display')
        .maybeSingle();
      
      if (data?.value) {
        setConfig(data.value as unknown as DisplayConfig);
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
          key: 'customer_display',
          value: config as any
        }]);

      if (error) throw error;
      
      toast.success('Affichage client configuré', {
        description: 'Les modifications seront visibles immédiatement'
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
    <Card>
      <CardHeader>
        <CardTitle>Affichage client</CardTitle>
        <CardDescription>
          Personnalisez l'écran visible par vos clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Afficher la météo</Label>
            <Switch
              checked={config.showWeather}
              onCheckedChange={(checked) => setConfig({ ...config, showWeather: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Afficher l'horloge</Label>
            <Switch
              checked={config.showClock}
              onCheckedChange={(checked) => setConfig({ ...config, showClock: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Afficher les images produits</Label>
            <Switch
              checked={config.showProductImages}
              onCheckedChange={(checked) => setConfig({ ...config, showProductImages: checked })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Texte de bienvenue</Label>
          <Input
            value={config.welcomeText}
            onChange={(e) => setConfig({ ...config, welcomeText: e.target.value })}
            placeholder="Message d'accueil"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Couleur principale</Label>
            <Input
              type="color"
              value={config.primaryColor}
              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Couleur secondaire</Label>
            <Input
              type="color"
              value={config.secondaryColor}
              onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Taille de police (px)</Label>
          <Input
            type="number"
            min="16"
            max="48"
            value={config.fontSize}
            onChange={(e) => setConfig({ ...config, fontSize: parseInt(e.target.value) || 24 })}
          />
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            'Sauvegarder la configuration'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
