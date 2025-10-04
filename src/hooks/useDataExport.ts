import { toast } from 'sonner';
import { format } from 'date-fns';

export const useDataExport = () => {
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      // Get headers from first object
      const headers = Object.keys(data[0]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export réussi');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const exportToJSON = (data: any, filename: string) => {
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export réussi');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  return {
    exportToCSV,
    exportToJSON,
  };
};
