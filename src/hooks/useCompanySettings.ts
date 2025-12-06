import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { COMPANY_INFO } from '@/data/company';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  bic?: string;
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
  // Nouveaux champs légaux belges
  legal_form?: string;
  bce_number?: string;
  head_office_address?: string;
  // Champs dérivés du premier compte bancaire (pour UBL)
  bank_iban?: string;
  bank_bic?: string;
  payment_terms_days?: number;
  late_interest_rate?: number;
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
      // Charger à la fois company_info et invoice_settings
      const [companyData, invoiceData] = await Promise.all([
        supabase.from('settings').select('*').eq('key', 'company_info').maybeSingle(),
        supabase.from('settings').select('*').eq('key', 'invoice_settings').maybeSingle(),
      ]);

      let mergedSettings = { ...DEFAULT_SETTINGS };

      // Fusionner company_info si existe
      if (companyData.data?.value) {
        const companyInfo = companyData.data.value as any;
        mergedSettings = {
          ...mergedSettings,
          name: companyInfo.name || '',
          address: companyInfo.address || '',
          city: companyInfo.city || '',
          postal_code: companyInfo.postal_code || '',
          vat_number: companyInfo.vat_number || '',
          phone: companyInfo.phone || '',
          email: companyInfo.email || '',
        };
      }

      // Fusionner invoice_settings si existe (prioritaire)
      if (invoiceData.data?.value) {
        const invoiceSettings = invoiceData.data.value as any;
        mergedSettings = {
          ...mergedSettings,
          ...invoiceSettings,
          name: invoiceSettings.is_company 
            ? invoiceSettings.company_name || mergedSettings.name
            : `${invoiceSettings.first_name || ''} ${invoiceSettings.last_name || ''}`.trim() || mergedSettings.name,
          address: invoiceSettings.store_address || mergedSettings.address,
          city: invoiceSettings.store_city || mergedSettings.city,
          postal_code: invoiceSettings.store_postal_code || mergedSettings.postal_code,
        };

        // Extraire IBAN et BIC du premier compte bancaire (source unique de vérité)
        const bankAccounts = invoiceSettings.bank_accounts as BankAccount[] | undefined;
        if (bankAccounts && bankAccounts.length > 0) {
          const primaryAccount = bankAccounts[0];
          mergedSettings.bank_iban = primaryAccount.account_number || '';
          mergedSettings.bank_bic = primaryAccount.bic || '';
        }
      }

      setSettings(mergedSettings);
    } catch (error) {
      console.error('Error loading company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refresh: loadSettings };
}
