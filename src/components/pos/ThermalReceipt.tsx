import { COMPANY_INFO } from '@/data/company';
import { Product } from '@/hooks/useProducts';
import logoTicket from '@/assets/logo-ticket.png';

type DiscountType = 'percentage' | 'amount';

interface CartItem {
  product: Product;
  quantity: number;
  discount?: {
    type: DiscountType;
    value: number;
  };
  subtotal: number;
  vatAmount: number;
  total: number;
}

interface Customer {
  name: string;
  vat_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

interface Sale {
  id?: string;
  sale_number?: string;
  saleNumber?: string;
  date?: Date;
  items: CartItem[];
  subtotal: number;
  total_vat?: number;
  totalVat?: number;
  total_discount?: number;
  totalDiscount?: number;
  total: number;
  payment_method?: 'cash' | 'card' | 'mobile';
  paymentMethod?: 'cash' | 'card' | 'mobile';
  amount_paid?: number;
  amountPaid?: number;
  change_amount?: number;
  change?: number;
  is_invoice?: boolean;
  customer?: Customer;
}

interface ThermalReceiptProps {
  sale: Sale;
}

export function ThermalReceipt({ sale }: ThermalReceiptProps) {
  const isInvoice = sale.is_invoice || false;
  const saleDate = new Date(sale.date || new Date());
  
  // Calculer TVA par taux (comme Lidl)
  const vatByRate = sale.items.reduce((acc, item) => {
    const rate = item.product.vat_rate;
    if (!acc[rate]) {
      acc[rate] = { totalHT: 0, totalVAT: 0 };
    }
    const priceHT = item.product.price / (1 + rate / 100);
    const itemHT = priceHT * item.quantity;
    const itemVAT = itemHT * (rate / 100);
    acc[rate].totalHT += itemHT;
    acc[rate].totalVAT += itemVAT;
    return acc;
  }, {} as Record<number, { totalHT: number; totalVAT: number }>);
  
  // Fonction pour formater et aligner les lignes
  const formatLine = (left: string, right: string, width = 40) => {
    const spaces = width - left.length - right.length;
    return left + ' '.repeat(Math.max(1, spaces)) + right;
  };
  
  return (
    <div 
      id="thermal-receipt"
      className="font-mono bg-white text-black"
      style={{ 
        width: '80mm',
        maxWidth: '302px',
        margin: '0 auto',
        fontFamily: "'Barlow Semi Condensed', 'Arial Narrow', Arial, sans-serif",
        fontSize: '11.7px',
        lineHeight: '1.3',
        padding: '4px',
        fontWeight: '900',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Logo centré */}
      <div className="text-center mb-2">
        <img 
          src={logoTicket} 
          alt="Logo" 
          style={{ 
            width: '98px', 
            height: 'auto', 
            margin: '0 auto',
            display: 'block'
          }} 
        />
      </div>

      {/* Company Info - centrée */}
      <div className="text-center mb-2" style={{ fontWeight: '900', fontSize: '8.8px' }}>
        <div style={{ lineHeight: '1.2' }}>
          <div>{COMPANY_INFO.address}</div>
          <div>{COMPANY_INFO.postalCode} {COMPANY_INFO.city}</div>
          {COMPANY_INFO.phone && <div>Tel: {COMPANY_INFO.phone}</div>}
          <div style={{ marginTop: '1px' }}>TVA: {COMPANY_INFO.vat}</div>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

      {/* Customer info - Only for invoices */}
      {isInvoice && sale.customer && (
        <>
          <div style={{ fontSize: '8.8px', marginBottom: '5px', fontWeight: '900', paddingRight: '2px' }}>
            <div style={{ fontWeight: '900', marginBottom: '2px' }}>CLIENT:</div>
            <div style={{ fontWeight: '900', wordWrap: 'break-word' }}>{sale.customer.name}</div>
            {sale.customer.vat_number && <div style={{ wordWrap: 'break-word' }}>TVA: {sale.customer.vat_number}</div>}
            {sale.customer.address && <div style={{ wordWrap: 'break-word' }}>{sale.customer.address}</div>}
            {(sale.customer.postal_code || sale.customer.city) && (
              <div>{sale.customer.postal_code} {sale.customer.city}</div>
            )}
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>
        </>
      )}

      {/* Sale info */}
      <div style={{ fontSize: '8.8px', marginBottom: '5px', fontWeight: '900', paddingRight: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900' }}>
          <span>{isInvoice ? 'FACTURE' : 'TICKET'} N°:</span>
          <span style={{ fontSize: '9.8px' }}>{sale.saleNumber || sale.sale_number}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
          <span>DATE:</span>
          <span style={{ fontSize: '7.8px' }}>{saleDate.toLocaleString('fr-BE', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

      {/* Items - Style Lidl */}
      <div style={{ marginBottom: '5px', paddingRight: '2px' }}>
        {sale.items.map((item, index) => {
          const unitDisplay = item.product.type === 'weight' ? 'kg' : 'pc';
          const qtyDisplay = item.quantity.toFixed(item.product.type === 'weight' ? 3 : 0);
          const pricePerUnit = item.product.price.toFixed(2);
          
          return (
            <div key={index} style={{ marginBottom: '3px' }}>
              {/* Nom du produit */}
              <div style={{ 
                fontWeight: '900', 
                textTransform: 'uppercase', 
                marginBottom: '1px',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: '100%',
                fontSize: '13.7px',
                letterSpacing: '0.3px'
              }}>
                {item.product.name}
              </div>
              
              {/* Ligne avec quantité, prix unitaire et total - REMISE SUR LA MÊME LIGNE */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontWeight: '900',
                gap: '3px',
                fontSize: '8.8px'
              }}>
                <span style={{ 
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: '1'
                }}>
                  {qtyDisplay} {unitDisplay} x {pricePerUnit}€
                  {item.discount && (
                    <span style={{ fontStyle: 'italic', marginLeft: '4px' }}>
                      REM -{item.discount.value}{item.discount.type === 'percentage' ? '%' : '€'}
                    </span>
                  )}
                </span>
                <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>
                  {item.total.toFixed(2)}€
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid #000', margin: '5px 0' }}></div>

      {/* Détail TVA par taux (comme Lidl) - CENTRÉ */}
      <div className="text-center" style={{ fontSize: '8.8px', marginBottom: '5px', fontWeight: '900' }}>
        <div style={{ fontWeight: '900', marginBottom: '2px' }}>DETAIL TVA:</div>
        {Object.entries(vatByRate).map(([rate, amounts]) => (
          <div key={rate} style={{ marginBottom: '1px', fontSize: '7.8px' }}>
            {parseFloat(rate).toFixed(0)}% sur {amounts.totalHT.toFixed(2)}€ = {amounts.totalVAT.toFixed(2)}€
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }}></div>

      {/* Totaux */}
      <div style={{ fontSize: '9.8px', marginBottom: '3px', fontWeight: '900', paddingRight: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px', gap: '3px' }}>
          <span>SOUS-TOTAL HT</span>
          <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{sale.subtotal.toFixed(2)}€</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px', gap: '3px' }}>
          <span>TVA TOTALE</span>
          <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{(sale.totalVat || sale.total_vat || 0).toFixed(2)}€</span>
        </div>
        {(sale.totalDiscount || sale.total_discount || 0) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px', gap: '3px' }}>
            <span>REMISE</span>
            <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>-{(sale.totalDiscount || sale.total_discount || 0).toFixed(2)}€</span>
          </div>
        )}
      </div>

      {/* Total principal - Style Lidl */}
      <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '3px 2px', margin: '5px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14.6px', fontWeight: '900', gap: '6px' }}>
          <span>TOTAL</span>
          <span style={{ whiteSpace: 'nowrap' }}>{sale.total.toFixed(2)}€</span>
        </div>
      </div>

      {/* Payment */}
      <div style={{ fontSize: '9.8px', marginTop: '5px', marginBottom: '5px', fontWeight: '900', paddingRight: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', marginBottom: '2px', gap: '3px' }}>
          <span style={{ flex: '1', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {(sale.paymentMethod || sale.payment_method) === 'cash' ? 'ESPECES' : 
             (sale.paymentMethod || sale.payment_method) === 'card' ? 'CARTE' : 'PAIEMENT'}
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>{sale.total.toFixed(2)}€</span>
        </div>
        {(sale.paymentMethod || sale.payment_method) === 'cash' && (sale.amountPaid || sale.amount_paid) && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.8px', gap: '3px' }}>
              <span>Reçu</span>
              <span style={{ whiteSpace: 'nowrap' }}>{(sale.amountPaid || sale.amount_paid || 0).toFixed(2)}€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.8px', fontWeight: '900', gap: '3px' }}>
              <span>Rendu</span>
              <span style={{ whiteSpace: 'nowrap' }}>{(sale.change || sale.change_amount || 0).toFixed(2)}€</span>
            </div>
          </>
        )}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

      {/* Footer */}
      <div className="text-center" style={{ marginTop: '6px', fontWeight: '900' }}>
        {isInvoice ? (
          <div style={{ fontSize: '8.8px' }}>
            <div style={{ fontWeight: '900', marginBottom: '2px' }}>FACTURE</div>
            <div>Payable sous 30 jours</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '12.7px', fontWeight: '900', letterSpacing: '0.5px', marginBottom: '2px' }}>
              MERCI DE VOTRE VISITE
            </div>
            <div style={{ fontSize: '10.7px', fontWeight: '900' }}>
              A BIENTOT !
            </div>
          </div>
        )}
        <div style={{ fontSize: '7.8px', marginTop: '5px', color: '#666', fontWeight: '800' }}>
          www.JLprod.be
        </div>
      </div>
    </div>
  );
}

export function printThermalReceipt() {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les popups pour imprimer');
    return;
  }

  const receiptContent = document.getElementById('thermal-receipt');
  if (!receiptContent) return;

  // Commande ESC/POS pour ouvrir le tiroir-caisse: ESC p 0 25 250
  const cashDrawerCommand = String.fromCharCode(27, 112, 0, 25, 250);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket de caisse</title>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            width: 80mm;
            max-width: 302px;
            background: white;
            color: black;
          }
          
          #thermal-receipt {
            width: 100%;
            padding: 8px;
            background: white;
            color: black;
          }
          
          .border-dashed {
            border-style: dashed !important;
          }
          
          .border-double {
            border-style: double !important;
          }
          
          .border-black {
            border-color: black !important;
          }
          
          .font-black {
            font-weight: 900 !important;
          }
          
          .font-bold {
            font-weight: 700 !important;
          }
          
          .font-semibold {
            font-weight: 600 !important;
          }
          
          .uppercase {
            text-transform: uppercase !important;
          }
          
          .tracking-wider {
            letter-spacing: 0.05em !important;
          }
          
          .tracking-wide {
            letter-spacing: 0.025em !important;
          }
          
          @media print {
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            #thermal-receipt {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <pre style="font-family:monospace;font-size:1px;margin:0;padding:0;position:absolute;opacity:0;">${cashDrawerCommand}</pre>
        ${receiptContent.innerHTML}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Attendre que le contenu soit chargé avant d'imprimer
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 250);
}
