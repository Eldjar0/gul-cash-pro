import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

interface BrandingConfig {
  mainLogo: string;
  ticketLogo: string;
  authLogo: string;
  displayLogo: string;
}

export function BrandingSettings() {
  const [config, setConfig] = useState<BrandingConfig>({
    mainLogo: '',
    ticketLogo: '',
    authLogo: '',
    displayLogo: ''
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
        .eq('key', 'branding')
        .maybeSingle();
      
      if (data?.value) {
        setConfig(data.value as unknown as BrandingConfig);
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
          key: 'branding',
          value: config as any
        }]);

      if (error) throw error;
      
      toast.success('Logos sauvegardés', {
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
    <Card>
      <CardHeader>
        <CardTitle>Logos et Branding</CardTitle>
        <CardDescription>
          Personnalisez les logos affichés dans l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Logo principal (Menu)</Label>
          <Input
            type="url"
            value={config.mainLogo}
            onChange={(e) => setConfig({ ...config, mainLogo: e.target.value })}
            placeholder="URL du logo"
          />
        </div>

        <div className="space-y-2">
          <Label>Logo sur les tickets</Label>
          <Input
            type="url"
            value={config.ticketLogo}
            onChange={(e) => setConfig({ ...config, ticketLogo: e.target.value })}
            placeholder="URL du logo pour tickets"
          />
        </div>

        <div className="space-y-2">
          <Label>Logo page de connexion</Label>
          <Input
            type="url"
            value={config.authLogo}
            onChange={(e) => setConfig({ ...config, authLogo: e.target.value })}
            placeholder="URL du logo auth"
          />
        </div>

        <div className="space-y-2">
          <Label>Logo affichage client</Label>
          <Input
            type="url"
            value={config.displayLogo}
            onChange={(e) => setConfig({ ...config, displayLogo: e.target.value })}
            placeholder="URL du logo affichage"
          />
        </div>

        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            'Sauvegarder les logos'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
