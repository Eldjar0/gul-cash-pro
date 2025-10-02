import { COMPANY_INFO } from '@/data/company';
import { Product } from '@/hooks/useProducts';

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
  
  return (
    <div 
      id="thermal-receipt"
      className="font-mono text-xs bg-white text-black p-4"
      style={{ 
        width: '80mm',
        maxWidth: '302px',
        margin: '0 auto',
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        lineHeight: '1.5'
      }}
    >
      {/* Header - Company Info */}
      <div className="text-center pb-3 mb-3">
        <div className="text-xl font-black uppercase mb-2" style={{ letterSpacing: '0.05em' }}>
          {COMPANY_INFO.name}
        </div>
        <div className="text-sm font-semibold">{COMPANY_INFO.address}</div>
        <div className="text-sm font-semibold">{COMPANY_INFO.postalCode} {COMPANY_INFO.city}</div>
        <div className="text-sm mt-2">TVA: {COMPANY_INFO.vat}</div>
        {COMPANY_INFO.phone && <div className="text-sm">Tel: {COMPANY_INFO.phone}</div>}
        {COMPANY_INFO.email && <div className="text-sm">{COMPANY_INFO.email}</div>}
        <div className="border-b-2 border-black mt-3" style={{ borderStyle: 'dashed' }}></div>
      </div>

      {/* Customer info - Only for invoices */}
      {isInvoice && sale.customer && (
        <div className="mb-3 pb-2 border-b border-dashed border-black">
          <div className="font-bold mb-1">CLIENT:</div>
          <div className="font-bold">{sale.customer.name}</div>
          {sale.customer.vat_number && (
            <div className="text-[10px]">TVA: {sale.customer.vat_number}</div>
          )}
          {sale.customer.address && (
            <div className="text-[10px]">{sale.customer.address}</div>
          )}
          {(sale.customer.postal_code || sale.customer.city) && (
            <div className="text-[10px]">
              {sale.customer.postal_code} {sale.customer.city}
            </div>
          )}
        </div>
      )}

      {/* Sale info - Big Title */}
      <div className="mb-3 pb-3">
        <div className="text-center mb-3">
          <div className="text-2xl font-black uppercase mb-1" style={{ letterSpacing: '0.1em' }}>
            {isInvoice ? '■ FACTURE ■' : '■ TICKET ■'}
          </div>
          <div className="text-lg font-bold">{sale.saleNumber || sale.sale_number}</div>
        </div>
        
        <div className="text-center space-y-1">
          <div className="text-base font-bold">
            {saleDate.toLocaleDateString('fr-BE', { 
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            }).toUpperCase()}
          </div>
          <div className="text-xl font-black" style={{ letterSpacing: '0.05em' }}>
            {saleDate.toLocaleTimeString('fr-BE', { 
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        <div className="border-b-2 border-black mt-3" style={{ borderStyle: 'dashed' }}></div>
      </div>

      {/* Items */}
      <div className="mb-3 pb-3">
        <div className="text-center text-base font-black mb-2" style={{ letterSpacing: '0.05em' }}>
          ARTICLES
        </div>
        <div className="border-b border-black mb-2"></div>
        
        {sale.items.map((item, index) => (
          <div key={index} className="mb-3 pb-2 border-b border-black" style={{ borderStyle: 'dotted' }}>
            <div className="font-bold text-sm mb-1">{item.product.name}</div>
            <div className="flex justify-between text-sm">
              <span>
                {item.product.price.toFixed(2)}€ x {item.quantity.toFixed(item.product.type === 'weight' ? 3 : 0)}
                {item.product.type === 'weight' && 'kg'}
              </span>
              <span className="font-bold">{item.subtotal.toFixed(2)}€</span>
            </div>
            {item.discount && (
              <div className="text-xs mt-1">
                Remise: -{item.discount.value}
                {item.discount.type === 'percentage' ? '%' : '€'}
              </div>
            )}
            <div className="flex justify-between text-xs mt-1">
              <span>TVA {item.product.vat_rate}%</span>
              <span>{item.vatAmount.toFixed(2)}€</span>
            </div>
          </div>
        ))}
        <div className="border-b-2 border-black"></div>
      </div>

      {/* Totals - Clean and organized */}
      <div className="mb-3 pb-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span>SOUS-TOTAL HT:</span>
          <span className="font-bold">{sale.subtotal.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>TVA:</span>
          <span className="font-bold">{(sale.totalVat || sale.total_vat || 0).toFixed(2)} €</span>
        </div>
        {(sale.totalDiscount || sale.total_discount || 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span>REMISE TOTALE:</span>
            <span className="font-bold">-{(sale.totalDiscount || sale.total_discount || 0).toFixed(2)} €</span>
          </div>
        )}
        
        <div className="border-t-2 border-black pt-2 mt-2" style={{ borderStyle: 'double' }}>
          <div className="flex justify-between items-center">
            <span className="text-xl font-black">TOTAL TTC:</span>
            <span className="text-2xl font-black">{sale.total.toFixed(2)} €</span>
          </div>
        </div>
        <div className="border-b-2 border-black"></div>
      </div>

      {/* Payment info - Big and clear */}
      <div className="mb-4 pb-3 space-y-2">
        <div className="text-center mb-2">
          <div className="text-base font-black mb-1" style={{ letterSpacing: '0.05em' }}>
            MODE DE PAIEMENT
          </div>
          <div className="text-xl font-black uppercase bg-black text-white py-2 px-3" style={{ letterSpacing: '0.1em' }}>
            {(sale.paymentMethod || sale.payment_method) === 'cash' 
              ? '💵 ESPECES' 
              : (sale.paymentMethod || sale.payment_method) === 'card' 
              ? '💳 CARTE BANCAIRE' 
              : '📱 PAIEMENT MOBILE'}
          </div>
        </div>
        
        {(sale.paymentMethod || sale.payment_method) === 'cash' && (sale.amountPaid || sale.amount_paid) && (
          <div className="space-y-2 mt-3">
            <div className="flex justify-between text-base">
              <span className="font-bold">TOTAL A PAYER:</span>
              <span className="font-black">{sale.total.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-bold">MONTANT RECU:</span>
              <span className="font-black">{(sale.amountPaid || sale.amount_paid || 0).toFixed(2)} €</span>
            </div>
            <div className="border-t-2 border-black pt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-black">MONNAIE RENDUE:</span>
                <span className="text-2xl font-black">{(sale.change || sale.change_amount || 0).toFixed(2)} €</span>
              </div>
            </div>
          </div>
        )}
        <div className="border-b-2 border-black mt-3"></div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 pt-4">
        {isInvoice ? (
          <>
            <div className="text-xs mb-2 font-semibold">
              Facture conforme aux dispositions legales
            </div>
            <div className="text-xs font-semibold">
              Payable sous 30 jours
            </div>
          </>
        ) : (
          <>
            <div className="text-lg font-black mb-2" style={{ letterSpacing: '0.1em' }}>
              ★ MERCI DE VOTRE VISITE ★
            </div>
            <div className="text-base font-bold mb-3">A TRES BIENTOT!</div>
          </>
        )}
        <div className="border-t-2 border-black pt-3 mt-3" style={{ borderStyle: 'dashed' }}>
          <div className="text-xs">
            Ticket edite le {saleDate.toLocaleDateString('fr-BE')} a {saleDate.toLocaleTimeString('fr-BE')}
          </div>
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

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket de caisse</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          @media print {
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
            }
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            width: 80mm;
          }
        </style>
      </head>
      <body>
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
