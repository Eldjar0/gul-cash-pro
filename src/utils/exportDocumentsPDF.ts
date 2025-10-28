import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DocumentExportOptions {
  type: 'sales' | 'invoices' | 'refunds';
  documents: any[];
  dateRange?: { start: Date; end: Date };
  companyInfo?: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    vatNumber?: string;
  };
}

export async function exportDocumentsToPDF(options: DocumentExportOptions): Promise<void> {
  const { type, documents, dateRange, companyInfo } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Titre
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  
  let title = '';
  switch (type) {
    case 'sales':
      title = 'REGISTRE DES VENTES';
      break;
    case 'invoices':
      title = 'REGISTRE DES FACTURES';
      break;
    case 'refunds':
      title = 'REGISTRE DES REMBOURSEMENTS';
      break;
  }
  
  doc.text(title, pageWidth / 2, 20, { align: 'center' });
  
  // Info entreprise
  if (companyInfo) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = 30;
    doc.text(companyInfo.name, pageWidth / 2, yPos, { align: 'center' });
    if (companyInfo.address) {
      yPos += 5;
      doc.text(companyInfo.address, pageWidth / 2, yPos, { align: 'center' });
    }
    if (companyInfo.city && companyInfo.postalCode) {
      yPos += 5;
      doc.text(`${companyInfo.postalCode} ${companyInfo.city}`, pageWidth / 2, yPos, { align: 'center' });
    }
    if (companyInfo.vatNumber) {
      yPos += 5;
      doc.text(`TVA: ${companyInfo.vatNumber}`, pageWidth / 2, yPos, { align: 'center' });
    }
  }
  
  // Période
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let periodText = 'Tous les documents';
  if (dateRange) {
    periodText = `Période: ${format(dateRange.start, 'dd/MM/yyyy', { locale: fr })} - ${format(dateRange.end, 'dd/MM/yyyy', { locale: fr })}`;
  }
  doc.text(periodText, pageWidth / 2, 50, { align: 'center' });
  
  // Ligne de séparation
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(10, 55, pageWidth - 10, 55);
  
  // Tableau des données
  const tableData: any[] = [];
  
  documents.forEach((doc) => {
    const row: any = [];
    
    switch (type) {
      case 'sales':
        row.push(
          doc.sale_number || '-',
          format(new Date(doc.date), 'dd/MM/yyyy HH:mm', { locale: fr }),
          doc.fiscal_number || '-',
          `${doc.total.toFixed(2)}€`,
          doc.payment_method?.toUpperCase() || '-',
          doc.is_cancelled ? 'ANNULÉ' : 'Valide'
        );
        break;
      case 'invoices':
        row.push(
          doc.sale_number || '-',
          format(new Date(doc.date), 'dd/MM/yyyy', { locale: fr }),
          doc.customers?.name || 'Client anonyme',
          doc.customers?.vat_number || '-',
          `${doc.subtotal.toFixed(2)}€`,
          `${doc.total_vat.toFixed(2)}€`,
          `${doc.total.toFixed(2)}€`,
          doc.invoice_status || 'brouillon',
          doc.is_cancelled ? 'ANNULÉ' : 'Valide'
        );
        break;
      case 'refunds':
        row.push(
          doc.refund_number || '-',
          format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
          doc.customers?.name || '-',
          doc.reason || '-',
          `${doc.total.toFixed(2)}€`,
          doc.refund_type || '-'
        );
        break;
    }
    
    tableData.push(row);
  });
  
  // En-têtes de colonnes
  let headers: string[] = [];
  switch (type) {
    case 'sales':
      headers = ['N° Ticket', 'Date', 'N° Fiscal', 'Montant', 'Paiement', 'Statut'];
      break;
    case 'invoices':
      headers = ['N° Facture', 'Date', 'Client', 'N° TVA', 'HT', 'TVA', 'TTC', 'Statut Fact.', 'Statut'];
      break;
    case 'refunds':
      headers = ['N° Remb.', 'Date', 'Client', 'Raison', 'Montant', 'Type'];
      break;
  }
  
  autoTable(doc, {
    startY: 60,
    head: [headers],
    body: tableData,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [34, 197, 94], // emerald-500
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244], // emerald-50
    },
    columnStyles: type === 'invoices' ? {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 },
      7: { cellWidth: 25 },
      8: { cellWidth: 20 },
    } : undefined,
  });
  
  // Totaux
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  const totalAmount = documents
    .filter(d => !d.is_cancelled)
    .reduce((sum, d) => sum + (d.total || 0), 0);
  const totalCount = documents.filter(d => !d.is_cancelled).length;
  const cancelledCount = documents.filter(d => d.is_cancelled).length;
  
  doc.text(`Total documents valides: ${totalCount}`, 14, finalY);
  doc.text(`Documents annulés: ${cancelledCount}`, 14, finalY + 7);
  doc.text(`Montant total: ${totalAmount.toFixed(2)}€`, 14, finalY + 14);
  
  // Mentions légales
  const legalY = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Conservation obligatoire: 10 ans - Art. 315bis CIR92', pageWidth / 2, legalY, { align: 'center' });
  doc.text('Document comptable officiel - Ne pas détruire', pageWidth / 2, legalY + 5, { align: 'center' });
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, legalY + 10, { align: 'center' });
  
  // Télécharger
  const filename = `${type}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
  doc.save(filename);
}
