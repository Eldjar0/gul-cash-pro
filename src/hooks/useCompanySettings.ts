import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { COMPANY_INFO } from '@/data/company';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
}

export interface CompanySettings {
  is_company?: boolean;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  vat_number: string;
  phone: string;
  email: string;
  headquarters_address?: string;
  headquarters_city?: string;
  headquarters_postal_code?: string;
  store_address?: string;
  store_city?: string;
  store_postal_code?: string;
  bank_accounts?: BankAccount[];
}

// Convertir COMPANY_INFO en format CompanySettings
const DEFAULT_SETTINGS: CompanySettings = {
  is_company: true,
  company_name: COMPANY_INFO.name,
  name: COMPANY_INFO.name,
  address: COMPANY_INFO.address,
  city: COMPANY_INFO.city,
  postal_code: COMPANY_INFO.postalCode,
  vat_number: COMPANY_INFO.vat,
  phone: COMPANY_INFO.phone || '',
  email: '',
  headquarters_address: COMPANY_INFO.address,
  headquarters_city: COMPANY_INFO.city,
  headquarters_postal_code: COMPANY_INFO.postalCode,
  store_address: COMPANY_INFO.address,
  store_city: COMPANY_INFO.city,
  store_postal_code: COMPANY_INFO.postalCode,
  bank_accounts: [],
};

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'invoice_settings')
        .maybeSingle();

      if (data?.value) {
        const invoiceSettings = data.value as any;
        // Mapper vers l'ancien format pour compatibilité
        setSettings({
          ...DEFAULT_SETTINGS,
          ...invoiceSettings,
          name: invoiceSettings.is_company 
            ? invoiceSettings.company_name 
            : `${invoiceSettings.first_name} ${invoiceSettings.last_name}`,
          address: invoiceSettings.store_address || invoiceSettings.headquarters_address || '',
          city: invoiceSettings.store_city || invoiceSettings.headquarters_city || '',
          postal_code: invoiceSettings.store_postal_code || invoiceSettings.headquarters_postal_code || '',
        });
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refresh: loadSettings };
}
