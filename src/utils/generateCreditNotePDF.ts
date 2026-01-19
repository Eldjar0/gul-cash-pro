import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import logoInvoice from '../assets/logo-invoice.png';

interface CreditNoteData {
  creditNoteNumber: string;
  date: Date;
  validatedAt?: Date;
  originalInvoiceNumber?: string;
  company: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    vatNumber: string;
    phone?: string;
    email?: string;
  };
  customer?: {
    name: string;
    vatNumber?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    subtotal: number;
    vatAmount: number;
    total: number;
  }>;
  reason: string;
  notes?: string;
  subtotal: number;
  totalVat: number;
  total: number;
}

export const generateCreditNotePDF = async (creditNote: CreditNoteData): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let yPos = 12;

  // ============ HEADER: LOGO + SOCIÉTÉ ============
  try {
    doc.addImage(logoInvoice, 'PNG', margin, yPos, 40, 20);
  } catch {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(creditNote.company.name, margin, yPos + 8);
  }

  // Infos société (droite, compact)
  const rightX = pageWidth - margin;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text([
    creditNote.company.name,
    creditNote.company.address,
    `${creditNote.company.postalCode} ${creditNote.company.city}`,
    `TVA: ${creditNote.company.vatNumber}`
  ], rightX, yPos + 2, { align: 'right' });

  yPos = 38;

  // ============ TITRE + INFOS NOTE DE CRÉDIT ============
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69); // Rouge pour note de crédit
  doc.text('NOTE DE CRÉDIT', margin, yPos);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const creditNoteInfo = [
    `N°: ${creditNote.creditNoteNumber}`,
    `Date: ${format(new Date(creditNote.date), 'dd/MM/yyyy', { locale: fr })}`,
    creditNote.originalInvoiceNumber ? `Réf. Facture: ${creditNote.originalInvoiceNumber}` : ''
  ].filter(Boolean).join('  •  ');
  doc.text(creditNoteInfo, rightX, yPos, { align: 'right' });

  yPos += 8;

  // ============ CLIENT (compact) ============
  if (creditNote.customer) {
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, yPos, 90, 18, 1, 1, 'F');
    
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text('DESTINATAIRE', margin + 3, yPos + 4);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(creditNote.customer.name, margin + 3, yPos + 9);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let clientY = yPos + 12;
    if (creditNote.customer.address) {
      doc.text(creditNote.customer.address, margin + 3, clientY);
      clientY += 3;
    }
    if (creditNote.customer.postalCode || creditNote.customer.city) {
      doc.text(`${creditNote.customer.postalCode || ''} ${creditNote.customer.city || ''}`.trim(), margin + 3, clientY);
    }
    if (creditNote.customer.vatNumber) {
      doc.setFontSize(6);
      doc.text(`TVA: ${creditNote.customer.vatNumber}`, margin + 3, yPos + 16);
    }
    
    yPos += 22;
  }

  // ============ MOTIF ============
  doc.setFillColor(255, 243, 243);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 1, 1, 'F');
  
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text('MOTIF', margin + 3, yPos + 4);
  
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(creditNote.reason, margin + 3, yPos + 9);
  
  yPos += 16;

  // ============ TABLEAU DES ARTICLES ============
  const tableData = creditNote.items.map((item, idx) => [
    (idx + 1).toString(),
    item.description || 'Article',
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)}€`,
    `${item.vatRate}%`,
    `${item.total.toFixed(2)}€`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Désignation', 'Qté', 'P.U. HT', 'TVA', 'Total TTC']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [248, 248, 248],
      textColor: [80, 80, 80],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 4;

  // ============ TOTAUX (compact, aligné droite) ============
  const totalsWidth = 70;
  const totalsX = pageWidth - margin - totalsWidth;
  
  doc.setFillColor(255, 243, 243);
  doc.roundedRect(totalsX, yPos, totalsWidth, 28, 2, 2, 'F');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  const col1 = totalsX + 5;
  const col2 = totalsX + totalsWidth - 5;
  let totY = yPos + 6;
  
  doc.text('Sous-total HT', col1, totY);
  doc.text(`${creditNote.subtotal.toFixed(2)}€`, col2, totY, { align: 'right' });
  
  totY += 5;
  doc.text('TVA', col1, totY);
  doc.text(`${creditNote.totalVat.toFixed(2)}€`, col2, totY, { align: 'right' });
  
  totY += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(col1, totY - 2, col2, totY - 2);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69);
  doc.text('AVOIR', col1, totY + 3);
  doc.text(`-${creditNote.total.toFixed(2)}€`, col2, totY + 3, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  yPos += 35;

  // ============ NOTES ============
  if (creditNote.notes) {
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text('NOTES', margin, yPos);
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    doc.text(creditNote.notes, margin, yPos + 4);
    yPos += 12;
  }

  // ============ FOOTER ============
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `${creditNote.company.name} • TVA: ${creditNote.company.vatNumber}`,
    pageWidth / 2, footerY, { align: 'center' }
  );

  return doc;
};

export const downloadCreditNotePDF = async (creditNote: CreditNoteData): Promise<void> => {
  const doc = await generateCreditNotePDF(creditNote);
  doc.save(`note-credit-${creditNote.creditNoteNumber}.pdf`);
};

export const previewCreditNotePDF = async (creditNote: CreditNoteData): Promise<void> => {
  const doc = await generateCreditNotePDF(creditNote);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

export const getCreditNotePDFBlob = async (creditNote: CreditNoteData): Promise<Blob> => {
  const doc = await generateCreditNotePDF(creditNote);
  return doc.output('blob');
};
