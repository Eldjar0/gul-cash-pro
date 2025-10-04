import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { useDataExport } from '@/hooks/useDataExport';

interface ExportDataButtonProps {
  data: any[];
  filename: string;
  label?: string;
}

export function ExportDataButton({ data, filename, label = 'Exporter' }: ExportDataButtonProps) {
  const { exportToCSV, exportToJSON } = useDataExport();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportToCSV(data, filename)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exporter en CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToJSON(data, filename)}>
          <FileJson className="h-4 w-4 mr-2" />
          Exporter en JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
