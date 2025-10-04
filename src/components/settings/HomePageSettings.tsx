import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface HomePageConfig {
  title: string;
  subtitle: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export function HomePageSettings() {
  const [config, setConfig] = useState<HomePageConfig>({
    title: 'Gül Reyhan',
    subtitle: 'Système de caisse',
    primaryColor: '#000000',
    secondaryColor: '#666666',
    accentColor: '#3b82f6'
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
        .eq('key', 'homepage')
        .maybeSingle();
      
      if (data?.value) {
        setConfig(data.value as unknown as HomePageConfig);
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
          key: 'homepage',
          value: config as any
        }]);

      if (error) throw error;
      
      toast.success('Page d\'accueil configurée', {
        description: 'Rechargez la page pour voir les changements'
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
        <CardTitle>Page d'accueil</CardTitle>
        <CardDescription>
          Personnalisez les textes et couleurs de la page principale
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Titre principal</Label>
          <Input
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            placeholder="Nom de votre commerce"
          />
        </div>

        <div className="space-y-2">
          <Label>Sous-titre</Label>
          <Input
            value={config.subtitle}
            onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
            placeholder="Description"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
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

          <div className="space-y-2">
            <Label>Couleur accent</Label>
            <Input
              type="color"
              value={config.accentColor}
              onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
            />
          </div>
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
