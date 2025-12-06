import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExportOptions {
  documents: any[];
  type: 'sales' | 'invoices';
  dateRange?: { start: Date; end: Date };
  companyInfo?: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    vatNumber?: string;
  };
}

// Export XML standard
export function exportToXML(options: ExportOptions): void {
  const { documents, type, dateRange, companyInfo } = options;
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<${type === 'sales' ? 'Ventes' : 'Factures'}>\n`;
  
  if (companyInfo) {
    xml += '  <Entreprise>\n';
    xml += `    <Nom>${escapeXML(companyInfo.name)}</Nom>\n`;
    if (companyInfo.vatNumber) xml += `    <NumeroTVA>${escapeXML(companyInfo.vatNumber)}</NumeroTVA>\n`;
    if (companyInfo.address) xml += `    <Adresse>${escapeXML(companyInfo.address)}</Adresse>\n`;
    if (companyInfo.postalCode && companyInfo.city) {
      xml += `    <CodePostal>${escapeXML(companyInfo.postalCode)}</CodePostal>\n`;
      xml += `    <Ville>${escapeXML(companyInfo.city)}</Ville>\n`;
    }
    xml += '  </Entreprise>\n';
  }
  
  if (dateRange) {
    xml += '  <Periode>\n';
    xml += `    <Debut>${format(dateRange.start, 'yyyy-MM-dd')}</Debut>\n`;
    xml += `    <Fin>${format(dateRange.end, 'yyyy-MM-dd')}</Fin>\n`;
    xml += '  </Periode>\n';
  }
  
  xml += '  <Documents>\n';
  
  documents.forEach(doc => {
    xml += `    <Document>\n`;
    xml += `      <Numero>${escapeXML(doc.sale_number || doc.invoice_number)}</Numero>\n`;
    xml += `      <Date>${format(new Date(doc.date || doc.created_at), 'yyyy-MM-dd\'T\'HH:mm:ss')}</Date>\n`;
    
    if (doc.fiscal_number) {
      xml += `      <NumeroFiscal>${escapeXML(doc.fiscal_number)}</NumeroFiscal>\n`;
    }
    
    if (doc.customers) {
      xml += `      <Client>\n`;
      xml += `        <Nom>${escapeXML(doc.customers.name)}</Nom>\n`;
      if (doc.customers.vat_number) xml += `        <NumeroTVA>${escapeXML(doc.customers.vat_number)}</NumeroTVA>\n`;
      xml += `      </Client>\n`;
    }
    
    xml += `      <Montants>\n`;
    xml += `        <SousTotal>${doc.subtotal.toFixed(2)}</SousTotal>\n`;
    xml += `        <TVA>${doc.total_vat.toFixed(2)}</TVA>\n`;
    xml += `        <Total>${doc.total.toFixed(2)}</Total>\n`;
    xml += `      </Montants>\n`;
    
    if (doc.payment_method) {
      xml += `      <ModePaiement>${escapeXML(doc.payment_method)}</ModePaiement>\n`;
    }
    
    xml += `      <Statut>${doc.is_cancelled ? 'ANNULE' : 'VALIDE'}</Statut>\n`;
    
    if (doc.sale_items?.length > 0) {
      xml += `      <Articles>\n`;
      doc.sale_items.forEach((item: any) => {
        xml += `        <Article>\n`;
        xml += `          <Nom>${escapeXML(item.product_name)}</Nom>\n`;
        xml += `          <Quantite>${item.quantity}</Quantite>\n`;
        xml += `          <PrixUnitaire>${item.unit_price.toFixed(2)}</PrixUnitaire>\n`;
        xml += `          <TauxTVA>${item.vat_rate}</TauxTVA>\n`;
        xml += `          <Total>${item.total.toFixed(2)}</Total>\n`;
        xml += `        </Article>\n`;
      });
      xml += `      </Articles>\n`;
    }
    
    xml += `    </Document>\n`;
  });
  
  xml += '  </Documents>\n';
  
  xml += '  <Resume>\n';
  const validDocs = documents.filter(d => !d.is_cancelled);
  const totalAmount = validDocs.reduce((sum, d) => sum + d.total, 0);
  xml += `    <NombreDocuments>${validDocs.length}</NombreDocuments>\n`;
  xml += `    <MontantTotal>${totalAmount.toFixed(2)}</MontantTotal>\n`;
  xml += '  </Resume>\n';
  
  xml += `</${type === 'sales' ? 'Ventes' : 'Factures'}>`;
  
  downloadFile(xml, `${type}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xml`, 'application/xml');
}

// Génère le contenu UBL pour une seule facture
function generateUBLContent(doc: any, companyInfo?: ExportOptions['companyInfo']): string {
  let ubl = '<?xml version="1.0" encoding="UTF-8"?>\n';
  ubl += '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">\n';
  
  ubl += `  <cbc:ID>${escapeXML(doc.sale_number)}</cbc:ID>\n`;
  ubl += `  <cbc:IssueDate>${format(new Date(doc.date), 'yyyy-MM-dd')}</cbc:IssueDate>\n`;
  ubl += `  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>\n`;
  ubl += `  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>\n`;
  
  if (companyInfo) {
    ubl += '  <cac:AccountingSupplierParty>\n';
    ubl += '    <cac:Party>\n';
    ubl += `      <cbc:EndpointID schemeID="BE:VAT">${escapeXML(companyInfo.vatNumber || '')}</cbc:EndpointID>\n`;
    ubl += '      <cac:PartyName>\n';
    ubl += `        <cbc:Name>${escapeXML(companyInfo.name)}</cbc:Name>\n`;
    ubl += '      </cac:PartyName>\n';
    if (companyInfo.address) {
      ubl += '      <cac:PostalAddress>\n';
      ubl += `        <cbc:StreetName>${escapeXML(companyInfo.address)}</cbc:StreetName>\n`;
      ubl += `        <cbc:CityName>${escapeXML(companyInfo.city || '')}</cbc:CityName>\n`;
      ubl += `        <cbc:PostalZone>${escapeXML(companyInfo.postalCode || '')}</cbc:PostalZone>\n`;
      ubl += '        <cac:Country>\n';
      ubl += '          <cbc:IdentificationCode>BE</cbc:IdentificationCode>\n';
      ubl += '        </cac:Country>\n';
      ubl += '      </cac:PostalAddress>\n';
    }
    ubl += '    </cac:Party>\n';
    ubl += '  </cac:AccountingSupplierParty>\n';
  }
  
  if (doc.customers) {
    ubl += '  <cac:AccountingCustomerParty>\n';
    ubl += '    <cac:Party>\n';
    if (doc.customers.vat_number) {
      ubl += `      <cbc:EndpointID schemeID="BE:VAT">${escapeXML(doc.customers.vat_number)}</cbc:EndpointID>\n`;
    }
    ubl += '      <cac:PartyName>\n';
    ubl += `        <cbc:Name>${escapeXML(doc.customers.name)}</cbc:Name>\n`;
    ubl += '      </cac:PartyName>\n';
    ubl += '    </cac:Party>\n';
    ubl += '  </cac:AccountingCustomerParty>\n';
  }
  
  ubl += '  <cac:LegalMonetaryTotal>\n';
  ubl += `    <cbc:LineExtensionAmount currencyID="EUR">${doc.subtotal.toFixed(2)}</cbc:LineExtensionAmount>\n`;
  ubl += `    <cbc:TaxExclusiveAmount currencyID="EUR">${doc.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>\n`;
  ubl += `    <cbc:TaxInclusiveAmount currencyID="EUR">${doc.total.toFixed(2)}</cbc:TaxInclusiveAmount>\n`;
  ubl += `    <cbc:PayableAmount currencyID="EUR">${doc.total.toFixed(2)}</cbc:PayableAmount>\n`;
  ubl += '  </cac:LegalMonetaryTotal>\n';
  
  if (doc.sale_items?.length > 0) {
    doc.sale_items.forEach((item: any, idx: number) => {
      ubl += '  <cac:InvoiceLine>\n';
      ubl += `    <cbc:ID>${idx + 1}</cbc:ID>\n`;
      ubl += `    <cbc:InvoicedQuantity unitCode="C62">${item.quantity}</cbc:InvoicedQuantity>\n`;
      ubl += `    <cbc:LineExtensionAmount currencyID="EUR">${item.subtotal.toFixed(2)}</cbc:LineExtensionAmount>\n`;
      ubl += '    <cac:Item>\n';
      ubl += `      <cbc:Name>${escapeXML(item.product_name)}</cbc:Name>\n`;
      ubl += '    </cac:Item>\n';
      ubl += '    <cac:Price>\n';
      ubl += `      <cbc:PriceAmount currencyID="EUR">${item.unit_price.toFixed(2)}</cbc:PriceAmount>\n`;
      ubl += '    </cac:Price>\n';
      ubl += '  </cac:InvoiceLine>\n';
    });
  }
  
  ubl += '</Invoice>';
  return ubl;
}

// Export UBL (Universal Business Language) - Format belge/européen
// Pour une seule facture: télécharge directement le XML
// Pour plusieurs factures: crée un ZIP avec un fichier XML par facture
export async function exportToUBL(options: ExportOptions): Promise<void> {
  const { documents, companyInfo } = options;
  
  if (documents.length === 1) {
    // Une seule facture: téléchargement direct
    const ubl = generateUBLContent(documents[0], companyInfo);
    downloadFile(ubl, `facture_ubl_${documents[0].sale_number}_${format(new Date(), 'yyyy-MM-dd')}.xml`, 'application/xml');
  } else {
    // Plusieurs factures: créer un ZIP
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    documents.forEach(doc => {
      const ubl = generateUBLContent(doc, companyInfo);
      const filename = `facture_ubl_${doc.sale_number.replace(/[^a-zA-Z0-9-_]/g, '_')}.xml`;
      zip.file(filename, ubl);
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `factures_ubl_${format(new Date(), 'yyyy-MM-dd')}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export CSV
export function exportToCSV(options: ExportOptions): void {
  const { documents, type } = options;
  
  let csv = '';
  
  if (type === 'sales') {
    csv = 'Numéro;Date;Numéro Fiscal;Client;Sous-total HT;TVA;Total TTC;Mode Paiement;Statut\n';
    documents.forEach(doc => {
      csv += `"${doc.sale_number}";`;
      csv += `"${format(new Date(doc.date), 'dd/MM/yyyy HH:mm')}";`;
      csv += `"${doc.fiscal_number || ''}";`;
      csv += `"${doc.customers?.name || ''}";`;
      csv += `${doc.subtotal.toFixed(2)};`;
      csv += `${doc.total_vat.toFixed(2)};`;
      csv += `${doc.total.toFixed(2)};`;
      csv += `"${doc.payment_method || ''}";`;
      csv += `"${doc.is_cancelled ? 'ANNULÉ' : 'VALIDE'}"\n`;
    });
  } else {
    csv = 'Numéro;Date;Client;N° TVA Client;Sous-total HT;TVA;Total TTC;Statut Facture;Statut\n';
    documents.forEach(doc => {
      csv += `"${doc.sale_number}";`;
      csv += `"${format(new Date(doc.date), 'dd/MM/yyyy')}";`;
      csv += `"${doc.customers?.name || ''}";`;
      csv += `"${doc.customers?.vat_number || ''}";`;
      csv += `${doc.subtotal.toFixed(2)};`;
      csv += `${doc.total_vat.toFixed(2)};`;
      csv += `${doc.total.toFixed(2)};`;
      csv += `"${doc.invoice_status || 'payé'}";`;
      csv += `"${doc.is_cancelled ? 'ANNULÉ' : 'VALIDE'}"\n`;
    });
  }
  
  downloadFile(csv, `${type}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`, 'text/csv;charset=utf-8;');
}

// Export CSV détaillé des produits
export function exportProductsSalesCSV(documents: any[], dateRange?: { start: Date; end: Date }): void {
  const productStats: { [key: string]: { name: string; quantity: number; total: number } } = {};
  
  documents.forEach(doc => {
    if (doc.is_cancelled) return;
    
    doc.sale_items?.forEach((item: any) => {
      const key = item.product_id || item.product_name;
      if (!productStats[key]) {
        productStats[key] = { name: item.product_name, quantity: 0, total: 0 };
      }
      productStats[key].quantity += parseFloat(item.quantity);
      productStats[key].total += parseFloat(item.total);
    });
  });
  
  let csv = 'Produit;Quantité Vendue;Montant Total HT;Montant Total TTC\n';
  
  Object.values(productStats)
    .sort((a, b) => b.total - a.total)
    .forEach(product => {
      csv += `"${product.name}";`;
      csv += `${product.quantity.toFixed(3)};`;
      csv += `${(product.total / 1.21).toFixed(2)};`;
      csv += `${product.total.toFixed(2)}\n`;
    });
  
  csv += '\n';
  csv += `Total général;${Object.values(productStats).reduce((sum, p) => sum + p.quantity, 0).toFixed(3)};`;
  csv += `;${Object.values(productStats).reduce((sum, p) => sum + p.total, 0).toFixed(2)}\n`;
  
  if (dateRange) {
    csv += `\nPériode: du ${format(dateRange.start, 'dd/MM/yyyy')} au ${format(dateRange.end, 'dd/MM/yyyy')}\n`;
  }
  
  downloadFile(csv, `produits_vendus_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`, 'text/csv;charset=utf-8;');
}

function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob(['\ufeff' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
