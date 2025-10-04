import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  lastBackup?: string;
}

// Hook pour obtenir la configuration de backup
export const useBackupConfig = () => {
  return useQuery({
    queryKey: ['backup-config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'backup_config')
        .maybeSingle();

      if (data?.value) {
        return data.value as unknown as BackupConfig;
      }

      return {
        enabled: false,
        frequency: 'daily' as const,
        retentionDays: 30,
      };
    },
  });
};

// Hook pour sauvegarder la configuration
export const useSaveBackupConfig = () => {
  return useMutation({
    mutationFn: async (config: BackupConfig) => {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'backup_config',
          value: config as any,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuration de sauvegarde enregistrée');
    },
    onError: (error: Error) => {
      console.error('Error saving backup config:', error);
      toast.error('Erreur lors de l\'enregistrement de la configuration');
    },
  });
};

// Hook pour créer un backup manuel
export const useCreateBackup = () => {
  return useMutation({
    mutationFn: async () => {
      // Récupérer toutes les données importantes
      const [sales, products, customers, categories, settings] = await Promise.all([
        supabase.from('sales').select('*, sale_items(*)'),
        supabase.from('products').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('settings').select('*'),
      ]);

      const backup = {
        timestamp: new Date().toISOString(),
        data: {
          sales: sales.data,
          products: products.data,
          customers: customers.data,
          categories: categories.data,
          settings: settings.data,
        },
      };

      // Créer un fichier JSON téléchargeable
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Mettre à jour la date de dernière sauvegarde
      const { data: config } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'backup_config')
        .maybeSingle();

      if (config) {
        const updatedConfig = {
          ...(config.value as any),
          lastBackup: new Date().toISOString(),
        };

        await supabase
          .from('settings')
          .upsert({
            key: 'backup_config',
            value: updatedConfig,
          });
      }

      return backup;
    },
    onSuccess: () => {
      toast.success('Sauvegarde créée avec succès', {
        description: 'Le fichier a été téléchargé',
      });
    },
    onError: (error: Error) => {
      console.error('Error creating backup:', error);
      toast.error('Erreur lors de la création de la sauvegarde');
    },
  });
};

// Hook pour exporter les données en CSV
export const useExportCSV = () => {
  return useMutation({
    mutationFn: async (type: 'sales' | 'products' | 'customers') => {
      let data: any[] = [];
      let headers: string[] = [];
      let filename = '';

      switch (type) {
        case 'sales':
          const { data: sales } = await supabase
            .from('sales')
            .select('*, sale_items(*)')
            .order('date', { ascending: false });
          
          data = sales || [];
          headers = ['Numéro', 'Date', 'Total', 'TVA', 'Paiement', 'Annulée'];
          filename = 'ventes';
          break;

        case 'products':
          const { data: products } = await supabase
            .from('products')
            .select('*')
            .order('name');
          
          data = products || [];
          headers = ['Code-barres', 'Nom', 'Prix', 'Stock', 'TVA%', 'Actif'];
          filename = 'produits';
          break;

        case 'customers':
          const { data: customers } = await supabase
            .from('customers')
            .select('*')
            .order('name');
          
          data = customers || [];
          headers = ['Nom', 'Email', 'Téléphone', 'Adresse', 'Ville', 'Code Postal'];
          filename = 'clients';
          break;
      }

      // Créer le contenu CSV
      const csvContent = [
        headers.join(','),
        ...data.map(row => {
          switch (type) {
            case 'sales':
              return [
                row.sale_number,
                new Date(row.date).toLocaleDateString('fr-FR'),
                row.total,
                row.total_vat,
                row.payment_method,
                row.is_cancelled ? 'Oui' : 'Non',
              ].join(',');
            case 'products':
              return [
                row.barcode || '',
                `"${row.name}"`,
                row.price,
                row.stock || 0,
                row.vat_rate,
                row.is_active ? 'Oui' : 'Non',
              ].join(',');
            case 'customers':
              return [
                `"${row.name}"`,
                row.email || '',
                row.phone || '',
                `"${row.address || ''}"`,
                row.city || '',
                row.postal_code || '',
              ].join(',');
            default:
              return '';
          }
        }),
      ].join('\n');

      // Télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success('Export CSV réussi');
    },
    onError: (error: Error) => {
      console.error('Error exporting CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    },
  });
};