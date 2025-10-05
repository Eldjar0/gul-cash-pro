import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Supplier } from '@/hooks/useSuppliers';

export const generateSuppliersPDF = (suppliers: Supplier[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // En-tête
  doc.setFillColor(20, 184, 166);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTE DES FOURNISSEURS', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Généré le ${dateStr}`, pageWidth / 2, 25, { align: 'center' });
  
  // Statistiques
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${suppliers.length} fournisseur(s)`, 14, 45);
  
  const activeCount = suppliers.filter(s => s.is_active).length;
  doc.text(`Actifs: ${activeCount}`, pageWidth - 14, 45, { align: 'right' });
  
  // Tableau des fournisseurs
  const tableData = suppliers.map(supplier => [
    supplier.name,
    supplier.contact_name || '-',
    supplier.email || '-',
    supplier.phone || '-',
    supplier.address ? `${supplier.address}\n${supplier.postal_code || ''} ${supplier.city || ''}`.trim() : '-',
    supplier.notes || '-',
    supplier.is_active ? 'Actif' : 'Inactif'
  ]);
  
  autoTable(doc, {
    startY: 55,
    head: [['Nom', 'Contact', 'Email', 'Téléphone', 'Adresse', 'Notes', 'Statut']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [20, 184, 166],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold' },
      1: { cellWidth: 25 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 35 },
      5: { cellWidth: 30 },
      6: { cellWidth: 15, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    didDrawPage: (data) => {
      // Pied de page
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${data.pageNumber} sur ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
  });
  
  // Détails complets par fournisseur sur nouvelles pages
  suppliers.forEach((supplier, index) => {
    doc.addPage();
    
    // En-tête fournisseur
    doc.setFillColor(20, 184, 166);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(supplier.name, pageWidth / 2, 15, { align: 'center' });
    
    let y = 35;
    doc.setTextColor(0, 0, 0);
    
    // Section Contact
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS DE CONTACT', 16, y + 5.5);
    y += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (supplier.contact_name) {
      doc.setFont('helvetica', 'bold');
      doc.text('Contact:', 16, y);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.contact_name, 50, y);
      y += 7;
    }
    
    if (supplier.email) {
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', 16, y);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.email, 50, y);
      y += 7;
    }
    
    if (supplier.phone) {
      doc.setFont('helvetica', 'bold');
      doc.text('Téléphone:', 16, y);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.phone, 50, y);
      y += 7;
    }
    
    y += 5;
    
    // Section Adresse
    if (supplier.address || supplier.city || supplier.postal_code) {
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ADRESSE', 16, y + 5.5);
      y += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (supplier.address) {
        doc.text(supplier.address, 16, y);
        y += 7;
      }
      
      if (supplier.postal_code || supplier.city) {
        const location = `${supplier.postal_code || ''} ${supplier.city || ''}`.trim();
        doc.text(location, 16, y);
        y += 7;
      }
      
      y += 5;
    }
    
    // Section Notes
    if (supplier.notes) {
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES', 16, y + 5.5);
      y += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(supplier.notes, pageWidth - 32);
      doc.text(splitNotes, 16, y);
      y += splitNotes.length * 7;
    }
    
    // Statut
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const statusText = supplier.is_active ? 'STATUT: ACTIF' : 'STATUT: INACTIF';
    const statusColor = supplier.is_active ? [34, 197, 94] : [239, 68, 68];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(statusText, 16, y);
    
    // Date de création
    doc.setTextColor(128);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const createdDate = new Date(supplier.created_at).toLocaleDateString('fr-FR');
    doc.text(`Créé le: ${createdDate}`, 16, y + 7);
  });
  
  doc.save(`fournisseurs_${new Date().toISOString().split('T')[0]}.pdf`);
};
