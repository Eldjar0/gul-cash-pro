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
        fontFamily: 'Courier New, Courier, monospace',
        fontSize: '13px',
        lineHeight: '1.4',
        padding: '8px 4px',
        fontWeight: '700'
      }}
    >
      {/* Logo centré */}
      <div className="text-center mb-2">
        <img 
          src={logoTicket} 
          alt="Logo" 
          style={{ 
            width: '180px', 
            height: 'auto', 
            margin: '0 auto',
            display: 'block'
          }} 
        />
      </div>

      {/* Company Info - centrée */}
      <div className="text-center mb-3" style={{ fontWeight: '700' }}>
        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
          <div>{COMPANY_INFO.address}</div>
          <div>{COMPANY_INFO.postalCode} {COMPANY_INFO.city}</div>
          {COMPANY_INFO.phone && <div>Tel: {COMPANY_INFO.phone}</div>}
          <div style={{ marginTop: '2px' }}>N° TVA: {COMPANY_INFO.vat}</div>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Customer info - Only for invoices */}
      {isInvoice && sale.customer && (
        <>
          <div style={{ fontSize: '11px', marginBottom: '8px', fontWeight: '700' }}>
            <div style={{ fontWeight: '900', marginBottom: '2px' }}>CLIENT:</div>
            <div style={{ fontWeight: '800' }}>{sale.customer.name}</div>
            {sale.customer.vat_number && <div>N° TVA: {sale.customer.vat_number}</div>}
            {sale.customer.address && <div>{sale.customer.address}</div>}
            {(sale.customer.postal_code || sale.customer.city) && (
              <div>{sale.customer.postal_code} {sale.customer.city}</div>
            )}
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>
        </>
      )}

      {/* Sale info */}
      <div style={{ fontSize: '11px', marginBottom: '8px', fontWeight: '700' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900' }}>
          <span>{isInvoice ? 'FACTURE' : 'TICKET'} N°:</span>
          <span style={{ fontSize: '13px' }}>{sale.saleNumber || sale.sale_number}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span>DATE:</span>
          <span>{saleDate.toLocaleString('fr-BE', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Items - Style Lidl */}
      <div style={{ marginBottom: '8px' }}>
        {sale.items.map((item, index) => {
          const unitDisplay = item.product.type === 'weight' ? 'kg' : 'pc';
          const qtyDisplay = item.quantity.toFixed(item.product.type === 'weight' ? 3 : 0);
          const pricePerUnit = item.product.price.toFixed(2);
          
          return (
            <div key={index} style={{ marginBottom: '6px', fontSize: '12px' }}>
              {/* Nom du produit */}
              <div style={{ fontWeight: '900', textTransform: 'uppercase', marginBottom: '1px' }}>
                {item.product.name}
              </div>
              
              {/* Ligne avec quantité, prix unitaire et total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                <span>
                  {qtyDisplay} {unitDisplay} x {pricePerUnit}€
                </span>
                <span style={{ fontWeight: '900' }}>
                  {item.total.toFixed(2)}€
                </span>
              </div>
              
              {/* TVA du produit */}
              <div style={{ fontSize: '10px', fontWeight: '700' }}>
                TVA {item.product.vat_rate}%
              </div>
              
              {/* Remise si applicable */}
              {item.discount && (
                <div style={{ fontSize: '11px', fontWeight: '800', fontStyle: 'italic' }}>
                  REMISE -{item.discount.value}{item.discount.type === 'percentage' ? '%' : '€'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid #000', margin: '8px 0' }}></div>

      {/* Détail TVA par taux (comme Lidl) */}
      <div style={{ fontSize: '11px', marginBottom: '8px', fontWeight: '700' }}>
        <div style={{ fontWeight: '900', marginBottom: '3px' }}>DETAIL TVA:</div>
        {Object.entries(vatByRate).map(([rate, amounts]) => (
          <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px' }}>
            <span>
              {parseFloat(rate).toFixed(0)}% sur {amounts.totalHT.toFixed(2)}€
            </span>
            <span style={{ fontWeight: '800' }}>
              {amounts.totalVAT.toFixed(2)}€
            </span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Totaux */}
      <div style={{ fontSize: '12px', marginBottom: '4px', fontWeight: '700' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>SOUS-TOTAL HT</span>
          <span style={{ fontWeight: '800' }}>{sale.subtotal.toFixed(2)}€</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>TVA TOTALE</span>
          <span style={{ fontWeight: '800' }}>{(sale.totalVat || sale.total_vat || 0).toFixed(2)}€</span>
        </div>
        {(sale.totalDiscount || sale.total_discount || 0) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>REMISE</span>
            <span style={{ fontWeight: '800' }}>-{(sale.totalDiscount || sale.total_discount || 0).toFixed(2)}€</span>
          </div>
        )}
      </div>

      {/* Total principal - Style Lidl */}
      <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '8px 0', margin: '8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900' }}>
          <span>TOTAL</span>
          <span>{sale.total.toFixed(2)}€</span>
        </div>
      </div>

      {/* Payment */}
      <div style={{ fontSize: '12px', marginTop: '8px', marginBottom: '8px', fontWeight: '700' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', marginBottom: '2px' }}>
          <span>
            {(sale.paymentMethod || sale.payment_method) === 'cash' ? 'ESPECES' : 
             (sale.paymentMethod || sale.payment_method) === 'card' ? 'CARTE BANCAIRE' : 'PAIEMENT MOBILE'}
          </span>
          <span>{sale.total.toFixed(2)}€</span>
        </div>
        {(sale.paymentMethod || sale.payment_method) === 'cash' && (sale.amountPaid || sale.amount_paid) && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>Reçu</span>
              <span>{(sale.amountPaid || sale.amount_paid || 0).toFixed(2)}€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800' }}>
              <span>Rendu</span>
              <span>{(sale.change || sale.change_amount || 0).toFixed(2)}€</span>
            </div>
          </>
        )}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }}></div>

      {/* Footer */}
      <div className="text-center" style={{ marginTop: '12px', fontWeight: '700' }}>
        {isInvoice ? (
          <div style={{ fontSize: '11px' }}>
            <div style={{ fontWeight: '900', marginBottom: '2px' }}>FACTURE</div>
            <div>Payable sous 30 jours</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px', marginBottom: '3px' }}>
              MERCI DE VOTRE VISITE
            </div>
            <div style={{ fontSize: '13px', fontWeight: '900' }}>
              A BIENTOT !
            </div>
          </div>
        )}
        <div style={{ fontSize: '10px', marginTop: '8px', color: '#666', fontWeight: '600' }}>
          www.jlprod.be
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
