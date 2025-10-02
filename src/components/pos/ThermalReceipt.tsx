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
      <div className="text-center pb-3 mb-4">
        <div className="text-xl font-black tracking-wider mb-2">
          {COMPANY_INFO.name}
        </div>
        <div className="text-[10px]">{COMPANY_INFO.address}</div>
        <div className="text-[10px]">{COMPANY_INFO.postalCode} {COMPANY_INFO.city}</div>
        {COMPANY_INFO.phone && <div className="text-[10px]">Tel: {COMPANY_INFO.phone}</div>}
        <div className="text-[10px] mt-1 font-bold">TVA: {COMPANY_INFO.vat}</div>
        <div className="border-t border-dashed border-black mt-3"></div>
      </div>

      {/* Customer info - Only for invoices */}
      {isInvoice && sale.customer && (
        <>
          <div className="border-t border-dashed border-black my-2"></div>
          <div className="text-[10px] mb-2">
            <p className="font-bold">CLIENT</p>
            <p className="font-semibold">{sale.customer.name}</p>
            {sale.customer.vat_number && <p>TVA: {sale.customer.vat_number}</p>}
            {sale.customer.address && <p>{sale.customer.address}</p>}
            {(sale.customer.postal_code || sale.customer.city) && (
              <p>{sale.customer.postal_code} {sale.customer.city}</p>
            )}
          </div>
        </>
      )}

      {/* Sale info */}
      <div className="border-t border-dashed border-black my-2"></div>
      <div className="text-[10px] mb-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold">{isInvoice ? 'FACTURE' : 'TICKET'}</span>
          <span className="text-base font-black">{sale.saleNumber || sale.sale_number}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="font-semibold">DATE</span>
          <span className="font-semibold">{saleDate.toLocaleString('fr-BE', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      {/* Items */}
      <div className="border-t border-dashed border-black my-2"></div>
      <div className="mb-3">
        {sale.items.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between leading-tight">
              <span className="flex-1 uppercase text-xs font-black tracking-wide">{item.product.name}</span>
            </div>
            <div className="flex justify-between text-[10px] mt-0.5">
              <span className="font-semibold">
                {item.quantity.toFixed(item.product.type === 'weight' ? 3 : 0)}
                {item.product.type === 'weight' ? 'kg' : 'x'}
                {item.product.type === 'weight' ? '' : ` ${item.product.price.toFixed(2)}€`}
              </span>
              <span className="font-black">{item.subtotal.toFixed(2)}</span>
            </div>
            {item.discount && (
              <div className="text-[9px] font-bold italic">
                REMISE -{item.discount.value}{item.discount.type === 'percentage' ? '%' : '€'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dashed border-black my-2"></div>
      <div className="text-[10px] space-y-1">
        <div className="flex justify-between">
          <span className="font-semibold">SOUS-TOTAL HT</span>
          <span className="font-semibold">{sale.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">TVA</span>
          <span className="font-semibold">{(sale.totalVat || sale.total_vat || 0).toFixed(2)}</span>
        </div>
        {(sale.totalDiscount || sale.total_discount || 0) > 0 && (
          <div className="flex justify-between">
            <span className="font-semibold">REMISE TOTALE</span>
            <span className="font-semibold">-{(sale.totalDiscount || sale.total_discount || 0).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Total principal */}
      <div className="border-t-4 border-double border-black mt-2 pt-2">
        <div className="flex justify-between text-lg font-black tracking-wide">
          <span>TOTAL EUR</span>
          <span>{sale.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="border-t border-dashed border-black mt-3 pt-2">
        <div className="text-[10px] space-y-1">
          <div className="flex justify-between">
            <span className="font-black">
              {(sale.paymentMethod || sale.payment_method) === 'cash' ? 'ESPECES' : 
               (sale.paymentMethod || sale.payment_method) === 'card' ? 'CARTE BANCAIRE' : 'PAIEMENT MOBILE'}
            </span>
            <span className="font-black">{sale.total.toFixed(2)}</span>
          </div>
          {(sale.paymentMethod || sale.payment_method) === 'cash' && (sale.amountPaid || sale.amount_paid) && (
            <>
              <div className="flex justify-between">
                <span className="font-bold">RECU</span>
                <span className="font-bold">{(sale.amountPaid || sale.amount_paid || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">RENDU MONNAIE</span>
                <span className="font-bold">{(sale.change || sale.change_amount || 0).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 pt-3 border-t border-dashed border-black">
        {isInvoice ? (
          <div className="text-[10px] space-y-1">
            <p className="font-bold">FACTURE</p>
            <p className="font-semibold">Payable sous 30 jours</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-black tracking-wide">MERCI DE VOTRE VISITE</p>
            <p className="text-xs font-bold">A BIENTOT</p>
          </div>
        )}
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
