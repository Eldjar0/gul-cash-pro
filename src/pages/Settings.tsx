import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building, Save, Plus, Trash2, Users, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from './UserManagement';
import ContactInfo from './ContactInfo';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
}

interface InvoiceSettings {
  is_company: boolean;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  headquarters_address: string;
  headquarters_city: string;
  headquarters_postal_code: string;
  store_address: string;
  store_city: string;
  store_postal_code: string;
  vat_number: string;
  phone: string;
  email: string;
  bank_accounts: BankAccount[];
  invoice_logo?: string;
}


export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<InvoiceSettings>({
    is_company: true,
    company_name: '',
    first_name: '',
    last_name: '',
    headquarters_address: '',
    headquarters_city: '',
    headquarters_postal_code: '',
    store_address: '',
    store_city: '',
    store_postal_code: '',
    vat_number: '',
    phone: '',
    email: '',
    bank_accounts: [],
    invoice_logo: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Charger à la fois company_info et invoice_settings
      const [companyData, invoiceData] = await Promise.all([
        supabase.from('settings').select('*').eq('key', 'company_info').maybeSingle(),
        supabase.from('settings').select('*').eq('key', 'invoice_settings').maybeSingle(),
      ]);

      let loadedSettings = {
        is_company: true,
        company_name: '',
        first_name: '',
        last_name: '',
        headquarters_address: '',
        headquarters_city: '',
        headquarters_postal_code: '',
        store_address: '',
        store_city: '',
        store_postal_code: '',
        vat_number: '',
        phone: '',
        email: '',
        bank_accounts: [] as BankAccount[],
        invoice_logo: '',
      };

      // Charger les données de company_info en premier
      if (companyData.data?.value) {
        const companyInfo = companyData.data.value as any;
        loadedSettings.company_name = companyInfo.name || '';
        loadedSettings.headquarters_address = companyInfo.address || '';
        loadedSettings.headquarters_city = companyInfo.city || '';
        loadedSettings.headquarters_postal_code = companyInfo.postal_code || '';
        loadedSettings.store_address = companyInfo.address || '';
        loadedSettings.store_city = companyInfo.city || '';
        loadedSettings.store_postal_code = companyInfo.postal_code || '';
        loadedSettings.vat_number = companyInfo.vat_number || '';
        loadedSettings.phone = companyInfo.phone || '';
        loadedSettings.email = companyInfo.email || '';
      }

      // Puis écraser avec invoice_settings si existe
      if (invoiceData.data?.value) {
        const invoiceSettings = invoiceData.data.value as any;
        loadedSettings = { ...loadedSettings, ...invoiceSettings };
      }

      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'invoice_settings')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('settings')
          .update({ value: settings as any })
          .eq('key', 'invoice_settings');
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({
            key: 'invoice_settings',
            value: settings as any,
          });
        
        if (error) throw error;
      }

      toast.success('Paramètres enregistrés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const addBankAccount = () => {
    setSettings({
      ...settings,
      bank_accounts: [
        ...settings.bank_accounts,
        { id: crypto.randomUUID(), bank_name: '', account_number: '' }
      ]
    });
  };

  const removeBankAccount = (id: string) => {
    setSettings({
      ...settings,
      bank_accounts: settings.bank_accounts.filter(acc => acc.id !== id)
    });
  };

  const updateBankAccount = (id: string, field: 'bank_name' | 'account_number', value: string) => {
    setSettings({
      ...settings,
      bank_accounts: settings.bank_accounts.map(acc =>
        acc.id === id ? { ...acc, [field]: value } : acc
      )
    });
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
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b border-primary/20 px-4 md:px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Paramètres</h1>
            <p className="text-sm text-white/80">Configuration et gestion des utilisateurs</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <Tabs defaultValue="billing" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Facturation
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="billing">
            <Card className="p-6">
          <div className="space-y-8">
            {/* Type d'entité */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Type d'entité
              </h2>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_company"
                  checked={settings.is_company}
                  onCheckedChange={(checked) => setSettings({ ...settings, is_company: checked as boolean })}
                />
                <Label htmlFor="is_company" className="cursor-pointer">
                  Société (sinon personne physique)
                </Label>
              </div>
            </div>

            {/* Nom / Identité */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Identité</h3>
              {settings.is_company ? (
                <div>
                  <Label htmlFor="company_name">Nom de la société *</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name || ''}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    placeholder="Ex: SARL Mon Commerce"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom *</Label>
                    <Input
                      id="first_name"
                      value={settings.first_name || ''}
                      onChange={(e) => setSettings({ ...settings, first_name: e.target.value })}
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom *</Label>
                    <Input
                      id="last_name"
                      value={settings.last_name || ''}
                      onChange={(e) => setSettings({ ...settings, last_name: e.target.value })}
                      placeholder="Dupont"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Adresse siège social */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Adresse du siège social</h3>
              <div>
                <Label htmlFor="hq_address">Adresse *</Label>
                <Input
                  id="hq_address"
                  value={settings.headquarters_address}
                  onChange={(e) => setSettings({ ...settings, headquarters_address: e.target.value })}
                  placeholder="123 Rue Example"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hq_postal">Code postal *</Label>
                  <Input
                    id="hq_postal"
                    value={settings.headquarters_postal_code}
                    onChange={(e) => setSettings({ ...settings, headquarters_postal_code: e.target.value })}
                    placeholder="6000"
                  />
                </div>
                <div>
                  <Label htmlFor="hq_city">Ville *</Label>
                  <Input
                    id="hq_city"
                    value={settings.headquarters_city}
                    onChange={(e) => setSettings({ ...settings, headquarters_city: e.target.value })}
                    placeholder="Charleroi"
                  />
                </div>
              </div>
            </div>

            {/* Adresse du commerce */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Adresse du commerce</h3>
              <div>
                <Label htmlFor="store_address">Adresse *</Label>
                <Input
                  id="store_address"
                  value={settings.store_address}
                  onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                  placeholder="456 Avenue du Commerce"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="store_postal">Code postal *</Label>
                  <Input
                    id="store_postal"
                    value={settings.store_postal_code}
                    onChange={(e) => setSettings({ ...settings, store_postal_code: e.target.value })}
                    placeholder="6000"
                  />
                </div>
                <div>
                  <Label htmlFor="store_city">Ville *</Label>
                  <Input
                    id="store_city"
                    value={settings.store_city}
                    onChange={(e) => setSettings({ ...settings, store_city: e.target.value })}
                    placeholder="Charleroi"
                  />
                </div>
              </div>
            </div>

            {/* Informations légales */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informations légales</h3>
              <div>
                <Label htmlFor="vat_number">Numéro de TVA *</Label>
                <Input
                  id="vat_number"
                  value={settings.vat_number}
                  onChange={(e) => setSettings({ ...settings, vat_number: e.target.value })}
                  placeholder="BE0123456789"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+32 71 12 34 56"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="contact@moncommerce.be"
                />
              </div>
            </div>

            {/* Logo de facturation */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Logo pour les factures</h3>
              <div>
                <Label htmlFor="invoice_logo">URL du logo</Label>
                <Input
                  id="invoice_logo"
                  value={settings.invoice_logo || ''}
                  onChange={(e) => setSettings({ ...settings, invoice_logo: e.target.value })}
                  placeholder="https://exemple.com/logo.png ou /chemin/vers/logo.png"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Le logo sera affiché en haut à gauche des factures
                </p>
              </div>
            </div>

            {/* Comptes bancaires */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Comptes bancaires</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBankAccount}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un compte
                </Button>
              </div>
              
              {settings.bank_accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Aucun compte bancaire configuré. Cliquez sur "Ajouter un compte" pour en ajouter.
                </p>
              ) : (
                <div className="space-y-4">
                  {settings.bank_accounts.map((account) => (
                    <Card key={account.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Compte bancaire</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBankAccount(account.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div>
                          <Label htmlFor={`bank_name_${account.id}`}>Nom de la banque</Label>
                          <Input
                            id={`bank_name_${account.id}`}
                            value={account.bank_name}
                            onChange={(e) => updateBankAccount(account.id, 'bank_name', e.target.value)}
                            placeholder="Ex: BNP Paribas Fortis"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`account_number_${account.id}`}>Numéro de compte (IBAN)</Label>
                          <Input
                            id={`account_number_${account.id}`}
                            value={account.account_number}
                            onChange={(e) => updateBankAccount(account.id, 'account_number', e.target.value)}
                            placeholder="BE00 0000 0000 0000"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Bouton sauvegarder */}
            <div className="pt-4">
              <Button onClick={saveSettings} disabled={saving} className="w-full" size="lg">
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
              </Button>
            </div>
          </div>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="contact">
            <ContactInfo />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
