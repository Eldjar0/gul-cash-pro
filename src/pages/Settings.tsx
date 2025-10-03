import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building, Save, Shield, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ComplianceChecklist } from '@/components/pos/ComplianceChecklist';

interface CompanySettings {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  vat_number: string;
  phone: string;
  email: string;
}


export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    vat_number: '',
    phone: '',
    email: '',
  });


  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Charger les paramètres entreprise
      const { data: companyData } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'company_info')
        .single();

      if (companyData) {
        setCompanySettings(companyData.value as unknown as CompanySettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCompanySettings = async () => {
    setSaving(true);
    try {
      // Vérifier si l'entrée existe
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'company_info')
        .single();

      if (existing) {
        // Mettre à jour
        const { error } = await supabase
          .from('settings')
          .update({ value: companySettings as any })
          .eq('key', 'company_info');
        
        if (error) throw error;
      } else {
        // Insérer
        const { error } = await supabase
          .from('settings')
          .insert({
            key: 'company_info',
            value: companySettings as any,
          });
        
        if (error) throw error;
      }

      toast.success('Paramètres entreprise enregistrés');
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b border-primary/20 px-4 md:px-6 py-3">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-white">Paramètres</h1>
            <p className="text-xs md:text-sm text-white/80">Configuration du système</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="company">
              <Building className="h-4 w-4 mr-2" />
              Entreprise
            </TabsTrigger>
            <TabsTrigger value="compliance">
              <Shield className="h-4 w-4 mr-2" />
              Conformité
            </TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Informations Entreprise</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                  <Input
                    id="company_name"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    placeholder="Mon Commerce"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    placeholder="123 Rue Example"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postal_code">Code postal *</Label>
                    <Input
                      id="postal_code"
                      value={companySettings.postal_code}
                      onChange={(e) => setCompanySettings({ ...companySettings, postal_code: e.target.value })}
                      placeholder="75001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      value={companySettings.city}
                      onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                      placeholder="Paris"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="vat_number">Numéro de TVA</Label>
                  <Input
                    id="vat_number"
                    value={companySettings.vat_number}
                    onChange={(e) => setCompanySettings({ ...companySettings, vat_number: e.target.value })}
                    placeholder="FR12345678901"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    placeholder="contact@moncommerce.fr"
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={saveCompanySettings} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Compliance Settings */}
          <TabsContent value="compliance">
            <div className="space-y-6">
              <ComplianceChecklist />
              
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Ressources Utiles</h2>
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate('/legal-info')} 
                    className="w-full justify-start bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md relative"
                  >
                    <Scale className="h-5 w-5 mr-2" />
                    Informations légales complètes
                    <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full animate-pulse">
                      i
                    </span>
                  </Button>
                  <Button 
                    onClick={() => navigate('/getting-started')} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    🚀 Guide de démarrage
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
