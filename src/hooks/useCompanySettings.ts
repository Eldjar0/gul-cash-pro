import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { COMPANY_INFO } from '@/data/company';

export interface CompanySettings {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  vat_number: string;
  phone: string;
  email: string;
}

// Convertir COMPANY_INFO en format CompanySettings
const DEFAULT_SETTINGS: CompanySettings = {
  name: COMPANY_INFO.name,
  address: COMPANY_INFO.address,
  city: COMPANY_INFO.city,
  postal_code: COMPANY_INFO.postalCode,
  vat_number: COMPANY_INFO.vat,
  phone: COMPANY_INFO.phone || '',
  email: '',
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
        .eq('key', 'company_info')
        .maybeSingle();

      if (data?.value) {
        setSettings(data.value as unknown as CompanySettings);
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refresh: loadSettings };
}
